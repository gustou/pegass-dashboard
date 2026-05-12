import { describe, it, expect } from 'vitest';
import {
  computeTopCoequipiers,
  computeStructureDetail,
  computeActiviteDetail,
  computeHeuresLocalesExternesParMois
} from '../src/lib/derived';
import { processData } from '../src/lib/process-data';
import type { PegassRawData } from '../src/lib/types';

const RAW: PegassRawData = {
  metadata: { unite_locale: 'CLAMART' },
  benevoles: [
    {
      id: 'B1',
      nom: 'DUPONT',
      prenom: 'Marie',
      structure: 'UNITE LOCALE DE CLAMART',
      missions: [
        {
          activiteId: 'A1',
          nom: 'DPS Marathon',
          date: '2024-04-14',
          debut: '2024-04-14T08:00',
          fin: '2024-04-14T16:00',
          heures: 8,
          externe: false,
          groupeAction: 'Urgence et Secourisme',
          statut: 'VALIDEE'
        },
        {
          activiteId: 'A2',
          nom: 'Aide alimentaire',
          date: '2024-05-10',
          debut: '2024-05-10T14:00',
          fin: '2024-05-10T17:00',
          heures: 3,
          externe: true,
          structure: 'UL VOISINE',
          groupeAction: 'Action Sociale',
          statut: 'VALIDEE'
        }
      ]
    },
    {
      id: 'B2',
      nom: 'MARTIN',
      prenom: 'Paul',
      structure: 'UNITE LOCALE DE CLAMART',
      missions: [
        {
          activiteId: 'A1',
          nom: 'DPS Marathon',
          date: '2024-04-14',
          debut: '2024-04-14T08:00',
          fin: '2024-04-14T16:00',
          heures: 8,
          externe: false,
          groupeAction: 'Urgence et Secourisme',
          statut: 'VALIDEE'
        }
      ]
    },
    {
      id: 'B3',
      nom: 'BERTRAND',
      prenom: 'Sophie',
      structure: 'UL VOISINE',
      missions: [
        {
          activiteId: 'A2',
          nom: 'Aide alimentaire',
          date: '2024-05-10',
          debut: '2024-05-10T14:00',
          fin: '2024-05-10T17:00',
          heures: 3,
          externe: true,
          structure: 'UL VOISINE',
          groupeAction: 'Action Sociale',
          statut: 'VALIDEE'
        }
      ]
    }
  ]
};

describe('computeHeuresLocalesExternesParMois', () => {
  it('separe les heures locales et externes par mois', () => {
    const benevole = RAW.benevoles![0]!;
    const out = computeHeuresLocalesExternesParMois(benevole);
    expect(out.locales).toEqual({ '2024-04': 8 });
    expect(out.externes).toEqual({ '2024-05': 3 });
  });
});

describe('computeTopCoequipiers', () => {
  it("retourne les benevoles ayant des activites en commun trie decroissant", () => {
    const data = processData(RAW);
    const out = computeTopCoequipiers('B1', data);
    expect(out).toHaveLength(2);
    expect(out[0]!.id).toBe('B2');
    expect(out[0]!.nb_activites).toBe(1);
    expect(out[0]!.est_local).toBe(true);

    const b3 = out.find((c) => c.id === 'B3')!;
    expect(b3.est_local).toBe(false);
    expect(b3.nb_activites).toBe(1);
  });

  it('retourne une liste vide pour un benevole inconnu', () => {
    const data = processData(RAW);
    expect(computeTopCoequipiers('UNKNOWN', data)).toEqual([]);
  });
});

describe('computeStructureDetail', () => {
  it('agrege correctement une structure externe', () => {
    const data = processData(RAW);
    const out = computeStructureDetail('UL VOISINE', data);
    expect(out).not.toBeNull();
    expect(out!.nb_activites).toBe(1);
    expect(out!.nb_benevoles).toBe(2);
    expect(out!.total_heures).toBe(6);
    expect(out!.activites[0]!.id).toBe('A2');
    expect(out!.activites[0]!.nb_benevoles).toBe(2);
    expect(out!.benevoles_par_activite['A2']).toHaveLength(2);
  });

  it('retourne null pour une structure inconnue', () => {
    const data = processData(RAW);
    expect(computeStructureDetail('INEXISTANT', data)).toBeNull();
  });
});

describe('computeActiviteDetail', () => {
  it('retourne participations triees et stats correctes', () => {
    const data = processData(RAW);
    const out = computeActiviteDetail('A1', data);
    expect(out).not.toBeNull();
    expect(out!.info.nom).toBe('DPS Marathon');
    expect(out!.info.externe).toBe(false);
    expect(out!.participations).toHaveLength(2);
    expect(out!.benevoles_uniques).toBe(2);
    expect(out!.nb_seances).toBe(1);
    expect(out!.total_heures).toBe(16);
    expect(out!.participations.map((p) => p.benevole_nom)).toEqual(['DUPONT', 'MARTIN']);
  });

  it('retourne null pour une activite inconnue', () => {
    const data = processData(RAW);
    expect(computeActiviteDetail('XX', data)).toBeNull();
  });
});
