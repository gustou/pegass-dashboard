<script lang="ts">
  import type { ChartConfiguration } from 'chart.js';
  import { dataStore } from '../stores/data.svelte';
  import { hashLink, router } from '../lib/router.svelte';
  import { formatHeures, formatMonth } from '../lib/format';
  import {
    computeHeuresLocalesExternesParMois,
    computeTopCoequipiers,
    sortMissionsByDateDesc,
    type Coequipier
  } from '../lib/derived';
  import Chart from '../components/Chart.svelte';
  import StatusBadge from '../components/StatusBadge.svelte';

  interface Props {
    id: string;
  }
  let { id }: Props = $props();

  const data = $derived(dataStore.state.data!);
  const benevole = $derived(data.benevoles.find((b) => b.id === id));

  const heures = $derived(benevole?.heures ?? { total: 0, par_mois: {}, par_type: {} });

  const heuresParMoisLE = $derived(
    benevole ? computeHeuresLocalesExternesParMois(benevole) : { locales: {}, externes: {} }
  );

  const allMonths = $derived(
    [
      ...new Set([
        ...Object.keys(heuresParMoisLE.locales),
        ...Object.keys(heuresParMoisLE.externes)
      ])
    ].sort()
  );

  const coequipiers = $derived(benevole ? computeTopCoequipiers(id, data) : []);
  const missionsSorted = $derived(benevole ? sortMissionsByDateDesc(benevole.missions ?? []) : []);

  const nbMois = $derived(Object.keys(heures.par_mois).length);
  const moyenneMensuelle = $derived(nbMois > 0 ? heures.total / nbMois : 0);

  const chartMois = $derived<ChartConfiguration>({
    type: 'bar',
    data: {
      labels: allMonths.map(formatMonth),
      datasets: [
        {
          label: 'Heures locales',
          data: allMonths.map((m) => heuresParMoisLE.locales[m] ?? 0),
          backgroundColor: '#22c55e',
          borderRadius: 4
        },
        {
          label: 'Heures externes',
          data: allMonths.map((m) => heuresParMoisLE.externes[m] ?? 0),
          backgroundColor: '#3b82f6',
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: true, position: 'top' } },
      scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } }
    }
  });

  const TYPE_COLORS = ['#e30613', '#ff5722', '#ff9800', '#ffc107', '#8bc34a', '#4caf50'];

  const chartType = $derived<ChartConfiguration>({
    type: 'doughnut',
    data: {
      labels: Object.keys(heures.par_type),
      datasets: [
        {
          data: Object.values(heures.par_type),
          backgroundColor: TYPE_COLORS.slice(0, Object.keys(heures.par_type).length)
        }
      ]
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
  });

  // Modale activités communes
  let openCoequipier = $state<Coequipier | null>(null);

  function openModal(c: Coequipier): void {
    openCoequipier = c;
  }

  function closeModal(): void {
    openCoequipier = null;
  }

  function onKey(e: KeyboardEvent): void {
    if (e.key === 'Escape') closeModal();
  }

  function formatDateFR(s: string): string {
    if (!s) return '';
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    return d.toLocaleDateString('fr-FR');
  }

  const maxCoequipiersAct = $derived(coequipiers.length > 0 ? coequipiers[0]!.nb_activites : 1);
</script>

<svelte:window onkeydown={onKey} />

{#if !benevole}
  <div class="text-center py-12">
    <h1 class="text-2xl font-bold text-gray-800">Bénévole introuvable</h1>
    <a href={hashLink('/benevoles')} class="inline-block mt-4 text-(--color-crf-red) hover:underline">
      ← Retour à la liste
    </a>
  </div>
{:else}
  <div class="mb-6">
    <a href={hashLink('/benevoles')} class="text-(--color-crf-red) hover:underline">
      ← Retour à la liste
    </a>
  </div>

  <!-- En-tête -->
  <div class="bg-white rounded-lg shadow p-6 mb-6">
    <div class="flex items-start justify-between flex-wrap gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">{benevole.nom} {benevole.prenom}</h1>
        <p class="text-gray-600 mt-1">{benevole.structure ?? ''}</p>
        <p class="text-sm text-gray-400 mt-1">ID: {benevole.id}</p>
      </div>
      <div class="text-right">
        <div class="text-3xl font-bold text-(--color-crf-red)">{formatHeures(heures.total)}h</div>
        <div class="text-sm text-gray-500">Total heures</div>
        {#if (heures.externes ?? 0) > 0}
          <div class="text-xs mt-1">
            <span class="text-green-600">{formatHeures(heures.locales)}h locales</span> /
            <span class="text-blue-600">{formatHeures(heures.externes)}h externes</span>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Statistiques -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
    <div class="bg-white rounded-lg shadow p-6">
      <div class="text-sm font-medium text-gray-500 uppercase">Participations</div>
      <div class="mt-2 text-2xl font-bold text-gray-800">{(benevole.missions ?? []).length}</div>
    </div>

    <div class="bg-white rounded-lg shadow p-6">
      <div class="text-sm font-medium text-gray-500 uppercase">Moyenne mensuelle</div>
      <div class="mt-2 text-2xl font-bold text-gray-800">{formatHeures(moyenneMensuelle)}h</div>
    </div>

    <div class="bg-white rounded-lg shadow p-6">
      <div class="text-sm font-medium text-gray-500 uppercase">Statut</div>
      <div
        class="mt-2 text-2xl font-bold {benevole.actif ? 'text-green-600' : 'text-gray-400'}"
      >
        {benevole.actif ? 'Actif' : 'Inactif'}
      </div>
    </div>
  </div>

  <!-- Graphiques -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-lg font-semibold text-gray-800 mb-4">Heures par mois</h2>
      <Chart config={chartMois} />
    </div>

    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-lg font-semibold text-gray-800 mb-4">Par type d'activité</h2>
      <Chart config={chartType} />
    </div>
  </div>

  <!-- Co-équipiers -->
  {#if coequipiers.length > 0}
    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <h2 class="text-lg font-semibold text-gray-800 mb-4">Top 10 co-équipiers</h2>
      <p class="text-sm text-gray-500 mb-4">
        Personnes ayant participé aux mêmes activités (cliquez pour voir les détails)
      </p>
      <div class="space-y-3">
        {#each coequipiers as c, i (c.id)}
          {@const percent = (c.nb_activites / maxCoequipiersAct) * 100}
          <button
            type="button"
            class="flex items-center w-full text-left hover:bg-gray-50 rounded p-2 -mx-2"
            onclick={() => openModal(c)}
          >
            <div class="w-8 text-center font-bold text-gray-400">{i + 1}</div>
            <div class="flex-1 min-w-0">
              <span class="font-medium {c.est_local ? 'text-green-700' : 'text-gray-800'}">
                {c.nom} {c.prenom}
                {#if c.est_local}
                  <span class="ml-1 px-1.5 py-0.5 text-xs rounded bg-green-100 text-green-700">
                    UL
                  </span>
                {/if}
              </span>
              {#if !c.est_local && c.structure}
                <span class="text-xs text-gray-400 block">
                  {c.structure.length > 30 ? c.structure.slice(0, 30) + '…' : c.structure}
                </span>
              {/if}
            </div>
            <div class="w-48 mx-4">
              <div class="bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  class="h-full rounded-full {c.est_local ? 'bg-green-500' : 'bg-blue-500'}"
                  style="width: {percent}%"
                ></div>
              </div>
            </div>
            <div
              class="w-24 text-right font-semibold {c.est_local
                ? 'text-green-600'
                : 'text-blue-600'}"
            >
              {c.nb_activites} activité{c.nb_activites > 1 ? 's' : ''}
            </div>
          </button>
        {/each}
      </div>
      <div class="mt-4 text-xs text-gray-500 flex items-center gap-4">
        <span class="flex items-center gap-1"
          ><span class="w-3 h-3 bg-green-500 rounded"></span> Membre de l'UL</span
        >
        <span class="flex items-center gap-1"
          ><span class="w-3 h-3 bg-blue-500 rounded"></span> Externe</span
        >
      </div>
    </div>
  {/if}

  <!-- Modale activités communes -->
  {#if openCoequipier}
    <div
      class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onclick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
      role="presentation"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div class="px-6 py-4 border-b flex justify-between items-center">
          <h3 class="text-lg font-semibold text-gray-800">
            Activités en commun avec
            <span class="text-(--color-crf-red)">
              {openCoequipier.nom}
              {openCoequipier.prenom}
            </span>
          </h3>
          <button
            onclick={closeModal}
            class="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            aria-label="Fermer"
          >
            &times;
          </button>
        </div>
        <div class="p-6 overflow-y-auto flex-1">
          <div class="space-y-2">
            {#each openCoequipier.activites as act (act.activiteId + act.date)}
              <div
                class="flex items-center justify-between p-3 rounded {act.externe
                  ? 'bg-blue-50'
                  : 'bg-green-50'}"
              >
                <div class="flex-1 min-w-0">
                  <a
                    href={hashLink('/activite/' + encodeURIComponent(act.activiteId))}
                    onclick={closeModal}
                    class="font-medium text-gray-800 hover:text-(--color-crf-red)"
                  >
                    {act.nom}
                  </a>
                  <div class="text-xs text-gray-500">{act.groupeAction}</div>
                </div>
                <div class="text-right ml-4">
                  <div class="text-sm font-medium text-gray-700">{formatDateFR(act.date)}</div>
                  <div class="text-xs {act.externe ? 'text-blue-600' : 'text-green-600'}">
                    {act.externe ? act.structure : 'Local'}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
        <div class="px-6 py-4 border-t flex justify-between items-center bg-gray-50">
          <span class="text-sm text-gray-500">
            {openCoequipier.nb_activites} activité{openCoequipier.nb_activites > 1 ? 's' : ''} en commun
          </span>
          <a
            href={hashLink('/benevole/' + openCoequipier.id)}
            onclick={() => {
              closeModal();
              router.navigate('/benevole/' + openCoequipier!.id);
            }}
            class="text-(--color-crf-red) hover:underline text-sm"
          >
            Voir le profil complet →
          </a>
        </div>
      </div>
    </div>
  {/if}

  <!-- Historique des missions -->
  <div class="bg-white rounded-lg shadow overflow-hidden">
    <div class="px-6 py-4 border-b">
      <h2 class="text-lg font-semibold text-gray-800">Historique des missions</h2>
    </div>
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activité</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Structure</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Heures</th>
            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          {#each missionsSorted as m, i (m.id ?? i)}
            <tr class="hover:bg-gray-50 {m.externe ? 'bg-blue-50' : ''}">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{m.date}</td>
              <td class="px-6 py-4 text-sm">
                {#if m.activiteId}
                  <a
                    href={hashLink('/activite/' + encodeURIComponent(m.activiteId))}
                    class="text-gray-700 hover:text-(--color-crf-red) hover:underline"
                  >
                    {m.nom}
                  </a>
                {:else}
                  <span class="text-gray-700">{m.nom}</span>
                {/if}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{m.groupeAction}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                {#if m.externe}
                  <a
                    href={hashLink('/structure/' + encodeURIComponent(m.structure ?? 'Externe'))}
                    class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200"
                  >
                    {m.structure ?? 'Externe'}
                  </a>
                {:else}
                  <span class="text-green-600 text-xs">Local</span>
                {/if}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-(--color-crf-red)">
                {m.heures}h
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-center">
                <StatusBadge statut={m.statut ?? ''} />
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                Aucune mission enregistrée
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
{/if}
