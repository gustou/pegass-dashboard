// Helpers de formatage cohérents avec la version Flask.

const MONTHS_FR = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'
];

/** Convertit "2024-01" en "Jan 24". */
export function formatMonth(yyyymm: string): string {
  const [year, month] = yyyymm.split('-');
  if (!year || !month) return yyyymm;
  const idx = parseInt(month, 10) - 1;
  if (idx < 0 || idx > 11) return yyyymm;
  return `${MONTHS_FR[idx]} ${year.slice(2)}`;
}

/** Formate un nombre d'heures avec N décimales. */
export function formatHeures(h: number | undefined, decimals = 1): string {
  return (h ?? 0).toFixed(decimals);
}

export function formatInt(n: number | undefined): string {
  return Math.round(n ?? 0).toString();
}

export function pluralize(n: number, singular: string, plural?: string): string {
  return n > 1 ? plural ?? `${singular}s` : singular;
}
