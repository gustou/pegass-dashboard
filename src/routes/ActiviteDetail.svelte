<script lang="ts">
  import { dataStore } from '../stores/data.svelte';
  import { hashLink } from '../lib/router.svelte';
  import { formatHeures } from '../lib/format';
  import { computeActiviteDetail } from '../lib/derived';
  import StatusBadge from '../components/StatusBadge.svelte';

  interface Props {
    id: string;
  }
  let { id }: Props = $props();

  const data = $derived(dataStore.state.data!);
  const detail = $derived(computeActiviteDetail(id, data));

  function timeOnly(s: string): string {
    if (!s || s.length <= 11) return '';
    return s.slice(11, 16);
  }

  function goBack(): void {
    if (window.history.length > 1) window.history.back();
    else window.location.hash = '#/dashboard';
  }
</script>

{#if !detail}
  <div class="text-center py-12">
    <h1 class="text-2xl font-bold text-gray-800">Activité introuvable</h1>
    <a
      href={hashLink('/dashboard')}
      class="inline-block mt-4 text-(--color-crf-red) hover:underline"
    >
      ← Retour au tableau de bord
    </a>
  </div>
{:else}
  <div class="mb-6">
    <button onclick={goBack} class="text-(--color-crf-red) hover:underline">← Retour</button>
  </div>

  <div class="bg-white rounded-lg shadow p-6 mb-6">
    <div class="flex items-start justify-between flex-wrap gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">{detail.info.nom}</h1>
        <p class="text-gray-600 mt-1">{detail.info.groupeAction}</p>
        <div class="mt-2">
          {#if detail.info.externe}
            <a
              href={hashLink('/structure/' + encodeURIComponent(detail.info.structure))}
              class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200"
            >
              Externe — {detail.info.structure}
            </a>
          {:else}
            <span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Local</span>
          {/if}
        </div>
      </div>
      <div class="text-right">
        <div class="text-3xl font-bold text-(--color-crf-red)">{formatHeures(detail.total_heures)}h</div>
        <div class="text-sm text-gray-500">Total heures</div>
      </div>
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
    <div class="bg-white rounded-lg shadow p-6">
      <div class="text-sm font-medium text-gray-500 uppercase">Participations</div>
      <div class="mt-2 text-2xl font-bold text-gray-800">{detail.participations.length}</div>
    </div>

    <div class="bg-white rounded-lg shadow p-6">
      <div class="text-sm font-medium text-gray-500 uppercase">Bénévoles uniques</div>
      <div class="mt-2 text-2xl font-bold text-gray-800">{detail.benevoles_uniques}</div>
    </div>

    <div class="bg-white rounded-lg shadow p-6">
      <div class="text-sm font-medium text-gray-500 uppercase">Séances</div>
      <div class="mt-2 text-2xl font-bold text-gray-800">{detail.nb_seances}</div>
    </div>
  </div>

  <div class="bg-white rounded-lg shadow overflow-hidden">
    <div class="px-6 py-4 border-b">
      <h2 class="text-lg font-semibold text-gray-800">Participations</h2>
    </div>
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horaires</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bénévole</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Heures</th>
            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          {#each detail.participations as p, i (p.benevole_id + i)}
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.date}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {timeOnly(p.debut)} - {timeOnly(p.fin)}
              </td>
              <td class="px-6 py-4 text-sm">
                <a
                  href={hashLink('/benevole/' + p.benevole_id)}
                  class="text-gray-800 hover:text-(--color-crf-red) font-medium"
                >
                  {p.benevole_nom} {p.benevole_prenom}
                </a>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-(--color-crf-red)">
                {formatHeures(p.heures)}h
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-center">
                <StatusBadge statut={p.statut} />
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="5" class="px-6 py-8 text-center text-gray-500">Aucune participation</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
{/if}
