import { describe, it, expect } from 'vitest';
import {
  determineSecteurPrincipal,
  exportBenevolesCsv,
  filterAndBuildRows
} from '../src/lib/csv-export';
import type { PegassBenevole } from '../src/lib/types';

function bn(over: Partial<PegassBenevole>): PegassBenevole {
  return {
    id: 'B',
    nom: 'X',
    prenom: 'Y',
    structure: 'UNITE LOCALE DE CLAMART',
    actif: true,
    renfort: false,
    heures: { total: 0, par_mois: {}, par_type: {} },
    missions: [],
    ...over
  };
}

describe('determineSecteurPrincipal', () => {
  it('renvoie Urgence quand les heures urgence/secourisme dominent', () => {
    expect(
      determineSecteurPrincipal({ 'Urgence et Secourisme': 10, 'Action Sociale': 5 })
    ).toBe('Urgence');
  });

  it('renvoie Action Sociale quand le social domine', () => {
    expect(
      determineSecteurPrincipal({ 'Action Sociale': 20, 'Urgence et Secourisme': 5 })
    ).toBe('Action Sociale');
  });

  it('renvoie Mixte quand egalite non nulle', () => {
    expect(
      determineSecteurPrincipal({ 'Urgence et Secourisme': 10, 'Action Sociale': 10 })
    ).toBe('Mixte');
  });

  it('renvoie Non determine quand aucune heure des deux types', () => {
    expect(determineSecteurPrincipal({ Autre: 5 })).toBe('Non déterminé');
    expect(determineSecteurPrincipal({})).toBe('Non déterminé');
  });
});

describe('filterAndBuildRows', () => {
  const benevoles: PegassBenevole[] = [
    bn({
      id: 'B1',
      nom: 'DUPONT',
      prenom: 'Alice',
      nivol: '000001',
      heures: {
        total: 15,
        par_mois: {},
        par_type: { 'Urgence et Secourisme': 10, 'Action Sociale': 5 }
      }
    }),
    bn({
      id: 'B2',
      nom: 'MARTIN',
      prenom: 'Bob',
      nivol: '000002',
      renfort: true,
      heures: {
        total: 8,
        par_mois: {},
        par_type: { 'Action Sociale': 8 }
      }
    }),
    bn({
      id: 'B3',
      nom: 'BLANC',
      prenom: 'Chloé',
      structure: 'UL VOISINE',
      nivol: '000003',
      heures: {
        total: 12,
        par_mois: {},
        par_type: { 'Urgence et Secourisme': 12 }
      }
    })
  ];

  it('filtre par UL (sous-chaine insensible a la casse)', () => {
    const rows = filterAndBuildRows(benevoles, { ulFilter: 'clamart' });
    expect(rows.map((r) => r.NIVOL)).toEqual(['000001', '000002']);
  });

  it('filtre par secteur principal', () => {
    const rows = filterAndBuildRows(benevoles, { secteurFilter: 'urgence' });
    expect(rows.map((r) => r.NIVOL)).toEqual(['000003', '000001']);
  });

  it('trie par nom puis prenom', () => {
    const rows = filterAndBuildRows(benevoles, {});
    expect(rows.map((r) => r.Nom)).toEqual(['BLANC', 'DUPONT', 'MARTIN']);
  });

  it('marque correctement Renfort vs Membre', () => {
    const rows = filterAndBuildRows(benevoles, {});
    const bob = rows.find((r) => r.Nom === 'MARTIN')!;
    expect(bob.Type).toBe('Renfort');
    const alice = rows.find((r) => r.Nom === 'DUPONT')!;
    expect(alice.Type).toBe('Membre');
  });
});

describe('exportBenevolesCsv', () => {
  it('produit un CSV avec BOM UTF-8, separateur point-virgule et virgule decimale', () => {
    const benevoles: PegassBenevole[] = [
      bn({
        id: 'B1',
        nom: 'AVEC; SEMICOLON',
        prenom: 'O\'Brien',
        nivol: '000001',
        heures: {
          total: 10.5,
          par_mois: {},
          par_type: { 'Urgence et Secourisme': 10.5 }
        }
      })
    ];
    const csv = exportBenevolesCsv(benevoles);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain('NIVOL;Nom;Prénom');
    expect(csv).toContain('"AVEC; SEMICOLON"');
    expect(csv).toContain('10,50');
    expect(csv).toContain('Urgence');
  });
});
