<script lang="ts">
  import { hashLink } from '../lib/router.svelte';
</script>

<div class="text-center py-12">
  <h1 class="text-3xl font-bold text-gray-800">Page introuvable</h1>
  <p class="mt-2 text-gray-600">L'adresse demandée n'existe pas.</p>
  <a
    href={hashLink('/')}
    class="inline-block mt-6 px-4 py-2 bg-(--color-crf-red) text-white rounded-md hover:bg-(--color-crf-red-dark)"
  >
    Retour à l'accueil
  </a>
</div>
