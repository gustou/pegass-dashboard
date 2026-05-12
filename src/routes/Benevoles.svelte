<script lang="ts">
  import { dataStore } from '../stores/data.svelte';
  import { hashLink } from '../lib/router.svelte';
  import { formatHeures } from '../lib/format';

  type SortKey = 'nom' | 'prenom' | 'heures' | 'locales' | 'externes' | 'missions';

  const data = $derived(dataStore.state.data!);

  let search = $state('');
  let membresOnly = $state(false);
  let sortKey = $state<SortKey>('heures');
  let sortAsc = $state(false);

  function compareBy(key: SortKey) {
    return (a: typeof data.benevoles[number], b: typeof data.benevoles[number]) => {
      let av: string | number;
      let bv: string | number;
      switch (key) {
        case 'nom':
          av = a.nom ?? '';
          bv = b.nom ?? '';
          break;
        case 'prenom':
          av = a.prenom ?? '';
          bv = b.prenom ?? '';
          break;
        case 'heures':
          av = a.heures?.total ?? 0;
          bv = b.heures?.total ?? 0;
          break;
        case 'locales':
          av = a.heures?.locales ?? 0;
          bv = b.heures?.locales ?? 0;
          break;
        case 'externes':
          av = a.heures?.externes ?? 0;
          bv = b.heures?.externes ?? 0;
          break;
        case 'missions':
          av = (a.missions ?? []).length;
          bv = (b.missions ?? []).length;
          break;
      }
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortAsc ? av - bv : bv - av;
      }
      const cmp = String(av).localeCompare(String(bv), 'fr');
      return sortAsc ? cmp : -cmp;
    };
  }

  const filtered = $derived(
    data.benevoles
      .filter((b) => {
        if (membresOnly && b.renfort) return false;
        if (!search.trim()) return true;
        const haystack = [b.nom, b.prenom, b.structure, b.nivol, b.id]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(search.toLowerCase());
      })
      .slice()
      .sort(compareBy(sortKey))
  );

  function toggleSort(key: SortKey): void {
    if (sortKey === key) sortAsc = !sortAsc;
    else {
      sortKey = key;
      sortAsc = key === 'nom' || key === 'prenom';
    }
  }

  function sortIcon(key: SortKey): string {
    if (sortKey !== key) return '';
    return sortAsc ? ' ↑' : ' ↓';
  }

  function truncate(s: string | undefined, n: number): string {
    const v = s ?? '';
    return v.length > n ? v.slice(0, n) + '…' : v;
  }
</script>

<div class="mb-6 flex justify-between items-center flex-wrap gap-4">
  <div>
    <h1 class="text-2xl font-bold text-gray-800">Liste des bénévoles</h1>
    <p class="text-gray-600">
      {filtered.length}
      {filtered.length > 1 ? 'bénévoles' : 'bénévole'}
      {#if filtered.length !== data.stats.total_benevoles}
        / {data.stats.total_benevoles} total
      {/if}
    </p>
  </div>
  <div class="flex gap-4 items-center flex-wrap">
    <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
      <input
        type="checkbox"
        bind:checked={membresOnly}
        class="w-4 h-4 text-red-600 rounded focus:ring-red-500"
      />
      Membres uniquement (sans renforts)
    </label>
    <input
      type="text"
      bind:value={search}
      placeholder="Rechercher…"
      class="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
    />
  </div>
</div>

<div class="bg-white rounded-lg shadow overflow-x-auto">
  <table class="w-full divide-y divide-gray-200" style="min-width: 900px;">
    <thead class="bg-gray-50">
      <tr>
        <th
          class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
          onclick={() => toggleSort('nom')}
        >
          Nom{sortIcon('nom')}
        </th>
        <th
          class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
          onclick={() => toggleSort('prenom')}
        >
          Prénom{sortIcon('prenom')}
        </th>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Structure
        </th>
        <th
          class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
          onclick={() => toggleSort('heures')}
        >
          Heures{sortIcon('heures')}
        </th>
        <th
          class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
          onclick={() => toggleSort('locales')}
        >
          <span class="text-green-600">Locales{sortIcon('locales')}</span>
        </th>
        <th
          class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
          onclick={() => toggleSort('externes')}
        >
          <span class="text-blue-600">Externes{sortIcon('externes')}</span>
        </th>
        <th
          class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
          onclick={() => toggleSort('missions')}
        >
          Missions{sortIcon('missions')}
        </th>
        <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
          Type
        </th>
        <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
          Actions
        </th>
      </tr>
    </thead>
    <tbody class="bg-white divide-y divide-gray-200">
      {#each filtered as b (b.id)}
        <tr class="hover:bg-gray-50">
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{b.nom ?? ''}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{b.prenom ?? ''}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {truncate(b.structure, 40)}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-(--color-crf-red)">
            {formatHeures(b.heures?.total)}h
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
            {formatHeures(b.heures?.locales)}h
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600">
            {formatHeures(b.heures?.externes)}h
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
            {(b.missions ?? []).length}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-center text-sm">
            {#if b.renfort}
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                Renfort
              </span>
            {:else}
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
              >
                Membre
              </span>
            {/if}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-center text-sm">
            <a
              href={hashLink('/benevole/' + b.id)}
              class="text-(--color-crf-red) hover:underline"
            >
              Voir détail
            </a>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<div class="mt-4 text-sm text-gray-500">
  Cliquez sur les en-têtes de colonnes pour trier.
</div>
