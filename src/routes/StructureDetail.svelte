<script lang="ts">
  import { dataStore } from '../stores/data.svelte';
  import { hashLink } from '../lib/router.svelte';
  import { formatHeures } from '../lib/format';
  import { computeStructureDetail, type StructureActivite } from '../lib/derived';

  interface Props {
    nom: string;
  }
  let { nom }: Props = $props();

  const data = $derived(dataStore.state.data!);
  const detail = $derived(computeStructureDetail(nom, data));

  let openActivite = $state<StructureActivite | null>(null);

  function openModal(act: StructureActivite): void {
    openActivite = act;
  }

  function closeModal(): void {
    openActivite = null;
  }

  function onKey(e: KeyboardEvent): void {
    if (e.key === 'Escape') closeModal();
  }
</script>

<svelte:window onkeydown={onKey} />

{#if !detail}
  <div class="text-center py-12">
    <h1 class="text-2xl font-bold text-gray-800">Structure introuvable</h1>
    <p class="text-gray-600 mt-2">Aucune activité externe enregistrée pour « {nom} ».</p>
    <a href={hashLink('/dashboard')} class="inline-block mt-4 text-(--color-crf-red) hover:underline">
      ← Retour au tableau de bord
    </a>
  </div>
{:else}
  <div class="mb-6">
    <a href={hashLink('/dashboard')} class="text-(--color-crf-red) hover:underline">
      ← Retour au tableau de bord
    </a>
  </div>

  <div class="bg-white rounded-lg shadow p-6 mb-6">
    <div class="flex items-start justify-between flex-wrap gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">{nom}</h1>
        <p class="text-gray-600 mt-1">Structure externe</p>
      </div>
      <div class="text-right">
        <div class="text-3xl font-bold text-blue-600">{formatHeures(detail.total_heures)}h</div>
        <div class="text-sm text-gray-500">Total heures</div>
      </div>
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
    <div class="bg-white rounded-lg shadow p-6">
      <div class="text-sm font-medium text-gray-500 uppercase">Activités</div>
      <div class="mt-2 text-2xl font-bold text-gray-800">{detail.nb_activites}</div>
    </div>

    <div class="bg-white rounded-lg shadow p-6">
      <div class="text-sm font-medium text-gray-500 uppercase">Bénévoles</div>
      <div class="mt-2 text-2xl font-bold text-gray-800">{detail.nb_benevoles}</div>
    </div>

    <div class="bg-white rounded-lg shadow p-6">
      <div class="text-sm font-medium text-gray-500 uppercase">Moyenne par bénévole</div>
      <div class="mt-2 text-2xl font-bold text-gray-800">
        {detail.nb_benevoles > 0
          ? formatHeures(detail.total_heures / detail.nb_benevoles)
          : '0'}h
      </div>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Liste des activités -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <div class="px-6 py-4 border-b">
        <h2 class="text-lg font-semibold text-gray-800">Activités ({detail.nb_activites})</h2>
      </div>
      <div class="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {#each detail.activites as act (act.id)}
          <button
            type="button"
            class="block w-full text-left px-6 py-4 hover:bg-gray-50"
            onclick={() => openModal(act)}
          >
            <div class="flex items-center justify-between">
              <div class="flex-1 min-w-0">
                <a
                  href={hashLink('/activite/' + encodeURIComponent(act.id))}
                  class="font-medium text-gray-800 hover:text-(--color-crf-red) block truncate"
                  onclick={(e) => e.stopPropagation()}
                >
                  {act.nom}
                </a>
                <div class="text-xs text-gray-500">{act.groupeAction}</div>
              </div>
              <div class="text-right ml-4">
                <div class="text-sm font-medium text-blue-600">{formatHeures(act.heures)}h</div>
                <div class="text-xs text-gray-400">
                  {act.nb_benevoles} bénévole{act.nb_benevoles > 1 ? 's' : ''}
                </div>
              </div>
            </div>
            <div class="text-xs text-gray-400 mt-1">{act.date}</div>
          </button>
        {:else}
          <div class="px-6 py-8 text-center text-gray-500">Aucune activité</div>
        {/each}
      </div>
    </div>

    <!-- Liste des bénévoles -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <div class="px-6 py-4 border-b">
        <h2 class="text-lg font-semibold text-gray-800">Bénévoles ({detail.nb_benevoles})</h2>
      </div>
      <div class="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {#each detail.benevoles as b (b.id)}
          <div class="px-6 py-4 hover:bg-gray-50">
            <div class="flex items-center justify-between">
              <div class="flex-1 min-w-0">
                <a
                  href={hashLink('/benevole/' + b.id)}
                  class="font-medium text-gray-800 hover:text-(--color-crf-red) block truncate"
                >
                  {b.nom} {b.prenom}
                </a>
                <div class="text-xs text-gray-500">
                  {b.nb_activites} activité{b.nb_activites > 1 ? 's' : ''}
                </div>
              </div>
              <div class="text-right ml-4">
                <div class="text-sm font-medium text-blue-600">{formatHeures(b.heures)}h</div>
              </div>
            </div>
          </div>
        {:else}
          <div class="px-6 py-8 text-center text-gray-500">Aucun bénévole</div>
        {/each}
      </div>
    </div>
  </div>

  <!-- Modale bénévoles par activité -->
  {#if openActivite}
    {@const list = detail.benevoles_par_activite[openActivite.id] ?? []}
    <div
      class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onclick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
      role="presentation"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col">
        <div class="px-6 py-4 border-b flex justify-between items-center">
          <h3 class="text-lg font-semibold text-gray-800">
            Bénévoles pour <span class="text-blue-600">{openActivite.nom}</span>
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
            {#each list as b (b.id)}
              <div class="flex items-center justify-between p-3 rounded bg-blue-50">
                <a
                  href={hashLink('/benevole/' + b.id)}
                  onclick={closeModal}
                  class="font-medium text-gray-800 hover:text-(--color-crf-red)"
                >
                  {b.nom} {b.prenom}
                </a>
                <span class="text-sm font-medium text-blue-600">{formatHeures(b.heures)}h</span>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  {/if}
{/if}
