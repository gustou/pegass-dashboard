// Store global réactif (Svelte 5 runes) pour les données Pegass traitées.
// Persiste le JSON brut dans localStorage pour éviter de re-uploader à chaque visite.

import { processData } from '../lib/process-data';
import type { PegassRawData, ProcessedData } from '../lib/types';
import { filters } from './filters.svelte';

const STORAGE_KEY = 'pegass-dashboard:raw-data';

interface DataState {
  raw: PegassRawData | null;
  data: ProcessedData | null;
  error: string | null;
  loading: boolean;
}

function createStore() {
  const state = $state<DataState>({
    raw: null,
    data: null,
    error: null,
    loading: false
  });

  function load(raw: PegassRawData): void {
    state.loading = true;
    state.error = null;
    try {
      state.raw = raw;
      state.data = processData(raw, filters.selectedActivities);
      persist(raw);
    } catch (e) {
      state.error = e instanceof Error ? e.message : String(e);
      state.data = null;
    } finally {
      state.loading = false;
    }
  }

  async function loadFromFile(file: File): Promise<void> {
    state.loading = true;
    state.error = null;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as PegassRawData;
      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.benevoles)) {
        throw new Error('Format JSON invalide : le champ "benevoles" est absent ou n\'est pas un tableau.');
      }
      state.raw = parsed;
      state.data = processData(parsed, filters.selectedActivities);
      persist(parsed);
    } catch (e) {
      state.error = e instanceof Error ? e.message : String(e);
      state.data = null;
    } finally {
      state.loading = false;
    }
  }

  function reset(): void {
    state.raw = null;
    state.data = null;
    state.error = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // localStorage indisponible (mode privé, etc.) — non bloquant
    }
  }

  function hydrateFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as PegassRawData;
      state.raw = parsed;
      state.data = processData(parsed, filters.selectedActivities);
    } catch {
      // Données corrompues — on les ignore silencieusement
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* noop */
      }
    }
  }

  function persist(raw: PegassRawData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
    } catch {
      // Quota dépassé ou indispo — non bloquant, l'app fonctionne sans persistance
    }
  }

  function reprocess(): void {
    if (state.raw) {
      state.data = processData(state.raw, filters.selectedActivities);
    }
  }

  return {
    get state() {
      return state;
    },
    get availableActivities() {
      if (!state.raw) return [];
      const types = new Set<string>();
      for (const b of state.raw.benevoles ?? []) {
        for (const m of b.missions ?? []) {
          types.add(m.groupeAction || 'Autre');
        }
      }
      return Array.from(types).sort();
    },
    load,
    loadFromFile,
    reset,
    hydrateFromStorage,
    reprocess
  };
}

export const dataStore = createStore();
