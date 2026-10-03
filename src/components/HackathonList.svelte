<script>
  import { createEventDispatcher } from 'svelte';
  import { filteredHackathons, hackathons, activeFiltersCount } from '../stores/hackathons.js';
  import HackathonCard from './HackathonCard.svelte';
  import EmptyState from './EmptyState.svelte';

  const dispatch = createEventDispatcher();
</script>

{#if $filteredHackathons.length > 0}
  <div class="hackathons-grid">
    {#each $filteredHackathons as hackathon (hackathon.id)}
      <HackathonCard
        {hackathon}
        on:viewDetails={(e) => dispatch('viewDetails', e.detail)}
        on:edit={(e) => dispatch('edit', e.detail)}
        on:delete={(e) => dispatch('delete', e.detail)}
      />
    {/each}
  </div>
{:else}
  <EmptyState
    isSearchActive={$hackathons.length > 0 || $activeFiltersCount > 0}
    on:openAddModal={() => dispatch('openAddModal')}
    on:resetSampleData={() => hackathons.resetToSampleData()}
  />
{/if}

<style>
  .hackathons-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
    margin-bottom: 2.5rem;
  }

  @media (max-width: 1080px) {
    .hackathons-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 1.25rem;
    }
  }

  @media (max-width: 680px) {
    .hackathons-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
  }
</style>
