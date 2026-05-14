<script lang="ts">
  import type { ChartConfiguration } from 'chart.js';
  import { dataStore } from '../stores/data.svelte';
  import { hashLink } from '../lib/router.svelte';
  import { formatHeures, formatInt, formatMonth, pluralize } from '../lib/format';
  import Chart from '../components/Chart.svelte';

  type Mode = 'heures' | 'activites';

  let benevolesMode = $state<Mode>('heures');
  let structuresMode = $state<Mode>('heures');

  const data = $derived(dataStore.state.data!);
  const stats = $derived(data.stats);

  const pctLocal = $derived(
    stats.total_heures > 0 ? (stats.heures_locales / stats.total_heures) * 100 : 0
  );
  const pctExterne = $derived(100 - pctLocal);

  const allMonths = $derived(
    [
      ...new Set([
        ...Object.keys(stats.heures_locales_par_mois),
        ...Object.keys(stats.heures_externes_par_mois)
      ])
    ].sort()
  );

  const chartMois = $derived<ChartConfiguration>({
    type: 'bar',
    data: {
      labels: allMonths.map(formatMonth),
      datasets: [
        {
          label: 'Heures locales',
          data: allMonths.map((m) => stats.heures_locales_par_mois[m] ?? 0),
          backgroundColor: '#22c55e',
          borderRadius: 4
        },
        {
          label: 'Heures externes',
          data: allMonths.map((m) => stats.heures_externes_par_mois[m] ?? 0),
          backgroundColor: '#3b82f6',
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true, position: 'top' } },
      scales: {
        x: { stacked: true },
        y: { stacked: true, beginAtZero: true }
      }
    }
  });

  const TYPE_COLORS = [
    '#e30613', '#ff5722', '#ff9800', '#ffc107',
    '#8bc34a', '#4caf50', '#00bcd4', '#2196f3'
  ];

  const chartType = $derived<ChartConfiguration>({
    type: 'doughnut',
    data: {
      labels: Object.keys(stats.heures_par_type),
      datasets: [
        {
          data: Object.values(stats.heures_par_type),
          backgroundColor: TYPE_COLORS.slice(0, Object.keys(stats.heures_par_type).length)
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'right' } }
    }
  });

  const sortedBenevoles = $derived(
    [...stats.top_benevoles]
      .sort((a, b) =>
        benevolesMode === 'heures' ? b.heures - a.heures : b.nb_activites - a.nb_activites
      )
      .slice(0, 10)
  );

  const maxBenevoles = $derived(
    sortedBenevoles.length > 0
      ? benevolesMode === 'heures'
        ? sortedBenevoles[0]!.heures
        : sortedBenevoles[0]!.nb_activites
      : 1
  );

  const sortedStructures = $derived(
    [...stats.top_structures_externes]
      .sort((a, b) =>
        structuresMode === 'heures' ? b.heures - a.heures : b.nb_activites - a.nb_activites
      )
      .slice(0, 10)
  );

  const maxStructures = $derived(
    sortedStructures.length > 0
      ? structuresMode === 'heures'
        ? sortedStructures[0]!.heures
        : sortedStructures[0]!.nb_activites
      : 1
  );

  const sortedRenforts = $derived(
    [...data.benevoles]
      .filter((b) => b.renfort && ((b.heures?.total ?? 0) > 0 || (b.missions ?? []).length > 0))
      .map((b) => ({
        id: b.id,
        nom: b.nom ?? '',
        prenom: b.prenom ?? '',
        structure: b.structure ?? '',
        heures: b.heures?.total ?? 0,
        heures_locales: b.heures?.locales ?? 0,
        heures_externes: b.heures?.externes ?? 0,
        nb_activites: (b.missions ?? []).length
      }))
      .sort((a, b) =>
        benevolesMode === 'heures' ? b.heures - a.heures : b.nb_activites - a.nb_activites
      )
      .slice(0, 10)
  );

  const maxRenforts = $derived(
    sortedRenforts.length > 0
      ? benevolesMode === 'heures'
        ? sortedRenforts[0]!.heures
        : sortedRenforts[0]!.nb_activites
      : 1
  );

  function toggleClass(active: boolean): string {
    return active
      ? 'px-3 py-1 text-sm bg-(--color-crf-red) text-white'
      : 'px-3 py-1 text-sm bg-white text-gray-600 hover:bg-gray-100';
  }
</script>

<!-- En-tête -->
<div class="mb-8">
  <h1 class="text-2xl font-bold text-gray-800">Tableau de bord</h1>
  <p class="text-gray-600">
    {data.metadata.unite_locale ?? ''} — Période : {data.metadata.periode?.debut ?? '?'} au
    {data.metadata.periode?.fin ?? '?'}
  </p>
  {#if data.duplicates_removed > 0}
    <p class="text-sm text-orange-600 mt-1">
      ⚠ {data.duplicates_removed} activité{data.duplicates_removed > 1 ? 's' : ''} en double supprimée{data.duplicates_removed > 1 ? 's' : ''} des statistiques
    </p>
  {/if}
</div>

<!-- Cartes statistiques -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
  <div class="bg-white rounded-lg shadow p-6">
    <div class="text-sm font-medium text-gray-500 uppercase">Bénévoles actifs</div>
    <div class="mt-2 text-3xl font-bold text-(--color-crf-red)">{stats.benevoles_actifs}</div>
    <div class="text-sm text-gray-400">sur {stats.total_benevoles} total</div>
  </div>

  <div class="bg-white rounded-lg shadow p-6">
    <div class="text-sm font-medium text-gray-500 uppercase">Heures totales</div>
    <div class="mt-2 text-3xl font-bold text-(--color-crf-red)">{formatInt(stats.total_heures)}</div>
    <div class="text-sm text-gray-400">
      <span class="text-green-600">{formatInt(stats.heures_locales)}h locales</span> /
      <span class="text-blue-600">{formatInt(stats.heures_externes)}h externes</span>
    </div>
  </div>

  <div class="bg-white rounded-lg shadow p-6">
    <div class="text-sm font-medium text-gray-500 uppercase">Participations</div>
    <div class="mt-2 text-3xl font-bold text-(--color-crf-red)">{stats.total_missions}</div>
    <div class="text-sm text-gray-400">
      <span class="text-green-600">{stats.missions_locales} locales</span> /
      <span class="text-blue-600">{stats.missions_externes} externes</span>
    </div>
  </div>

  <div class="bg-white rounded-lg shadow p-6">
    <div class="text-sm font-medium text-gray-500 uppercase">Moyenne</div>
    <div class="mt-2 text-3xl font-bold text-(--color-crf-red)">
      {stats.benevoles_actifs > 0
        ? (stats.total_heures / stats.benevoles_actifs).toFixed(1)
        : '0'}
    </div>
    <div class="text-sm text-gray-400">heures par bénévole actif</div>
  </div>
</div>

<!-- Répartition Local / Externe -->
{#if stats.heures_externes > 0}
  <div class="bg-white rounded-lg shadow p-6 mb-8">
    <h2 class="text-lg font-semibold text-gray-800 mb-4">Répartition Local / Externe</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-600">Heures</span>
          <span class="text-sm text-gray-500">{formatInt(stats.total_heures)}h total</span>
        </div>
        <div class="h-6 bg-gray-200 rounded-full overflow-hidden flex">
          <div
            class="bg-green-500 h-full"
            style="width: {pctLocal}%"
            title={`Locales: ${formatInt(stats.heures_locales)}h`}
          ></div>
          <div
            class="bg-blue-500 h-full"
            style="width: {pctExterne}%"
            title={`Externes: ${formatInt(stats.heures_externes)}h`}
          ></div>
        </div>
        <div class="flex justify-between mt-2 text-xs">
          <span class="text-green-600"
            >Locales : {formatInt(stats.heures_locales)}h ({formatInt(pctLocal)}%)</span
          >
          <span class="text-blue-600"
            >Externes : {formatInt(stats.heures_externes)}h ({formatInt(pctExterne)}%)</span
          >
        </div>
      </div>

      {#if stats.structures_externes.length > 0}
        <div>
          <div class="text-sm font-medium text-gray-600 mb-2">
            Structures externes ({stats.structures_externes.length})
          </div>
          <div class="flex flex-wrap gap-2">
            {#each stats.structures_externes.slice(0, 10) as structure (structure)}
              <a
                href={hashLink('/structure/' + encodeURIComponent(structure))}
                class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full hover:bg-blue-200"
              >
                {structure}
              </a>
            {/each}
            {#if stats.structures_externes.length > 10}
              <span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{stats.structures_externes.length - 10} autres
              </span>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<!-- Graphiques -->
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
  <div class="bg-white rounded-lg shadow p-6">
    <h2 class="text-lg font-semibold text-gray-800 mb-4">Heures par mois</h2>
    <div class="h-64 relative">
      <Chart config={chartMois} />
    </div>
  </div>

  <div class="bg-white rounded-lg shadow p-6">
    <h2 class="text-lg font-semibold text-gray-800 mb-4">Répartition par type d'activité</h2>
    <div class="h-64 relative">
      <Chart config={chartType} />
    </div>
  </div>
</div>

<!-- Top 10 bénévoles -->
<div class="bg-white rounded-lg shadow p-6 mb-8">
  <div class="flex items-center justify-between mb-4 flex-wrap gap-3">
    <h2 class="text-lg font-semibold text-gray-800">Top 10 bénévoles</h2>
    <div class="flex rounded-lg overflow-hidden border border-gray-300">
      <button onclick={() => (benevolesMode = 'heures')} class={toggleClass(benevolesMode === 'heures')}>
        Heures
      </button>
      <button
        onclick={() => (benevolesMode = 'activites')}
        class={toggleClass(benevolesMode === 'activites')}
      >
        Activités
      </button>
    </div>
  </div>
  <div class="space-y-1">
    {#each sortedBenevoles as b, i (b.id)}
      {@const value = benevolesMode === 'heures' ? b.heures : b.nb_activites}
      {@const pctLocales = benevolesMode === 'heures' ? (b.heures_locales / maxBenevoles) * 100 : 0}
      {@const pctExt = benevolesMode === 'heures'
        ? (b.heures_externes / maxBenevoles) * 100
        : (value / maxBenevoles) * 100}
      <a
        href={hashLink('/benevole/' + b.id)}
        class="flex items-center hover:bg-gray-50 cursor-pointer py-1 px-2 -mx-2 rounded transition-colors text-sm no-underline text-inherit"
      >
        <div class="w-8 text-center font-bold text-gray-400">{i + 1}</div>
        <div class="flex-1 min-w-0">
          <span class="font-medium text-gray-800 hover:text-(--color-crf-red) truncate block">
            {b.nom} {b.prenom}
          </span>
        </div>
        <div class="w-64 mx-4">
          <div class="bg-gray-200 rounded-full h-4 overflow-hidden flex">
            {#if benevolesMode === 'heures'}
              <div class="bg-green-500 h-full" style="width: {pctLocales}%"></div>
              <div class="bg-blue-500 h-full" style="width: {pctExt}%"></div>
            {:else}
              <div class="bg-(--color-crf-red) h-full" style="width: {pctExt}%"></div>
            {/if}
          </div>
        </div>
        {#if benevolesMode === 'heures'}
          <div class="w-32 text-right text-xs">
            <span class="text-green-600">{formatHeures(b.heures_locales)}</span>
            <span class="text-gray-400">/</span>
            <span class="text-blue-600">{formatHeures(b.heures_externes)}</span>
          </div>
        {/if}
        <div class="w-20 text-right font-semibold text-(--color-crf-red)">
          {benevolesMode === 'heures' ? formatHeures(value) + 'h' : value + ' act.'}
        </div>
      </a>
    {/each}
  </div>
  <div class="mt-4 text-xs text-gray-500 flex items-center gap-4">
    <span class="flex items-center gap-1"
      ><span class="w-3 h-3 bg-green-500 rounded"></span> Locales</span
    >
    <span class="flex items-center gap-1"
      ><span class="w-3 h-3 bg-blue-500 rounded"></span> Externes</span
    >
  </div>
</div>

<!-- Top 10 structures externes -->
{#if sortedStructures.length > 0}
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex items-center justify-between mb-4 flex-wrap gap-3">
      <h2 class="text-lg font-semibold text-gray-800">Top 10 structures externes</h2>
      <div class="flex rounded-lg overflow-hidden border border-gray-300">
        <button
          onclick={() => (structuresMode = 'heures')}
          class={toggleClass(structuresMode === 'heures')}
        >
          Heures
        </button>
        <button
          onclick={() => (structuresMode = 'activites')}
          class={toggleClass(structuresMode === 'activites')}
        >
          Activités
        </button>
      </div>
    </div>
    <div class="space-y-1">
      {#each sortedStructures as s, i (s.nom)}
        {@const value = structuresMode === 'heures' ? s.heures : s.nb_activites}
        {@const pct = (value / maxStructures) * 100}
        <div class="flex items-center py-1 text-sm">
          <div class="w-8 text-center font-bold text-gray-400">{i + 1}</div>
          <div class="flex-1 min-w-0">
            <a
              href={hashLink('/structure/' + encodeURIComponent(s.nom))}
              class="font-medium text-gray-800 hover:text-blue-600 truncate block"
            >
              {s.nom}
            </a>
          </div>
          <div class="w-64 mx-4">
            <div class="bg-gray-200 rounded-full h-4 overflow-hidden">
              <div class="bg-blue-500 h-full" style="width: {pct}%"></div>
            </div>
          </div>
          <div class="w-24 text-right text-xs text-gray-500">
            {s.nb_benevoles} {pluralize(s.nb_benevoles, 'bénévole')}
          </div>
          <div class="w-20 text-right font-semibold text-blue-600">
            {structuresMode === 'heures' ? formatHeures(value) + 'h' : value + ' act.'}
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}

<!-- Top 10 renforts -->
{#if sortedRenforts.length > 0}
  <div class="bg-white rounded-lg shadow p-6 mt-8">
    <div class="flex items-center justify-between mb-4 flex-wrap gap-3">
      <h2 class="text-lg font-semibold text-gray-800">Top 10 renforts</h2>
      <div class="flex rounded-lg overflow-hidden border border-gray-300">
        <button onclick={() => (benevolesMode = 'heures')} class={toggleClass(benevolesMode === 'heures')}>
          Heures
        </button>
        <button
          onclick={() => (benevolesMode = 'activites')}
          class={toggleClass(benevolesMode === 'activites')}
        >
          Activités
        </button>
      </div>
    </div>
    <div class="space-y-1">
      {#each sortedRenforts as b, i (b.id)}
        {@const value = benevolesMode === 'heures' ? b.heures : b.nb_activites}
        {@const pctLocales = benevolesMode === 'heures' ? (b.heures_locales / maxRenforts) * 100 : 0}
        {@const pctExt = benevolesMode === 'heures'
          ? (b.heures_externes / maxRenforts) * 100
          : (value / maxRenforts) * 100}
        <a
          href={hashLink('/benevole/' + b.id)}
          class="flex items-center hover:bg-gray-50 cursor-pointer py-1 px-2 -mx-2 rounded transition-colors text-sm no-underline text-inherit"
        >
          <div class="w-8 text-center font-bold text-gray-400">{i + 1}</div>
          <div class="flex-1 min-w-0 truncate">
            <span class="font-medium text-gray-800 hover:text-(--color-crf-red)">
              {b.nom} {b.prenom}
            </span>
            {#if b.structure}
              <span class="text-xs text-gray-400 ml-2">
                {b.structure}
              </span>
            {/if}
          </div>
          <div class="w-64 mx-4">
            <div class="bg-gray-200 rounded-full h-4 overflow-hidden flex">
              {#if benevolesMode === 'heures'}
                <div class="bg-green-500 h-full" style="width: {pctLocales}%"></div>
                <div class="bg-blue-500 h-full" style="width: {pctExt}%"></div>
              {:else}
                <div class="bg-(--color-crf-red) h-full" style="width: {pctExt}%"></div>
              {/if}
            </div>
          </div>
          {#if benevolesMode === 'heures'}
            <div class="w-32 text-right text-xs">
              <span class="text-green-600">{formatHeures(b.heures_locales)}</span>
              <span class="text-gray-400">/</span>
              <span class="text-blue-600">{formatHeures(b.heures_externes)}</span>
            </div>
          {/if}
          <div class="w-20 text-right font-semibold text-(--color-crf-red)">
            {benevolesMode === 'heures' ? formatHeures(value) + 'h' : value + ' act.'}
          </div>
        </a>
      {/each}
    </div>
    <div class="mt-4 text-xs text-gray-500 flex items-center gap-4">
      <span class="flex items-center gap-1"
        ><span class="w-3 h-3 bg-green-500 rounded"></span> Locales</span
      >
      <span class="flex items-center gap-1"
        ><span class="w-3 h-3 bg-blue-500 rounded"></span> Externes</span
      >
    </div>
  </div>
{/if}
