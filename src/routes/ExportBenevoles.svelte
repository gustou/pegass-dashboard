<script lang="ts">
  import { dataStore } from '../stores/data.svelte';
  import { hashLink } from '../lib/router.svelte';
  import { formatHeures } from '../lib/format';
  import {
    exportBenevolesCsv,
    filterAndBuildRows,
    type SecteurFilter
  } from '../lib/csv-export';
  import { downloadText, timestamp } from '../lib/download';

  const data = $derived(dataStore.state.data!);

  let ulFilter = $state('');
  let secteurFilter = $state<SecteurFilter>('all');

  const filtered = $derived(
    filterAndBuildRows(data.benevoles, { ulFilter, secteurFilter })
  );

  const preview = $derived(filtered.slice(0, 10));

  function secteurClass(s: string): string {
    if (s === 'Urgence') return 'text-red-600';
    if (s === 'Action Sociale') return 'text-blue-600';
    return 'text-gray-500';
  }

  function downloadCsv(): void {
    const csv = exportBenevolesCsv(data.benevoles, { ulFilter, secteurFilter });
    const suffix = ulFilter.trim() ? `_${ulFilter.trim().toLowerCase()}` : '';
    const filename = `benevoles${suffix}_${timestamp()}.csv`;
    downloadText(csv, filename, 'text/csv');
  }
</script>

<div class="max-w-4xl mx-auto">
  <div class="mb-6">
    <a href={hashLink('/dashboard')} class="text-(--color-crf-red) hover:underline">
      ← Retour au tableau de bord
    </a>
  </div>

  <h1 class="text-2xl font-bold text-gray-800 mb-6">Export des bénévoles</h1>

  <!-- Filtres -->
  <div class="bg-white rounded-lg shadow p-6 mb-6">
    <h2 class="text-lg font-semibold text-gray-800 mb-4">Filtres</h2>

    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2" for="ulFilter">
          Unité Locale
        </label>
        <div class="flex items-center gap-4">
          <input
            id="ulFilter"
            type="text"
            bind:value={ulFilter}
            placeholder="Ex : CLAMART, PARIS…"
            class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-(--color-crf-red)"
          />
          <button
            type="button"
            onclick={() => (ulFilter = '')}
            class="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Effacer (toutes)
          </button>
        </div>
        <p class="text-xs text-gray-500 mt-1">
          Laisser vide pour inclure toutes les structures.
        </p>
      </div>

      <div>
        <span class="block text-sm font-medium text-gray-700 mb-2">Secteur principal</span>
        <div class="flex items-center gap-4 flex-wrap">
          <label class="inline-flex items-center">
            <input type="radio" bind:group={secteurFilter} value="all" class="text-(--color-crf-red)" />
            <span class="ml-2">Tous</span>
          </label>
          <label class="inline-flex items-center">
            <input type="radio" bind:group={secteurFilter} value="urgence" class="text-(--color-crf-red)" />
            <span class="ml-2">Urgence</span>
          </label>
          <label class="inline-flex items-center">
            <input type="radio" bind:group={secteurFilter} value="social" class="text-(--color-crf-red)" />
            <span class="ml-2">Action Sociale</span>
          </label>
        </div>
      </div>
    </div>
  </div>

  <!-- Aperçu -->
  <div class="bg-white rounded-lg shadow p-6 mb-6">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-lg font-semibold text-gray-800">Aperçu</h2>
      <span class="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
        {filtered.length} bénévole{filtered.length > 1 ? 's' : ''}
      </span>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-3 py-2 text-left font-medium text-gray-500">Nom</th>
            <th class="px-3 py-2 text-left font-medium text-gray-500">Prénom</th>
            <th class="px-3 py-2 text-right font-medium text-gray-500">Heures</th>
            <th class="px-3 py-2 text-left font-medium text-gray-500">Secteur</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          {#each preview as r (r.NIVOL)}
            <tr>
              <td class="px-3 py-2">{r.Nom}</td>
              <td class="px-3 py-2">{r['Prénom']}</td>
              <td class="px-3 py-2 text-right">{r['Heures Total']}h</td>
              <td class="px-3 py-2 font-medium {secteurClass(r['Secteur Principal'])}">
                {r['Secteur Principal']}
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="4" class="px-3 py-8 text-center text-gray-500">Aucun bénévole.</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    {#if filtered.length > preview.length}
      <p class="text-gray-500 text-sm mt-2">
        Affichage des {preview.length} premiers résultats sur {filtered.length}.
      </p>
    {/if}
  </div>

  <!-- Bouton d'export -->
  <div class="bg-white rounded-lg shadow p-6">
    <h2 class="text-lg font-semibold text-gray-800 mb-4">Format d'export</h2>
    <button
      type="button"
      onclick={downloadCsv}
      disabled={filtered.length === 0}
      class="w-full py-3 px-4 bg-green-600 text-white text-center font-medium rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Télécharger CSV ({filtered.length} bénévoles)
    </button>
    <p class="text-xs text-gray-500 mt-2">
      Format : séparateur point-virgule, encodage UTF-8 avec BOM (compatible Excel français).
    </p>
  </div>

  <!-- Détail des stats globales pour info -->
  <div class="mt-6 text-xs text-gray-500">
    Note : « Heures Total » correspond à toutes les heures du bénévole sur la période —
    moyenne actuelle : {formatHeures(data.stats.total_heures / Math.max(1, data.stats.benevoles_actifs))}h
    par bénévole actif.
  </div>
</div>
