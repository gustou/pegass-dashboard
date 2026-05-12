// Port TypeScript de dashboard/csv_exporter.py.
// Génère un CSV des bénévoles avec filtres UL et secteur principal.

import type { PegassBenevole } from './types';

export type SecteurFilter = 'all' | 'urgence' | 'social';
export type SecteurPrincipal = 'Urgence' | 'Action Sociale' | 'Mixte' | 'Non déterminé';

export function determineSecteurPrincipal(
  heuresParType: Record<string, number> | undefined
): SecteurPrincipal {
  let heuresUrgence = 0;
  let heuresActionSociale = 0;
  for (const [type, h] of Object.entries(heuresParType ?? {})) {
    const t = type.toLowerCase();
    if (t.includes('urgence') || t.includes('secourisme')) heuresUrgence += h;
    else if (t.includes('social') || t.includes('action sociale')) heuresActionSociale += h;
  }
  if (heuresUrgence > heuresActionSociale) return 'Urgence';
  if (heuresActionSociale > heuresUrgence) return 'Action Sociale';
  if (heuresUrgence === heuresActionSociale && heuresUrgence > 0) return 'Mixte';
  return 'Non déterminé';
}

export interface CsvExportOptions {
  ulFilter?: string;
  secteurFilter?: SecteurFilter;
}

interface Row {
  NIVOL: string;
  Nom: string;
  'Prénom': string;
  Type: string;
  'Heures Total': string;
  'Urgence et Secourisme': string;
  'Action Sociale': string;
  Autres: string;
  'Secteur Principal': SecteurPrincipal;
}

const FIELDS: (keyof Row)[] = [
  'NIVOL',
  'Nom',
  'Prénom',
  'Type',
  'Heures Total',
  'Urgence et Secourisme',
  'Action Sociale',
  'Autres',
  'Secteur Principal'
];

function frNumber(n: number): string {
  return (Math.round(n * 100) / 100).toFixed(2).replace('.', ',');
}

function csvEscape(value: string): string {
  // Encadre la valeur de guillemets si elle contient ; " ou retour ligne ;
  // les guillemets internes sont doublés.
  if (/[;\"\n\r]/.test(value)) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

export function filterAndBuildRows(
  benevoles: PegassBenevole[],
  options: CsvExportOptions
): Row[] {
  const { ulFilter = '', secteurFilter = 'all' } = options;
  const ulUpper = ulFilter.trim().toUpperCase();

  const rows: Row[] = [];
  for (const b of benevoles) {
    if (ulUpper) {
      const structure = (b.structure ?? '').toUpperCase();
      if (!structure.includes(ulUpper)) continue;
    }

    const heures = b.heures;
    const heuresParType = heures?.par_type ?? {};

    let heuresUrgence = 0;
    let heuresActionSociale = 0;
    let heuresAutres = 0;
    for (const [type, h] of Object.entries(heuresParType)) {
      const t = type.toLowerCase();
      if (t.includes('urgence') || t.includes('secourisme')) heuresUrgence += h;
      else if (t.includes('social') || t.includes('action sociale')) heuresActionSociale += h;
      else heuresAutres += h;
    }

    const secteurPrincipal = determineSecteurPrincipal(heuresParType);

    if (secteurFilter === 'urgence' && secteurPrincipal !== 'Urgence') continue;
    if (secteurFilter === 'social' && secteurPrincipal !== 'Action Sociale') continue;

    rows.push({
      NIVOL: b.nivol ?? b.id ?? '',
      Nom: b.nom ?? '',
      'Prénom': b.prenom ?? '',
      Type: b.renfort ? 'Renfort' : 'Membre',
      'Heures Total': frNumber(heures?.total ?? 0),
      'Urgence et Secourisme': frNumber(heuresUrgence),
      'Action Sociale': frNumber(heuresActionSociale),
      Autres: frNumber(heuresAutres),
      'Secteur Principal': secteurPrincipal
    });
  }

  rows.sort((a, b) => {
    const nomCmp = a.Nom.localeCompare(b.Nom, 'fr');
    if (nomCmp !== 0) return nomCmp;
    return a['Prénom'].localeCompare(b['Prénom'], 'fr');
  });

  return rows;
}

/**
 * Génère un CSV (séparateur point-virgule, encodage attendu UTF-8 + BOM)
 * à partir des bénévoles, avec les filtres optionnels.
 */
export function exportBenevolesCsv(
  benevoles: PegassBenevole[],
  options: CsvExportOptions = {}
): string {
  const rows = filterAndBuildRows(benevoles, options);

  const header = FIELDS.map(csvEscape).join(';');
  const body = rows
    .map((r) => FIELDS.map((f) => csvEscape(String(r[f]))).join(';'))
    .join('\r\n');

  // Excel français reconnait mieux le UTF-8 BOM
  const BOM = '\uFEFF';
  return BOM + header + '\r\n' + body + (body ? '\r\n' : '');
}
