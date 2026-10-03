<script>
  import { searchQuery } from '../stores/hackathons.js';
  import Icon from './Icon.svelte';

  let inputRef;

  function clearSearch() {
    searchQuery.set('');
    if (inputRef) inputRef.focus();
  }

  function handleKeydown(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if (inputRef) inputRef.focus();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="search-wrapper">
  <div class="search-icon">
    <Icon name="search" size={16} />
  </div>
  <input
    type="text"
    placeholder="Filter by keyword, organizer, category, location (Press ⌘K)..."
    bind:value={$searchQuery}
    bind:this={inputRef}
    class="search-input"
    aria-label="Search hackathons"
  />
  <div class="search-trailing">
    {#if $searchQuery}
      <button
        class="clear-btn"
        on:click={clearSearch}
        aria-label="Clear search"
        title="Clear search"
      >
        <Icon name="x" size={14} />
      </button>
    {:else}
      <kbd class="shortcut-badge">⌘K</kbd>
    {/if}
  </div>
</div>

<style>
  .search-wrapper {
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
  }

  .search-icon {
    position: absolute;
    left: 0.875rem;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    padding: 0.6875rem 4.5rem 0.6875rem 2.5rem;
    font-size: 0.875rem;
    background-color: var(--bg-surface);
    border: 1px solid var(--border-medium);
    border-radius: var(--radius-lg);
    color: var(--text-primary);
    box-shadow: var(--shadow-sm);
    transition: all var(--transition-fast);
  }

  :global([data-theme="dark"]) .search-input {
    background-color: #090d16;
  }

  .search-input:focus {
    border-color: var(--border-focus);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }

  .search-trailing {
    position: absolute;
    right: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }

  .shortcut-badge {
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    font-weight: 600;
    color: var(--text-muted);
    background-color: var(--bg-surface-hover);
    padding: 0.15rem 0.4rem;
    border-radius: var(--radius-xs);
    border: 1px solid var(--border-medium);
    pointer-events: none;
  }

  .clear-btn {
    color: var(--text-muted);
    background: transparent;
    padding: 0.25rem;
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .clear-btn:hover {
    color: var(--text-primary);
    background-color: var(--bg-surface-hover);
  }
</style>
