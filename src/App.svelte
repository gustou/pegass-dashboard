<script lang="ts">
  import { onMount } from 'svelte';
  import { router } from './lib/router.svelte';
  import { dataStore } from './stores/data.svelte';
  import Layout from './components/Layout.svelte';
  import Home from './routes/Home.svelte';
  import Dashboard from './routes/Dashboard.svelte';
  import Benevoles from './routes/Benevoles.svelte';
  import BenevoleDetail from './routes/BenevoleDetail.svelte';
  import StructureDetail from './routes/StructureDetail.svelte';
  import ActiviteDetail from './routes/ActiviteDetail.svelte';
  import ExportBenevoles from './routes/ExportBenevoles.svelte';
  import NotFound from './routes/NotFound.svelte';

  onMount(() => {
    dataStore.hydrateFromStorage();
  });

  const hasData = $derived(dataStore.state.data !== null);

  // Matchs explicites (un seul actif à la fois)
  const matchHome = $derived(router.match('/'));
  const matchDashboard = $derived(router.match('/dashboard'));
  const matchBenevoles = $derived(router.match('/benevoles'));
  const matchBenevole = $derived(router.match('/benevole/:id'));
  const matchStructure = $derived(router.match('/structure/:nom'));
  const matchActivite = $derived(router.match('/activite/:id'));
  const matchExportBenevoles = $derived(router.match('/export-benevoles'));
</script>

<Layout>
  {#if matchHome !== null}
    <Home />
  {:else if !hasData}
    <Home />
  {:else if matchDashboard !== null}
    <Dashboard />
  {:else if matchBenevoles !== null}
    <Benevoles />
  {:else if matchBenevole !== null}
    <BenevoleDetail id={matchBenevole.id ?? ''} />
  {:else if matchStructure !== null}
    <StructureDetail nom={matchStructure.nom ?? ''} />
  {:else if matchActivite !== null}
    <ActiviteDetail id={matchActivite.id ?? ''} />
  {:else if matchExportBenevoles !== null}
    <ExportBenevoles />
  {:else}
    <NotFound />
  {/if}
</Layout>
