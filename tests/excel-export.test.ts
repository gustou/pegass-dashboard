import { describe, it, expect } from 'vitest';
import { generateExcelBuffer } from '../src/lib/excel-export';
import { processData } from '../src/lib/process-data';
import type { PegassRawData } from '../src/lib/types';

const RAW: PegassRawData = {
  metadata: {
    unite_locale: 'CLAMART',
    periode: { debut: '2024-01-01', fin: '2024-12-31' },
    date_extraction: '2024-12-15T10:00:00Z'
  },
  benevoles: [
    {
      id: 'B1',
      nom: 'DUPONT',
      prenom: 'Marie',
      structure: 'UNITE LOCALE DE CLAMART',
      actif: true,
      heures: {
        total: 18,
        locales: 10,
        externes: 8,
        par_mois: { '2024-01': 10, '2024-02': 8 },
        par_type: { 'Urgence et Secourisme': 10, 'Action Sociale': 8 }
      },
      missions: [
        {
          activiteId: 'A1',
          nom: 'DPS',
          date: '2024-01-10',
          debut: 'x',
          fin: 'y',
          heures: 10,
          externe: false,
          groupeAction: 'Urgence et Secourisme',
          statut: 'VALIDEE'
        },
        {
          activiteId: 'A2',
          nom: 'Maraude',
          date: '2024-02-05',
          debut: 'x2',
          fin: 'y2',
          heures: 8,
          externe: true,
          structure: 'UL VOISINE',
          groupeAction: 'Action Sociale',
          statut: 'EN_ATTENTE'
        }
      ]
    }
  ]
};

describe('generateExcelBuffer', () => {
  it('produit un fichier xlsx (signature ZIP PK)', async () => {
    const data = processData(RAW);
    const buffer = await generateExcelBuffer(data);
    expect(buffer.byteLength).toBeGreaterThan(1000);
    const head = new Uint8Array(buffer.slice(0, 2));
    expect(head[0]).toBe(0x50); // 'P'
    expect(head[1]).toBe(0x4b); // 'K' — début d'archive ZIP, format xlsx
  });
});
