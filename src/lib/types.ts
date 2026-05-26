// Types correspondant au JSON produit par l'extension Firefox Pegass.
// Voir le README racine du projet pour le schéma de référence.

export interface PegassMetadata {
  date_extraction?: string;
  unite_locale?: string;
  structure_id?: number | string;
  mode?: string;
  periode?: {
    debut?: string;
    fin?: string;
  };
  config_snapshot?: Record<string, unknown>;
  version?: string;
}

/** Séance / activité extraite côté structure (schéma extracteur ≥ 1.3). */
export interface PegassEvenement {
  id: string;
  activiteId?: string;
  nom?: string;
  statut?: string | null;
  type?: string;
  groupeAction?: string;
  date?: string;
  debut?: string;
  fin?: string;
  heures?: number;
  adresse?: string;
  structure?: string;
  structureId?: string;
  inscriptions_count?: number;
  sans_inscription?: boolean;
}

export interface PegassMission {
  id?: string;
  activiteId?: string;
  nom?: string;
  type?: string;
  groupeAction?: string;
  date?: string;
  debut?: string;
  fin?: string;
  heures?: number;
  statut?: string;
  structure?: string;
  externe?: boolean;
}

export interface PegassHeures {
  total: number;
  locales?: number;
  externes?: number;
  par_mois: Record<string, number>;
  par_type: Record<string, number>;
}

export interface PegassBenevole {
  id: string;
  nivol?: string;
  nom?: string;
  prenom?: string;
  structure?: string;
  actif?: boolean;
  renfort?: boolean;
  heures?: PegassHeures;
  missions?: PegassMission[];
}

export interface PegassRawData {
  metadata?: PegassMetadata;
  benevoles?: PegassBenevole[];
  evenements?: PegassEvenement[];
  stats?: unknown;
}

export interface TopBenevole {
  id: string;
  nom: string;
  prenom: string;
  heures: number;
  heures_locales: number;
  heures_externes: number;
  nb_activites: number;
}

export interface StructureExterneStats {
  nom: string;
  heures: number;
  nb_activites: number;
  nb_benevoles: number;
}

export interface PegassStats {
  total_benevoles: number;
  benevoles_actifs: number;
  total_heures: number;
  heures_locales: number;
  heures_externes: number;
  total_missions: number;
  missions_locales: number;
  missions_externes: number;
  structures_externes: string[];
  top_structures_externes: StructureExterneStats[];
  heures_par_mois: Record<string, number>;
  heures_locales_par_mois: Record<string, number>;
  heures_externes_par_mois: Record<string, number>;
  heures_par_type: Record<string, number>;
  top_benevoles: TopBenevole[];
}

export interface ProcessedData {
  metadata: PegassMetadata;
  benevoles: PegassBenevole[];
  evenements: PegassEvenement[];
  duplicates_removed: number;
  stats: PegassStats;
}
