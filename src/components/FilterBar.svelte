<script>
  import {
    selectedCategory,
    selectedMode,
    selectedStatus,
    onlyBookmarked,
    sortBy,
    activeFiltersCount,
    resetFilters,
    filteredHackathons,
    hackathons
  } from '../stores/hackathons.js';
  import { CATEGORIES, MODES, STATUSES } from '../data/sampleHackathons.js';
  import Icon from './Icon.svelte';

  function toggleBookmarked() {
    onlyBookmarked.update(val => !val);
  }
</script>

<div class="filter-panel">
  <!-- Top Row: Category Pills -->
  <div class="category-scroll-container">
    <div class="category-pills">
      {#each CATEGORIES as cat}
        <button
          class="cat-pill"
          class:cat-pill-active={$selectedCategory === cat}
          on:click={() => selectedCategory.set(cat)}
        >
          {cat}
        </button>
      {/each}
    </div>
  </div>

  <!-- Bottom Row: Dropdown Filters, Bookmark Toggle, Sort, and Reset -->
  <div class="filter-controls-row">
    <div class="filter-group">
      <!-- Mode Filter -->
      <div class="select-wrapper">
        <label for="mode-select" class="filter-label">Mode:</label>
        <select id="mode-select" bind:value={$selectedMode} class="filter-select">
          {#each MODES as mode}
            <option value={mode}>{mode === 'All' ? 'All Modes' : mode}</option>
          {/each}
        </select>
      </div>

      <!-- Status Filter -->
      <div class="select-wrapper">
        <label for="status-select" class="filter-label">Status:</label>
        <select id="status-select" bind:value={$selectedStatus} class="filter-select">
          {#each STATUSES as status}
            <option value={status}>{status === 'All' ? 'All Statuses' : status}</option>
          {/each}
        </select>
      </div>

      <!-- Bookmarked Toggle Button -->
      <button
        class="bookmark-filter-btn"
        class:active={$onlyBookmarked}
        on:click={toggleBookmarked}
        title="Show only bookmarked hackathons"
      >
        <Icon name="star" size={14} filled={$onlyBookmarked} />
        <span>Bookmarked</span>
      </button>

      <!-- Sort Filter -->
      <div class="select-wrapper">
        <label for="sort-select" class="filter-label">Sort:</label>
        <select id="sort-select" bind:value={$sortBy} class="filter-select">
          <option value="deadline-asc">Deadline (Soonest)</option>
          <option value="deadline-desc">Deadline (Latest)</option>
          <option value="title-asc">Title (A – Z)</option>
          <option value="start-date">Event Start Date</option>
        </select>
      </div>
    </div>

    <!-- Active Filters Summary & Reset -->
    <div class="filter-meta">
      <span class="results-count">
        Showing <strong>{$filteredHackathons.length}</strong> of {$hackathons.length} items
      </span>

      {#if $activeFiltersCount > 0}
        <button class="reset-filters-btn" on:click={resetFilters}>
          <Icon name="rotate-ccw" size={12} />
          <span>Reset ({$activeFiltersCount})</span>
        </button>
      {/if}
    </div>
  </div>
</div>

<style>
  .filter-panel {
    background-color: var(--bg-surface);
    border: 1px solid var(--border-medium);
    border-radius: var(--radius-lg);
    padding: 0.875rem 1rem;
    margin-bottom: 1.25rem;
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  /* Category pills with smooth horizontal scroll */
  .category-scroll-container {
    overflow-x: auto;
    padding-bottom: 0.125rem;
    scrollbar-width: thin;
  }

  .category-scroll-container::-webkit-scrollbar {
    height: 3px;
  }

  .category-scroll-container::-webkit-scrollbar-thumb {
    background: var(--border-medium);
    border-radius: var(--radius-full);
  }

  .category-pills {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    width: max-content;
  }

  .cat-pill {
    padding: 0.35rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 600;
    border-radius: var(--radius-full);
    background-color: var(--bg-surface-hover);
    color: var(--text-secondary);
    border: 1px solid var(--border-subtle);
    white-space: nowrap;
    transition: all var(--transition-fast);
  }

  .cat-pill:hover {
    background-color: var(--bg-surface-active);
    color: var(--text-primary);
  }

  .cat-pill-active {
    background: var(--primary-600);
    color: #ffffff;
    border-color: var(--primary-600);
    box-shadow: 0 1px 4px rgba(37, 99, 235, 0.3);
  }

  .cat-pill-active:hover {
    filter: brightness(1.1);
    color: #ffffff;
  }

  /* Filter Controls Row */
  .filter-controls-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.75rem;
    border-top: 1px solid var(--border-medium);
    padding-top: 0.75rem;
  }

  .filter-group {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.625rem;
  }

  .select-wrapper {
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }

  .filter-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-muted);
    white-space: nowrap;
  }

  .filter-select {
    padding: 0.35rem 0.625rem;
    font-size: 0.75rem;
    border-radius: var(--radius-md);
    background-color: var(--bg-surface-hover);
    border: 1px solid var(--border-medium);
    color: var(--text-primary);
    font-weight: 500;
    width: auto;
  }

  .bookmark-filter-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.35rem 0.6875rem;
    border-radius: var(--radius-md);
    font-size: 0.75rem;
    font-weight: 600;
    border: 1px solid var(--border-medium);
    background-color: var(--bg-surface-hover);
    color: var(--text-secondary);
  }

  .bookmark-filter-btn:hover {
    border-color: var(--accent-amber);
    color: var(--accent-amber);
  }

  .bookmark-filter-btn.active {
    background-color: rgba(245, 158, 11, 0.12);
    border-color: var(--accent-amber);
    color: #f59e0b;
  }

  .filter-meta {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .results-count {
    font-size: 0.75rem;
    color: var(--text-secondary);
  }

  .reset-filters-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.3rem 0.5rem;
    border-radius: var(--radius-sm);
    font-size: 0.6875rem;
    font-weight: 600;
    background-color: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.2);
  }

  .reset-filters-btn:hover {
    background-color: rgba(239, 68, 68, 0.2);
  }

  @media (max-width: 768px) {
    .filter-controls-row {
      flex-direction: column;
      align-items: flex-start;
    }

    .filter-meta {
      width: 100%;
      justify-content: space-between;
    }
  }
</style>
