<script>
  import { createEventDispatcher } from 'svelte';
  import { hackathons } from '../stores/hackathons.js';
  import { POPULAR_LOCATIONS } from '../data/aiDiscoverySources.js';
  import HackathonCard from './HackathonCard.svelte';
  import EmptyState from './EmptyState.svelte';
  import Icon from './Icon.svelte';

  export let modeType = 'hackathons'; // 'hackathons' or 'tech-events'

  const dispatch = createEventDispatcher();

  let activeLocation = 'All Locations';
  let searchQuery = '';

  $: isHackathonMode = modeType === 'hackathons';
  $: title = isHackathonMode ? 'Hackathons by City & Region' : 'Global Tech Summits & Events';
  $: subtitle = isHackathonMode
    ? 'Discover in-person, online, and hybrid competitive hackathons worldwide.'
    : 'Explore developer summits, tech conferences, workshops, and meetups around the globe.';

  // Filter items by type and location
  $: filteredItems = $hackathons.filter((item) => {
    // Check type
    if (isHackathonMode && item.type === 'tech-event') return false;
    if (!isHackathonMode && item.type !== 'tech-event') return false;

    // Check location
    if (activeLocation !== 'All Locations') {
      const target = activeLocation.toLowerCase().split(',')[0].trim();
      const itemLoc = (item.location || '').toLowerCase();
      const itemCity = (item.city || '').toLowerCase();
      const itemCountry = (item.country || '').toLowerCase();

      if (target.includes('online')) {
        if (item.mode !== 'Online' && !itemLoc.includes('online')) return false;
      } else {
        if (!itemLoc.includes(target) && !itemCity.includes(target) && !itemCountry.includes(target)) {
          return false;
        }
      }
    }

    // Check text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const match =
        (item.title || '').toLowerCase().includes(q) ||
        (item.organizer || '').toLowerCase().includes(q) ||
        (item.location || '').toLowerCase().includes(q) ||
        (item.category || '').toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  // Calculate counts per location
  $: locationCounts = POPULAR_LOCATIONS.reduce((acc, loc) => {
    if (loc === 'All Locations') {
      acc[loc] = $hackathons.filter(i => isHackathonMode ? i.type !== 'tech-event' : i.type === 'tech-event').length;
    } else {
      const target = loc.toLowerCase().split(',')[0].trim();
      acc[loc] = $hackathons.filter(i => {
        const typeMatch = isHackathonMode ? i.type !== 'tech-event' : i.type === 'tech-event';
        if (!typeMatch) return false;
        const itemLoc = (i.location || '').toLowerCase();
        const itemCity = (i.city || '').toLowerCase();
        if (target.includes('online')) {
          return i.mode === 'Online' || itemLoc.includes('online');
        }
        return itemLoc.includes(target) || itemCity.includes(target);
      }).length;
    }
    return acc;
  }, {});
</script>

<div class="location-explorer">
  <!-- Top Banner -->
  <div class="explorer-banner">
    <div class="banner-badge">
      <Icon name={isHackathonMode ? 'map-pin' : 'compass'} size={13} />
      <span>{isHackathonMode ? 'GLOBAL HACKATHON DIRECTORY' : 'GLOBAL TECH RADAR'}</span>
    </div>
    <h2 class="explorer-title">{title}</h2>
    <p class="explorer-subtitle">{subtitle}</p>

    <!-- Search in Location -->
    <div class="location-search-wrap">
      <div class="search-box">
        <Icon name="search" size={15} />
        <input
          type="text"
          placeholder="Filter within this location directory..."
          bind:value={searchQuery}
        />
        {#if searchQuery}
          <button class="clear-btn" on:click={() => searchQuery = ''}>
            <Icon name="x" size={13} />
          </button>
        {/if}
      </div>
    </div>
  </div>

  <!-- Location Tabs & Cards -->
  <div class="locations-scroll-wrap">
    <div class="location-pills">
      {#each POPULAR_LOCATIONS as loc}
        <button
          class="location-pill"
          class:active={activeLocation === loc}
          on:click={() => activeLocation = loc}
        >
          <Icon name={loc.includes('Online') ? 'globe' : 'map-pin'} size={13} />
          <span>{loc}</span>
          <span class="loc-count">{locationCounts[loc] || 0}</span>
        </button>
      {/each}
    </div>
  </div>

  <!-- Result Summary -->
  <div class="results-header">
    <span class="results-text">
      Showing <strong>{filteredItems.length}</strong> {isHackathonMode ? 'hackathons' : 'tech events'} in <strong>{activeLocation}</strong>
    </span>
  </div>

  <!-- Items Grid -->
  {#if filteredItems.length > 0}
    <div class="items-grid">
      {#each filteredItems as item (item.id)}
        <HackathonCard
          hackathon={item}
          on:viewDetails={(e) => dispatch('viewDetails', e.detail)}
          on:edit={(e) => dispatch('edit', e.detail)}
          on:delete={(e) => dispatch('delete', e.detail)}
        />
      {/each}
    </div>
  {:else}
    <EmptyState
      isSearchActive={true}
      on:openAddModal={() => dispatch('openAddModal')}
      on:resetSampleData={() => hackathons.resetToSampleData()}
    />
  {/if}
</div>

<style>
  .location-explorer {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    animation: fadeIn 0.25s ease-out;
  }

  .explorer-banner {
    background-color: var(--bg-surface);
    border: 1px solid var(--border-medium);
    border-radius: var(--radius-xl);
    padding: 1.5rem 1.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    position: relative;
    overflow: hidden;
  }

  .explorer-banner::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.6), transparent);
  }

  .banner-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.6875rem;
    font-weight: 800;
    color: var(--primary-500);
    letter-spacing: 0.05em;
  }

  .explorer-title {
    font-size: 1.35rem;
    font-weight: 800;
    color: var(--text-primary);
    line-height: 1.25;
  }

  .explorer-subtitle {
    font-size: 0.8125rem;
    color: var(--text-secondary);
    max-width: 650px;
  }

  .location-search-wrap {
    margin-top: 0.375rem;
    max-width: 440px;
  }

  .search-box {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: var(--bg-surface-hover);
    border: 1px solid var(--border-medium);
    border-radius: var(--radius-md);
    padding: 0.4375rem 0.75rem;
    color: var(--text-secondary);
  }

  :global([data-theme="dark"]) .search-box {
    background: #090d16;
  }

  .search-box input {
    border: none;
    background: transparent;
    padding: 0;
    font-size: 0.8125rem;
    box-shadow: none !important;
  }

  .clear-btn {
    color: var(--text-muted);
  }

  /* Location Scroll Pills */
  .locations-scroll-wrap {
    overflow-x: auto;
    padding-bottom: 0.125rem;
    scrollbar-width: thin;
  }

  .location-pills {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: max-content;
  }

  .location-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.4375rem;
    padding: 0.4375rem 0.875rem;
    border-radius: var(--radius-full);
    background-color: var(--bg-surface);
    color: var(--text-secondary);
    border: 1px solid var(--border-medium);
    font-size: 0.75rem;
    font-weight: 600;
    white-space: nowrap;
    transition: all var(--transition-fast);
  }

  .location-pill:hover {
    background-color: var(--bg-surface-hover);
    color: var(--text-primary);
  }

  .location-pill.active {
    background: var(--primary-600);
    color: #ffffff;
    border-color: var(--primary-600);
    box-shadow: 0 1px 6px rgba(37, 99, 235, 0.3);
  }

  .loc-count {
    font-size: 0.6875rem;
    padding: 0.1rem 0.35rem;
    border-radius: var(--radius-full);
    background: rgba(0, 0, 0, 0.08);
    color: inherit;
    font-family: var(--font-mono);
  }

  .location-pill.active .loc-count {
    background: rgba(255, 255, 255, 0.25);
    color: #ffffff;
  }

  .results-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.8125rem;
    color: var(--text-secondary);
  }

  .items-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.25rem;
  }

  @media (max-width: 1080px) {
    .items-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 680px) {
    .items-grid {
      grid-template-columns: 1fr;
    }
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
