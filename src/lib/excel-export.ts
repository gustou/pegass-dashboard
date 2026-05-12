// Port TypeScript de dashboard/app.py: generate_excel().
// Utilise ExcelJS pour reproduire les 5 onglets et leurs styles.

import ExcelJS from 'exceljs';
import type { ProcessedData } from './types';

const HEADER_BG_ARGB = 'FFE30613';
const HEADER_FG_ARGB = 'FFFFFFFF';

function applyHeaderStyle(row: ExcelJS.Row): void {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: HEADER_FG_ARGB } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: HEADER_BG_ARGB }
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
      bottom: { style: 'thin' }
    };
  });
}

function autoFitColumns(ws: ExcelJS.Worksheet, maxWidth = 50): void {
  ws.columns.forEach((col) => {
    let max = 10;
    col.eachCell?.({ includeEmpty: false }, (cell) => {
      const v = cell.value;
      const str = v == null ? '' : String(v);
      if (str.length > max) max = str.length;
    });
    col.width = Math.min(max + 2, maxWidth);
  });
}

export async function generateExcelBuffer(data: ProcessedData): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Pegass Dashboard';
  wb.created = new Date();

  // ============ Onglet 1 : Résumé ============
  const ws1 = wb.addWorksheet('Résumé');
  ws1.mergeCells('A1:D1');
  const title = ws1.getCell('A1');
  title.value = 'Statistiques Pegass';
  title.font = { bold: true, size: 16 };

  const periode = data.metadata.periode ?? {};
  const rows1: Array<[string, string | number]> = [
    ['Unité Locale:', data.metadata.unite_locale ?? 'N/A'],
    ['Période:', `${periode.debut ?? ''} au ${periode.fin ?? ''}`],
    ["Date d'extraction:", (data.metadata.date_extraction ?? '').slice(0, 10)],
    ['', ''],
    ['Total bénévoles:', data.stats.total_benevoles],
    ['Bénévoles actifs:', data.stats.benevoles_actifs],
    ['Total heures:', data.stats.total_heures],
    ['Heures locales:', data.stats.heures_locales],
    ['Heures externes:', data.stats.heures_externes],
    ['Total participations:', data.stats.total_missions],
    ['Participations locales:', data.stats.missions_locales],
    ['Participations externes:', data.stats.missions_externes]
  ];
  // Première ligne vide après le titre
  ws1.getRow(2).values = [];
  let r = 3;
  for (const [k, v] of rows1) {
    ws1.getCell(`A${r}`).value = k;
    ws1.getCell(`B${r}`).value = v;
    if (k) ws1.getCell(`A${r}`).font = { bold: true };
    r += 1;
  }
  ws1.getColumn(1).width = 26;
  ws1.getColumn(2).width = 40;

  // ============ Onglet 2 : Bénévoles ============
  const ws2 = wb.addWorksheet('Bénévoles');
  const headers2 = [
    'ID',
    'Nom',
    'Prénom',
    'Structure',
    'Heures Total',
    'Heures Locales',
    'Heures Externes',
    'Nb Missions',
    'Actif'
  ];
  ws2.addRow(headers2);
  applyHeaderStyle(ws2.getRow(1));

  for (const b of data.benevoles) {
    ws2.addRow([
      b.id,
      b.nom ?? '',
      b.prenom ?? '',
      b.structure ?? '',
      b.heures?.total ?? 0,
      b.heures?.locales ?? 0,
      b.heures?.externes ?? 0,
      (b.missions ?? []).length,
      b.actif ? 'Oui' : 'Non'
    ]);
  }
  autoFitColumns(ws2);

  // ============ Onglet 3 : Heures par mois ============
  const ws3 = wb.addWorksheet('Heures par mois');
  const allMonths = [
    ...new Set(
      data.benevoles.flatMap((b) => Object.keys(b.heures?.par_mois ?? {}))
    )
  ].sort();

  const headers3 = ['Nom', 'Prénom', ...allMonths, 'Total'];
  ws3.addRow(headers3);
  applyHeaderStyle(ws3.getRow(1));

  for (const b of data.benevoles) {
    const parMois = b.heures?.par_mois ?? {};
    const row: (string | number)[] = [b.nom ?? '', b.prenom ?? ''];
    for (const m of allMonths) row.push(parMois[m] ?? 0);
    row.push(b.heures?.total ?? 0);
    ws3.addRow(row);
  }
  autoFitColumns(ws3, 20);

  // ============ Onglet 4 : Missions ============
  const ws4 = wb.addWorksheet('Missions');
  const headers4 = [
    'Date',
    'Bénévole',
    'Activité',
    'Type',
    'Structure',
    'Lieu',
    'Heures',
    'Statut'
  ];
  ws4.addRow(headers4);
  applyHeaderStyle(ws4.getRow(1));

  for (const b of data.benevoles) {
    for (const m of b.missions ?? []) {
      ws4.addRow([
        m.date ?? '',
        `${b.nom ?? ''} ${b.prenom ?? ''}`.trim(),
        m.nom ?? '',
        m.groupeAction ?? '',
        m.structure ?? data.metadata.unite_locale ?? '',
        m.externe ? 'Externe' : 'Local',
        m.heures ?? 0,
        m.statut ?? ''
      ]);
    }
  }
  autoFitColumns(ws4);

  // ============ Onglet 5 : Par type d'activité ============
  const ws5 = wb.addWorksheet('Par type');
  const headers5 = ["Type d'activité", 'Heures totales'];
  ws5.addRow(headers5);
  applyHeaderStyle(ws5.getRow(1));

  for (const [type, heures] of Object.entries(data.stats.heures_par_type)) {
    ws5.addRow([type, Math.round(heures * 100) / 100]);
  }
  autoFitColumns(ws5, 40);

  return await wb.xlsx.writeBuffer();
}
