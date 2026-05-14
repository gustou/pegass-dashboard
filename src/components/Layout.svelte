<script lang="ts">
  import { router, hashLink } from '../lib/router.svelte';
  import { dataStore } from '../stores/data.svelte';
  import { filters } from '../stores/filters.svelte';
  import { downloadBlob, timestamp } from '../lib/download';
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();

  const hasData = $derived(dataStore.state.data !== null);
  let exporting = $state(false);

  $effect(() => {
    localStorage.setItem('pegass_activity_filter', JSON.stringify(filters.selectedActivities));
  });

  function isActive(path: string): boolean {
    return router.path === path;
  }

  function navClass(path: string): string {
    return [
      'px-3 py-2 rounded-md text-sm font-medium',
      isActive(path) ? 'bg-gray-200' : 'hover:bg-gray-100'
    ].join(' ');
  }

  async function exportExcel(): Promise<void> {
    if (!dataStore.state.data || exporting) return;
    exporting = true;
    try {
      const { generateExcelBuffer } = await import('../lib/excel-export');
      const buffer = await generateExcelBuffer(dataStore.state.data);
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      downloadBlob(blob, `pegass_export_${timestamp()}.xlsx`);
    } finally {
      exporting = false;
    }
  }
</script>

<div class="min-h-screen flex flex-col bg-gray-100">
  <nav class="bg-white shadow-md">
    <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-20">
        <a href={hashLink('/')} class="flex items-center gap-3 no-underline">
          <img src="logo.png" alt="Logo" class="w-16 h-16 object-contain rounded-full shadow-sm bg-white" />
          <span class="text-xl font-semibold text-(--color-crf-red)">Tableau de bord bénévole (TABB)</span>
        </a>

        {#if hasData}
          <div class="flex items-center gap-2 flex-wrap">
            <div class="relative flex items-center gap-2 mr-2">
              <span class="text-sm text-gray-700 hidden md:inline">Activités :</span>
              <div class="dropdown group relative">
                <button class="px-3 py-2 border rounded-md bg-white text-sm focus:outline-none min-w-[150px] text-left flex justify-between items-center shadow-sm">
                  {filters.selectedActivities.length === 0 ? 'Toutes' : `${filters.selectedActivities.length} sélectionnée(s)`}
                  <span class="ml-2 text-xs">▼</span>
                </button>
                <div class="absolute right-0 mt-1 w-72 bg-white border rounded-md shadow-lg z-50 hidden group-hover:block group-focus-within:block max-h-64 overflow-y-auto">
                  {#each dataStore.availableActivities as act}
                    <label class="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm">
                      <input type="checkbox" value={act} bind:group={filters.selectedActivities} onchange={() => dataStore.reprocess()} class="rounded text-red-600 focus:ring-red-500" />
                      <span class="truncate flex-1" title={act}>{act}</span>
                    </label>
                  {/each}
                </div>
              </div>
            </div>

            <a href={hashLink('/dashboard')} class={navClass('/dashboard')}>
              Tableau de bord
            </a>
            <a href={hashLink('/benevoles')} class={navClass('/benevoles')}>
              Bénévoles
            </a>
            <div class="dropdown group relative ml-2">
              <button class="px-3 py-2 rounded-md text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 focus:outline-none flex items-center gap-1">
                Actions
                <span class="text-xs">▼</span>
              </button>
              <div class="absolute right-0 mt-1 w-48 bg-white border rounded-md shadow-lg z-10 hidden group-hover:block group-focus-within:block overflow-hidden">
                <button
                  type="button"
                  onclick={exportExcel}
                  disabled={exporting}
                  class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-60"
                >
                  {exporting ? 'Export Excel en cours…' : 'Export Excel Global'}
                </button>
                <a
                  href={hashLink('/export-benevoles')}
                  class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Export Bénévoles Filtré
                </a>
                <div class="border-t my-1"></div>
                <button
                  type="button"
                  onclick={() => {
                    dataStore.reset();
                    router.navigate('/');
                  }}
                  class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  Nouveau fichier
                </button>
              </div>
            </div>>
          </div>
        {/if}
      </div>
    </div>
  </nav>

  <main class="flex-1 w-full max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {@render children()}
  </main>

  <footer class="bg-white border-t">
    <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <p class="text-center text-gray-500 text-sm">
        Croix-Rouge française — Outil de statistiques bénévoles
      </p>
    </div>
  </footer>
</div>
