<script lang="ts">
  import { dataStore } from '../stores/data.svelte';
  import { router } from '../lib/router.svelte';

  let dragOver = $state(false);
  let fileInput = $state<HTMLInputElement | undefined>(undefined);

  $effect(() => {
    if (dataStore.state.data && !dataStore.state.loading) {
      router.navigate('/dashboard');
    }
  });

  async function handleFile(file: File): Promise<void> {
    if (!file.name.toLowerCase().endsWith('.json')) {
      // Le store mettra l'erreur lui-même si le JSON est invalide ;
      // ici on bloque seulement les extensions non-.json
      dataStore.state.error = 'Veuillez sélectionner un fichier .json';
      return;
    }
    await dataStore.loadFromFile(file);
    if (dataStore.state.data) {
      router.navigate('/dashboard');
    }
  }

  function onDrop(e: DragEvent): void {
    e.preventDefault();
    dragOver = false;
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  }

  function onDragOver(e: DragEvent): void {
    e.preventDefault();
    dragOver = true;
  }

  function onDragLeave(): void {
    dragOver = false;
  }

  function onChange(e: Event): void {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) handleFile(file);
  }
</script>

<div class="max-w-2xl mx-auto">
  <div class="bg-white rounded-lg shadow-md p-8">
    <h1 class="text-2xl font-bold text-gray-800 mb-6 text-center">
      Importer les données Pegass
    </h1>

    <button
      type="button"
      class="w-full border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors {dragOver
        ? 'border-(--color-crf-red) bg-red-50'
        : 'border-gray-300 hover:border-(--color-crf-red)'} {dataStore.state.loading
        ? 'opacity-50 pointer-events-none'
        : ''}"
      onclick={() => fileInput?.click()}
      ondragover={onDragOver}
      ondragleave={onDragLeave}
      ondrop={onDrop}
    >
      <div class="space-y-4">
        <svg
          class="mx-auto h-16 w-16 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p class="text-lg text-gray-600">Glissez votre fichier JSON ici</p>
        <p class="text-sm text-gray-400">ou cliquez pour sélectionner</p>
      </div>
      <input
        bind:this={fileInput}
        type="file"
        accept=".json,application/json"
        class="hidden"
        onchange={onChange}
      />
    </button>

    {#if dataStore.state.loading}
      <div class="mt-6 flex items-center justify-center gap-3 text-gray-600">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-(--color-crf-red)"></div>
        <span>Chargement en cours…</span>
      </div>
    {/if}

    {#if dataStore.state.error}
      <div class="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <p class="text-red-600">{dataStore.state.error}</p>
      </div>
    {/if}

    <div class="mt-8 p-4 bg-gray-50 rounded-lg">
      <h3 class="font-semibold text-gray-700 mb-2">Comment obtenir le fichier JSON ?</h3>
      <ol class="text-sm text-gray-600 space-y-1 list-decimal list-inside">
        <li>Ouvrez Pegass dans Firefox</li>
        <li>Cliquez sur l'extension Pegass Extractor</li>
        <li>Sélectionnez la période et lancez l'extraction</li>
        <li>Téléchargez le fichier JSON</li>
        <li>Importez-le ici</li>
      </ol>
    </div>

    <p class="mt-6 text-xs text-gray-400 text-center">
      Toutes les données restent dans votre navigateur. Rien n'est envoyé sur Internet.
    </p>
  </div>
</div>
