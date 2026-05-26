<script lang="ts">
  interface Props {
    statut: string;
  }
  let { statut }: Props = $props();
</script>

{#if statut === 'VALIDEE' || statut === 'Validée'}
  <span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Validée</span>
{:else if statut === 'EN_ATTENTE' || statut === 'En attente'}
  <span class="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">En attente</span>
{:else if statut === 'ANNULEE' || statut === 'ANNULE' || statut === 'Annulée'}
  <span class="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Annulée</span>
{:else if statut}
  <span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">{statut}</span>
{:else}
  <span class="text-gray-400">-</span>
{/if}
