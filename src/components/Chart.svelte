<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Chart, registerables, type ChartConfiguration } from 'chart.js';

  Chart.register(...registerables);

  interface Props {
    config: ChartConfiguration;
    height?: number;
  }

  let { config, height = 200 }: Props = $props();

  let canvas = $state<HTMLCanvasElement | undefined>(undefined);
  let chartInstance: Chart | null = null;

  onMount(() => {
    if (!canvas) return;
    chartInstance = new Chart(canvas, config);
  });

  onDestroy(() => {
    chartInstance?.destroy();
  });
</script>

<canvas bind:this={canvas} {height}></canvas>
