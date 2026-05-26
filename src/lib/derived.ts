// Calculs dérivés portés de dashboard/app.py (benevole_detail, structure_detail, activite_detail).
// Fonctions pures, testables indépendamment.

import type {
  PegassBenevole,
  PegassMission,
  ProcessedData
} from './types';

function normalizeStatut(statut: string): string {
  return statut
    .trim()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toUpperCase();
}

export interface CoequipierActivite {
  activiteId: string;
  nom: string;
  date: string;
  groupeAction: string;
  externe: boolean;
  structure: string;
}

export interface Coequipier {
  id: string;
  nom: string;
  prenom: string;
  structure: string;
  nb_activites: number;
  est_local: boolean;
  activites: CoequipierActivite[];
}

export function computeHeuresLocalesExternesParMois(
  benevole: PegassBenevole
): { locales: Record<string, number>; externes: Record<string, number> } {
  const locales: Record<string, number> = {};
  const externes: Record<string, number> = {};
  for (const m of benevole.missions ?? []) {
    const mois = (m.date ?? '').slice(0, 7);
    if (!mois) continue;
    const h = m.heures ?? 0;
    if (m.externe) externes[mois] = (externes[mois] ?? 0) + h;
    else locales[mois] = (locales[mois] ?? 0) + h;
  }
  return { locales, externes };
}

/**
 * Calcule les top 10 co-équipiers d'un bénévole (port direct du code Python).
 */
export function computeTopCoequipiers(
  benevoleId: string,
  data: ProcessedData,
  limit = 10
): Coequipier[] {
  const me = data.benevoles.find((b) => b.id === benevoleId);
  if (!me) return [];

  const mesActivites = new Set<string>();
  for (const m of me.missions ?? []) {
    if (m.activiteId) mesActivites.add(m.activiteId);
  }

  const structureLocale = data.metadata.unite_locale ?? '';
  const coequipiers: Coequipier[] = [];

  for (const autre of data.benevoles) {
    if (autre.id === benevoleId) continue;

    const activitesCommunes = new Set<string>();
    for (const m of autre.missions ?? []) {
      if (m.activiteId && mesActivites.has(m.activiteId)) {
        activitesCommunes.add(m.activiteId);
      }
    }
    if (activitesCommunes.size === 0) continue;

    const activitesDetails: CoequipierActivite[] = [];
    for (const m of me.missions ?? []) {
      if (m.activiteId && activitesCommunes.has(m.activiteId)) {
        activitesDetails.push({
          activiteId: m.activiteId,
          nom: m.nom ?? '',
          date: m.date ?? '',
          groupeAction: m.groupeAction ?? '',
          externe: m.externe ?? false,
          structure: m.structure ?? ''
        });
      }
    }
    activitesDetails.sort((a, b) => b.date.localeCompare(a.date));

    const autreStructure = autre.structure ?? '';
    const estLocal = !!structureLocale && autreStructure.includes(structureLocale);

    coequipiers.push({
      id: autre.id,
      nom: autre.nom ?? '',
      prenom: autre.prenom ?? '',
      structure: autreStructure,
      nb_activites: activitesCommunes.size,
      est_local: estLocal,
      activites: activitesDetails
    });
  }

  coequipiers.sort((a, b) => b.nb_activites - a.nb_activites);
  return coequipiers.slice(0, limit);
}

export interface StructureActivite {
  id: string;
  nom: string;
  groupeAction: string;
  date: string;
  heures: number;
  nb_benevoles: number;
}

export interface StructureBenevole {
  id: string;
  nom: string;
  prenom: string;
  heures: number;
  nb_activites: number;
}

export interface StructureDetail {
  activites: StructureActivite[];
  benevoles: StructureBenevole[];
  benevoles_par_activite: Record<
    string,
    Array<{ id: string; nom: string; prenom: string; heures: number }>
  >;
  total_heures: number;
  nb_activites: number;
  nb_benevoles: number;
}

/**
 * Agrège toutes les activités/bénévoles d'une structure externe donnée.
 */
export function computeStructureDetail(
  structureNom: string,
  data: ProcessedData
): StructureDetail | null {
  const activites = new Map<string, StructureActivite>();
  const benevolesParActivite = new Map<
    string,
    Array<{ id: string; nom: string; prenom: string; heures: number }>
  >();
  const benevolesUniques = new Map<string, StructureBenevole>();
  let totalHeures = 0;

  for (const b of data.benevoles) {
    for (const m of b.missions ?? []) {
      if (!m.externe || m.structure !== structureNom) continue;
      const aid = m.activiteId ?? '';
      const h = m.heures ?? 0;

      if (aid && !activites.has(aid)) {
        activites.set(aid, {
          id: aid,
          nom: m.nom ?? 'Activité',
          groupeAction: m.groupeAction ?? '',
          date: m.date ?? '',
          heures: 0,
          nb_benevoles: 0
        });
        benevolesParActivite.set(aid, []);
      }

      if (aid) {
        const act = activites.get(aid)!;
        act.heures += h;
        const list = benevolesParActivite.get(aid)!;
        if (!list.some((x) => x.id === b.id)) {
          act.nb_benevoles += 1;
          list.push({
            id: b.id,
            nom: b.nom ?? '',
            prenom: b.prenom ?? '',
            heures: h
          });
        }
      }

      let bu = benevolesUniques.get(b.id);
      if (!bu) {
        bu = {
          id: b.id,
          nom: b.nom ?? '',
          prenom: b.prenom ?? '',
          heures: 0,
          nb_activites: 0
        };
        benevolesUniques.set(b.id, bu);
      }
      bu.heures += h;
      totalHeures += h;
    }
  }

  for (const [aid, list] of benevolesParActivite.entries()) {
    for (const bv of list) {
      const bu = benevolesUniques.get(bv.id);
      if (bu) bu.nb_activites += 1;
    }
    // aid utilisé seulement pour la lecture
    void aid;
  }

  const activitesList = [...activites.values()].sort((a, b) => b.date.localeCompare(a.date));
  const benevolesList = [...benevolesUniques.values()].sort((a, b) => b.heures - a.heures);

  if (activitesList.length === 0 && benevolesList.length === 0) return null;

  const benevolesParActiviteObj: Record<
    string,
    Array<{ id: string; nom: string; prenom: string; heures: number }>
  > = {};
  for (const [aid, list] of benevolesParActivite.entries()) {
    benevolesParActiviteObj[aid] = list;
  }

  return {
    activites: activitesList,
    benevoles: benevolesList,
    benevoles_par_activite: benevolesParActiviteObj,
    total_heures: Math.round(totalHeures * 100) / 100,
    nb_activites: activites.size,
    nb_benevoles: benevolesUniques.size
  };
}

export interface Participation {
  benevole_id: string;
  benevole_nom: string;
  benevole_prenom: string;
  date: string;
  debut: string;
  fin: string;
  heures: number;
  statut: string;
}

export interface ActiviteDetail {
  info: {
    id: string;
    nom: string;
    type: string;
    groupeAction: string;
    structure: string;
    externe: boolean;
  };
  participations: Participation[];
  total_heures: number;
  benevoles_uniques: number;
  nb_seances: number;
}

/**
 * Agrège toutes les participations à une activité.
 */
export function computeActiviteDetail(
  activiteId: string,
  data: ProcessedData
): ActiviteDetail | null {
  let info: ActiviteDetail['info'] | null = null;
  const participations: Participation[] = [];

  for (const b of data.benevoles) {
    for (const m of b.missions ?? []) {
      if (m.activiteId !== activiteId) continue;
      if (!info) {
        info = {
          id: activiteId,
          nom: m.nom ?? 'Activité',
          type: m.type ?? '',
          groupeAction: m.groupeAction ?? '',
          structure: m.structure ?? '',
          externe: m.externe ?? false
        };
      }
      participations.push({
        benevole_id: b.id,
        benevole_nom: b.nom ?? '',
        benevole_prenom: b.prenom ?? '',
        date: m.date ?? '',
        debut: m.debut ?? '',
        fin: m.fin ?? '',
        heures: m.heures ?? 0,
        statut: m.statut ?? ''
      });
    }
  }

  if (!info) return null;

  participations.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.benevole_nom.localeCompare(b.benevole_nom);
  });

  const totalHeures = participations.reduce((s, p) => s + p.heures, 0);
  const seances = new Set<string>();
  const benevolesUniques = new Set<string>();
  for (const p of participations) {
    seances.add(`${p.date}|${p.debut}|${p.fin}`);
    benevolesUniques.add(p.benevole_id);
  }

  return {
    info,
    participations,
    total_heures: totalHeures,
    benevoles_uniques: benevolesUniques.size,
    nb_seances: seances.size
  };
}

/** Tri décroissant par date pour l'historique des missions d'un bénévole. */
export function sortMissionsByDateDesc(missions: PegassMission[]): PegassMission[] {
  return [...missions].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
}

/** Indique si un événement est annulé (statut Pegass : « Annulée », etc.). */
export function isEvenementAnnule(statut: string | null | undefined): boolean {
  if (!statut) return false;
  const s = normalizeStatut(statut);
  return s === 'ANNULEE' || s === 'ANNULE' || s.startsWith('ANNULE');
}

/** @deprecated Utiliser {@link isEvenementAnnule} */
export const isMissionAnnulee = isEvenementAnnule;

export interface ActivityAnnulationRatio {
  nom: string;
  total: number;
  annulees: number;
  /** Pourcentage 0–100 */
  ratio: number;
}

/**
 * Ratio d'annulation par nom d'activité (événements / séances du JSON extracteur).
 * Exclut les activités sans aucun événement annulé.
 */
export function computeAnnulationRatioByActivityName(
  data: ProcessedData
): ActivityAnnulationRatio[] {
  const byName = new Map<string, { total: number; annulees: number }>();

  for (const e of data.evenements) {
    const nom = (e.nom ?? '').trim() || 'Sans nom';
    let entry = byName.get(nom);
    if (!entry) {
      entry = { total: 0, annulees: 0 };
      byName.set(nom, entry);
    }
    entry.total += 1;
    if (isEvenementAnnule(e.statut)) {
      entry.annulees += 1;
    }
  }

  return [...byName.entries()]
    .filter(([, v]) => v.annulees > 0)
    .map(([nom, v]) => ({
      nom,
      total: v.total,
      annulees: v.annulees,
      ratio: v.total > 0 ? Math.round((v.annulees / v.total) * 1000) / 10 : 0
    }))
    .sort((a, b) => b.ratio - a.ratio || b.annulees - a.annulees);
}
