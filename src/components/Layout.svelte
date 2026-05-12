<script lang="ts">
  import { router, hashLink } from '../lib/router.svelte';
  import { dataStore } from '../stores/data.svelte';
  import { downloadBlob, timestamp } from '../lib/download';
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();

  const hasData = $derived(dataStore.state.data !== null);
  let exporting = $state(false);

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
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <a href={hashLink('/')} class="flex items-center gap-3 no-underline">
          <div class="w-10 h-10 bg-(--color-crf-red) rounded flex items-center justify-center">
            <span class="text-white text-2xl font-bold leading-none">+</span>
          </div>
          <span class="text-xl font-semibold text-(--color-crf-red)">Pegass Dashboard</span>
        </a>

        {#if hasData}
          <div class="flex items-center gap-2 flex-wrap">
            <a href={hashLink('/dashboard')} class={navClass('/dashboard')}>
              Tableau de bord
            </a>
            <a href={hashLink('/benevoles')} class={navClass('/benevoles')}>
              Bénévoles
            </a>
            <button
              type="button"
              onclick={exportExcel}
              disabled={exporting}
              class="px-3 py-2 rounded-md text-sm font-medium bg-(--color-crf-red) text-white hover:bg-(--color-crf-red-dark) disabled:opacity-60"
            >
              {exporting ? 'Export…' : 'Export Excel'}
            </button>
            <a
              href={hashLink('/export-benevoles')}
              class="px-3 py-2 rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700"
            >
              Export Bénévoles
            </a>
            <button
              onclick={() => {
                dataStore.reset();
                router.navigate('/');
              }}
              class="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:bg-gray-100"
            >
              Nouveau fichier
            </button>
          </div>
        {/if}
      </div>
    </div>
  </nav>

  <main class="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {@render children()}
  </main>

  <footer class="bg-white border-t">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <p class="text-center text-gray-500 text-sm">
        Croix-Rouge française — Outil de statistiques bénévoles
      </p>
    </div>
  </footer>
</div>
