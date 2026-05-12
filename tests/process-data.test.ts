import { describe, it, expect } from 'vitest';
import { processData, deduplicateMissions } from '../src/lib/process-data';
import type { PegassBenevole, PegassRawData } from '../src/lib/types';

function makeBenevole(overrides: Partial<PegassBenevole> = {}): PegassBenevole {
  return {
    id: 'B1',
    nom: 'DUPONT',
    prenom: 'Marie',
    structure: 'UNITE LOCALE DE CLAMART',
    actif: true,
    heures: { total: 0, par_mois: {}, par_type: {} },
    missions: [],
    ...overrides
  };
}

describe('deduplicateMissions', () => {
  it('ne retire rien quand il n y a pas de doublons', () => {
    const b = makeBenevole({
      missions: [
        { debut: '2024-01-01T08:00', fin: '2024-01-01T12:00', date: '2024-01-01', heures: 4 },
        { debut: '2024-01-02T08:00', fin: '2024-01-02T12:00', date: '2024-01-02', heures: 4 }
      ]
    });
    const removed = deduplicateMissions([b]);
    expect(removed).toBe(0);
    expect(b.missions).toHaveLength(2);
  });

  it('retire les missions ayant le meme debut et la meme fin', () => {
    const b = makeBenevole({
      missions: [
        { debut: '2024-01-01T08:00', fin: '2024-01-01T12:00', date: '2024-01-01', heures: 4, groupeAction: 'Urgence et Secourisme' },
        { debut: '2024-01-01T08:00', fin: '2024-01-01T12:00', date: '2024-01-01', heures: 4, groupeAction: 'Urgence et Secourisme' },
        { debut: '2024-01-02T08:00', fin: '2024-01-02T12:00', date: '2024-01-02', heures: 4, groupeAction: 'Urgence et Secourisme' }
      ]
    });
    const removed = deduplicateMissions([b]);
    expect(removed).toBe(1);
    expect(b.missions).toHaveLength(2);
  });

  it('recalcule les heures locales/externes et par mois apres dedoublonnage', () => {
    const b = makeBenevole({
      missions: [
        { debut: '2024-01-01T08:00', fin: '2024-01-01T12:00', date: '2024-01-01', heures: 4, externe: false, groupeAction: 'Urgence et Secourisme' },
        { debut: '2024-01-01T08:00', fin: '2024-01-01T12:00', date: '2024-01-01', heures: 4, externe: false, groupeAction: 'Urgence et Secourisme' },
        { debut: '2024-02-05T08:00', fin: '2024-02-05T18:00', date: '2024-02-05', heures: 10, externe: true, groupeAction: 'Soutien aux activités' }
      ]
    });
    const removed = deduplicateMissions([b]);
    expect(removed).toBe(1);
    expect(b.heures?.total).toBe(14);
    expect(b.heures?.locales).toBe(4);
    expect(b.heures?.externes).toBe(10);
    expect(b.heures?.par_mois['2024-01']).toBe(4);
    expect(b.heures?.par_mois['2024-02']).toBe(10);
    expect(b.heures?.par_type['Urgence et Secourisme']).toBe(4);
    expect(b.heures?.par_type['Soutien aux activités']).toBe(10);
  });
});

describe('processData', () => {
  it('retourne des statistiques globales correctes', () => {
    const raw: PegassRawData = {
      metadata: { unite_locale: 'UL CLAMART', periode: { debut: '2024-01-01', fin: '2024-12-31' } },
      benevoles: [
        makeBenevole({
          id: 'B1',
          heures: {
            total: 10,
            locales: 6,
            externes: 4,
            par_mois: { '2024-01': 6, '2024-02': 4 },
            par_type: { 'Urgence et Secourisme': 10 }
          },
          missions: [
            { debut: 'd1', fin: 'f1', date: '2024-01-15', heures: 6, externe: false, groupeAction: 'Urgence et Secourisme' },
            { debut: 'd2', fin: 'f2', date: '2024-02-15', heures: 4, externe: true, structure: 'UL VOISINE', activiteId: 'a1', groupeAction: 'Urgence et Secourisme' }
          ]
        }),
        makeBenevole({
          id: 'B2',
          nom: 'MARTIN',
          prenom: 'Paul',
          heures: {
            total: 20,
            locales: 20,
            externes: 0,
            par_mois: { '2024-01': 20 },
            par_type: { 'Action Sociale': 20 }
          },
          missions: [
            { debut: 'd3', fin: 'f3', date: '2024-01-20', heures: 20, externe: false, groupeAction: 'Action Sociale' }
          ]
        }),
        makeBenevole({ id: 'B3', nom: 'INACTIF', prenom: 'Test', missions: [] })
      ]
    };

    const out = processData(raw);

    expect(out.stats.total_benevoles).toBe(3);
    expect(out.stats.benevoles_actifs).toBe(2);
    expect(out.stats.total_heures).toBe(30);
    expect(out.stats.heures_locales).toBe(26);
    expect(out.stats.heures_externes).toBe(4);
    expect(out.stats.total_missions).toBe(3);
    expect(out.stats.missions_locales).toBe(2);
    expect(out.stats.missions_externes).toBe(1);
  });

  it('agrege heures par mois (totales / locales / externes) triees', () => {
    const raw: PegassRawData = {
      benevoles: [
        makeBenevole({
          id: 'B1',
          heures: { total: 10, par_mois: { '2024-02': 4, '2024-01': 6 }, par_type: {} },
          missions: [
            { debut: 'd1', fin: 'f1', date: '2024-01-10', heures: 6, externe: false },
            { debut: 'd2', fin: 'f2', date: '2024-02-10', heures: 4, externe: true }
          ]
        })
      ]
    };
    const out = processData(raw);
    expect(Object.keys(out.stats.heures_par_mois)).toEqual(['2024-01', '2024-02']);
    expect(out.stats.heures_locales_par_mois).toEqual({ '2024-01': 6 });
    expect(out.stats.heures_externes_par_mois).toEqual({ '2024-02': 4 });
  });

  it('classe les structures externes par heures', () => {
    const raw: PegassRawData = {
      benevoles: [
        makeBenevole({
          id: 'B1',
          missions: [
            { debut: 'd1', fin: 'f1', date: '2024-01-10', heures: 5, externe: true, structure: 'UL A', activiteId: 'a1' },
            { debut: 'd2', fin: 'f2', date: '2024-01-15', heures: 8, externe: true, structure: 'UL B', activiteId: 'b1' }
          ]
        }),
        makeBenevole({
          id: 'B2',
          missions: [
            { debut: 'd3', fin: 'f3', date: '2024-01-20', heures: 3, externe: true, structure: 'UL A', activiteId: 'a2' }
          ]
        })
      ]
    };
    const out = processData(raw);
    expect(out.stats.top_structures_externes.map((s) => s.nom)).toEqual(['UL A', 'UL B']);
    const ulA = out.stats.top_structures_externes.find((s) => s.nom === 'UL A')!;
    expect(ulA.heures).toBe(8);
    expect(ulA.nb_activites).toBe(2);
    expect(ulA.nb_benevoles).toBe(2);
    expect(out.stats.structures_externes).toEqual(['UL A', 'UL B']);
  });

  it('top_benevoles est trie par heures decroissantes', () => {
    const raw: PegassRawData = {
      benevoles: [
        makeBenevole({ id: 'B1', heures: { total: 5, par_mois: {}, par_type: {} } }),
        makeBenevole({ id: 'B2', heures: { total: 50, par_mois: {}, par_type: {} } }),
        makeBenevole({ id: 'B3', heures: { total: 20, par_mois: {}, par_type: {} } })
      ]
    };
    const out = processData(raw);
    expect(out.stats.top_benevoles.map((b) => b.id)).toEqual(['B2', 'B3', 'B1']);
  });

  it('compte les doublons supprimes au passage', () => {
    const raw: PegassRawData = {
      benevoles: [
        makeBenevole({
          missions: [
            { debut: 'x', fin: 'y', date: '2024-01-01', heures: 2 },
            { debut: 'x', fin: 'y', date: '2024-01-01', heures: 2 },
            { debut: 'x', fin: 'y', date: '2024-01-01', heures: 2 }
          ]
        })
      ]
    };
    const out = processData(raw);
    expect(out.duplicates_removed).toBe(2);
    expect(out.benevoles[0]?.missions).toHaveLength(1);
  });
});
