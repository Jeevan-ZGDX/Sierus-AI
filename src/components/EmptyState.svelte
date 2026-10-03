<script>
  import { createEventDispatcher } from 'svelte';
  import { resetFilters } from '../stores/hackathons.js';
  import Icon from './Icon.svelte';

  export let isSearchActive = false;

  const dispatch = createEventDispatcher();
</script>

<div class="empty-state">
  <div class="empty-icon-box">
    {#if isSearchActive}
      <Icon name="search" size={36} />
    {:else}
      <Icon name="trophy" size={36} />
    {/if}
  </div>

  <h3 class="empty-title">
    {#if isSearchActive}
      No hackathons found
    {:else}
      No hackathons yet
    {/if}
  </h3>

  <p class="empty-description">
    {#if isSearchActive}
      We couldn't find any hackathons matching your search query or filters. Try adjusting your keywords or clearing active filters.
    {:else}
      Start organizing and tracking your hackathon journey today. Add your first hackathon or load sample data.
    {/if}
  </p>

  <div class="empty-actions">
    {#if isSearchActive}
      <button class="btn-primary" on:click={resetFilters}>
        <Icon name="rotate-ccw" size={16} />
        <span>Reset Filters</span>
      </button>
    {:else}
      <button class="btn-primary" on:click={() => dispatch('openAddModal')}>
        <Icon name="plus" size={18} />
        <span>Add Hackathon</span>
      </button>
      <button class="btn-secondary" on:click={() => dispatch('resetSampleData')}>
        <Icon name="rotate-ccw" size={16} />
        <span>Load Sample Data</span>
      </button>
    {/if}
  </div>
</div>

<style>
  .empty-state {
    background-color: var(--bg-surface);
    border: 2px dashed var(--border-medium);
    border-radius: var(--radius-xl);
    padding: 3.5rem 2rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin: 1.5rem 0;
  }

  .empty-icon-box {
    width: 72px;
    height: 72px;
    border-radius: var(--radius-full);
    background-color: var(--primary-50);
    color: var(--primary-600);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.25rem;
  }

  .empty-title {
    font-size: 1.35rem;
    font-weight: 800;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }

  .empty-description {
    font-size: 0.9375rem;
    color: var(--text-secondary);
    max-width: 460px;
    line-height: 1.5;
    margin-bottom: 1.5rem;
  }

  .empty-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    justify-content: center;
  }
</style>
