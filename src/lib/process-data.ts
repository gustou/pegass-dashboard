// Port TypeScript de dashboard/app.py: process_data() et deduplicate_missions().
// Aucune dépendance externe — peut tourner dans le navigateur ou sous Node (tests).

import type {
  DuplicateMission,
  PegassBenevole,
  PegassEvenement,
  PegassMission,
  PegassRawData,
  ProcessedData,
  StructureExterneStats,
  TopBenevole
} from './types';

export interface DeduplicateResult {
  removed: number;
  duplicates: DuplicateMission[];
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * Supprime les missions en doublon (même debut + même fin) pour chaque bénévole
 * et recalcule les agrégats d'heures. Mute les bénévoles passés. Retourne le
 * nombre total de doublons supprimés.
 */
export function deduplicateMissions(benevoles: PegassBenevole[]): DeduplicateResult {
  let totalDuplicatesRemoved = 0;
  const duplicates: DuplicateMission[] = [];

  for (const b of benevoles) {
    const missions = b.missions ?? [];
    if (missions.length === 0) continue;

    const seen = new Set<string>();
    const unique: PegassMission[] = [];
    let removed = 0;

    for (const m of missions) {
      const key = `${m.debut ?? ''}|${m.fin ?? ''}`;
      if (seen.has(key)) {
        removed += 1;
        duplicates.push({
          benevole_id: b.id,
          benevole_nom: b.nom ?? '',
          benevole_prenom: b.prenom ?? '',
          mission: { ...m }
        });
        continue;
      }
      seen.add(key);
      unique.push(m);
    }

    b.missions = unique;

    let heuresTotal = 0;
    let heuresLocales = 0;
    let heuresExternes = 0;
    const parMois: Record<string, number> = {};
    const parType: Record<string, number> = {};

    for (const m of unique) {
      const h = m.heures ?? 0;
      heuresTotal += h;
      if (m.externe) heuresExternes += h;
      else heuresLocales += h;

      const mois = (m.date ?? '').slice(0, 7);
      if (mois) parMois[mois] = (parMois[mois] ?? 0) + h;

      const type = m.groupeAction || 'Autre';
      parType[type] = (parType[type] ?? 0) + h;
    }

    b.heures = {
      total: round2(heuresTotal),
      locales: round2(heuresLocales),
      externes: round2(heuresExternes),
      par_mois: mapValues(parMois, round2),
      par_type: mapValues(parType, round2)
    };

    if (removed > 0) {
      totalDuplicatesRemoved += removed;
    }
  }

  return { removed: totalDuplicatesRemoved, duplicates };
}

function mapValues<V, R>(obj: Record<string, V>, fn: (v: V) => R): Record<string, R> {
  const out: Record<string, R> = {};
  for (const [k, v] of Object.entries(obj)) out[k] = fn(v);
  return out;
}

function sortKeysAsc<V>(obj: Record<string, V>): Record<string, V> {
  const out: Record<string, V> = {};
  for (const k of Object.keys(obj).sort()) out[k] = obj[k]!;
  return out;
}

/**
 * Traite les données brutes Pegass et calcule toutes les statistiques agrégées.
 * Port direct de process_data() côté Flask.
 */
function matchesActivityFilter(groupeAction: string | undefined, activityFilter: string[]): boolean {
  if (activityFilter.length === 0) return true;
  const type = groupeAction || 'Autre';
  return activityFilter.includes(type);
}

export function processData(raw: PegassRawData, activityFilter: string[] = []): ProcessedData {
  const benevoles: PegassBenevole[] = (raw.benevoles ?? []).map(b => ({
    ...b,
    missions: b.missions
      ? b.missions.filter((m) => matchesActivityFilter(m.groupeAction, activityFilter))
      : []
  }));
  const evenements: PegassEvenement[] = (raw.evenements ?? []).filter((e) =>
    matchesActivityFilter(e.groupeAction, activityFilter)
  );
  const metadata = raw.metadata ?? {};

  const { removed: duplicatesRemoved, duplicates } = deduplicateMissions(benevoles);

  let heuresParMois: Record<string, number> = {};
  let heuresLocalesParMois: Record<string, number> = {};
  let heuresExternesParMois: Record<string, number> = {};
  const heuresParType: Record<string, number> = {};

  for (const b of benevoles) {
    const heures = b.heures;
    if (heures) {
      for (const [mois, h] of Object.entries(heures.par_mois ?? {})) {
        heuresParMois[mois] = (heuresParMois[mois] ?? 0) + h;
      }
      for (const [type, h] of Object.entries(heures.par_type ?? {})) {
        heuresParType[type] = (heuresParType[type] ?? 0) + h;
      }
    }

    for (const m of b.missions ?? []) {
      const mois = (m.date ?? '').slice(0, 7);
      if (!mois) continue;
      const h = m.heures ?? 0;
      if (m.externe) {
        heuresExternesParMois[mois] = (heuresExternesParMois[mois] ?? 0) + h;
      } else {
        heuresLocalesParMois[mois] = (heuresLocalesParMois[mois] ?? 0) + h;
      }
    }
  }

  heuresParMois = sortKeysAsc(heuresParMois);
  heuresLocalesParMois = sortKeysAsc(heuresLocalesParMois);
  heuresExternesParMois = sortKeysAsc(heuresExternesParMois);

  // Top 10 bénévoles par heures totales
  const topBenevolesRaw = [...benevoles]
    .sort((a, b) => (b.heures?.total ?? 0) - (a.heures?.total ?? 0))
    .slice(0, 10);

  const topBenevoles: TopBenevole[] = topBenevolesRaw.map((b) => ({
    id: b.id,
    nom: b.nom ?? '',
    prenom: b.prenom ?? '',
    heures: b.heures?.total ?? 0,
    heures_locales: b.heures?.locales ?? 0,
    heures_externes: b.heures?.externes ?? 0,
    nb_activites: (b.missions ?? []).length
  }));

  // Totaux globaux
  let totalHeures = 0;
  let heuresLocales = 0;
  let heuresExternes = 0;
  let totalMissions = 0;
  let missionsLocales = 0;
  let missionsExternes = 0;
  let benevolesActifs = 0;

  for (const b of benevoles) {
    const t = b.heures?.total ?? 0;
    totalHeures += t;
    heuresLocales += b.heures?.locales ?? 0;
    heuresExternes += b.heures?.externes ?? 0;
    if (t > 0) benevolesActifs += 1;
    const m = b.missions ?? [];
    totalMissions += m.length;
    for (const mission of m) {
      if (mission.externe) missionsExternes += 1;
      else missionsLocales += 1;
    }
  }

  // Stats par structure externe
  const structuresMap = new Map<
    string,
    { nom: string; heures: number; activites: Set<string>; benevoles: Set<string> }
  >();

  for (const b of benevoles) {
    for (const m of b.missions ?? []) {
      if (!m.externe || !m.structure) continue;
      const nom = m.structure;
      let entry = structuresMap.get(nom);
      if (!entry) {
        entry = { nom, heures: 0, activites: new Set(), benevoles: new Set() };
        structuresMap.set(nom, entry);
      }
      entry.heures += m.heures ?? 0;
      if (m.activiteId) entry.activites.add(m.activiteId);
      entry.benevoles.add(b.id);
    }
  }

  const topStructuresExternes: StructureExterneStats[] = [...structuresMap.values()]
    .map((s) => ({
      nom: s.nom,
      heures: round2(s.heures),
      nb_activites: s.activites.size,
      nb_benevoles: s.benevoles.size
    }))
    .sort((a, b) => b.heures - a.heures);

  const structuresExternes = topStructuresExternes.map((s) => s.nom).sort();

  return {
    metadata,
    benevoles,
    evenements,
    duplicates_removed: duplicatesRemoved,
    duplicates,
    stats: {
      total_benevoles: benevoles.length,
      benevoles_actifs: benevolesActifs,
      total_heures: round2(totalHeures),
      heures_locales: round2(heuresLocales),
      heures_externes: round2(heuresExternes),
      total_missions: totalMissions,
      missions_locales: missionsLocales,
      missions_externes: missionsExternes,
      structures_externes: structuresExternes,
      top_structures_externes: topStructuresExternes.slice(0, 10),
      heures_par_mois: heuresParMois,
      heures_locales_par_mois: heuresLocalesParMois,
      heures_externes_par_mois: heuresExternesParMois,
      heures_par_type: heuresParType,
      top_benevoles: topBenevoles
    }
  };
}
