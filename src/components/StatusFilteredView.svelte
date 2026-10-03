<script>
  import { createEventDispatcher } from 'svelte';
  import { hackathons } from '../stores/hackathons.js';
  import { aiAgent } from '../stores/aiAgent.js';
  import HackathonCard from './HackathonCard.svelte';
  import EmptyState from './EmptyState.svelte';
  import Icon from './Icon.svelte';

  export let pageType = 'registered'; // 'registered', 'not-registered', 'new-discovered'

  const dispatch = createEventDispatcher();

  let searchQuery = '';

  $: title =
    pageType === 'registered'
      ? 'Registered & Participating Hackathons'
      : pageType === 'not-registered'
      ? 'Not Registered Yet (Open Opportunities)'
      : 'AI Scout Discovered Opportunities';

  $: subtitle =
    pageType === 'registered'
      ? 'Keep track of all hackathons and tech events you are actively registered or participating in.'
      : pageType === 'not-registered'
      ? 'Discover competitions with open registration deadlines that you haven\'t signed up for yet.'
      : 'Events autonomously scraped across Devpost, Devfolio, HackerEarth, Unstop, Reskill, Hack2Skill, MLH, HeroX, Brightidea, BeMyApp, and StackUp.';

  $: filteredList = $hackathons.filter((item) => {
    if (pageType === 'registered') {
      if (item.status === 'Not Registered') return false;
    } else if (pageType === 'not-registered') {
      if (item.status !== 'Not Registered') return false;
    } else if (pageType === 'new-discovered') {
      if (!item.isNew && !(item.source && item.source.includes('AI'))) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const match =
        (item.title || '').toLowerCase().includes(q) ||
        (item.organizer || '').toLowerCase().includes(q) ||
        (item.category || '').toLowerCase().includes(q) ||
        (item.location || '').toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  function handleMarkAllSeen() {
    hackathons.markAllAsSeen();
  }
</script>

<div class="status-view">
  <!-- Top Banner -->
  <div class="view-banner banner-{pageType}">
    <div class="banner-top-row">
      <div class="badge-tag">
        {#if pageType === 'registered'}
          <Icon name="check-circle" size={14} />
          <span>CONFIRMED REGISTRATIONS</span>
        {:else if pageType === 'not-registered'}
          <Icon name="clock" size={14} />
          <span>OPEN APPLICATION OPPORTUNITIES</span>
        {:else}
          <Icon name="sparkles" size={14} />
          <span>AI AGENT LIVE FEED</span>
        {/if}
      </div>

      {#if pageType === 'new-discovered'}
        <div class="banner-actions">
          <button class="btn-sm-ghost" on:click={handleMarkAllSeen}>
            <Icon name="check" size={14} />
            <span>Mark All Reviewed</span>
          </button>
          <button class="btn-primary btn-sm" on:click={() => aiAgent.runScan()}>
            <Icon name="bot" size={14} />
            <span>Run New Scan</span>
          </button>
        </div>
      {/if}
    </div>

    <h2 class="view-title">{title}</h2>
    <p class="view-subtitle">{subtitle}</p>

    <!-- Search in View -->
    <div class="search-input-wrap">
      <div class="search-box">
        <Icon name="search" size={16} />
        <input
          type="text"
          placeholder="Filter {title.toLowerCase()}..."
          bind:value={searchQuery}
        />
        {#if searchQuery}
          <button class="clear-btn" on:click={() => searchQuery = ''}>
            <Icon name="x" size={14} />
          </button>
        {/if}
      </div>
    </div>
  </div>

  <!-- Summary -->
  <div class="results-meta">
    <span class="results-count">
      Showing <strong>{filteredList.length}</strong> events
    </span>
  </div>

  <!-- Cards Grid -->
  {#if filteredList.length > 0}
    <div class="cards-grid">
      {#each filteredList as item (item.id)}
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
      isSearchActive={searchQuery.trim().length > 0}
      on:openAddModal={() => dispatch('openAddModal')}
      on:resetSampleData={() => hackathons.resetToSampleData()}
    />
  {/if}
</div>

<style>
  .status-view {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    animation: fadeIn 0.25s ease-out;
  }

  .view-banner {
    border-radius: var(--radius-xl);
    padding: 1.75rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
    border: 1px solid var(--border-medium);
  }

  .banner-registered {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(6, 182, 212, 0.08));
  }

  .banner-not-registered {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(239, 68, 68, 0.08));
  }

  .banner-new-discovered {
    background: linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(37, 99, 235, 0.1));
    border-color: rgba(139, 92, 246, 0.3);
  }

  .banner-top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .badge-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.05em;
    color: var(--primary-600);
  }

  .banner-registered .badge-tag { color: #059669; }
  .banner-not-registered .badge-tag { color: #d97706; }
  .banner-new-discovered .badge-tag { color: #7c3aed; }

  .banner-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .btn-sm-ghost {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.4375rem 0.75rem;
    border-radius: var(--radius-md);
    background-color: var(--bg-surface);
    color: var(--text-secondary);
    border: 1px solid var(--border-medium);
    font-size: 0.8125rem;
    font-weight: 600;
  }

  .btn-sm-ghost:hover {
    background-color: var(--bg-surface-hover);
    color: var(--text-primary);
  }

  .btn-sm {
    padding: 0.4375rem 0.875rem;
    font-size: 0.8125rem;
  }

  .view-title {
    font-size: 1.6rem;
    font-weight: 800;
    color: var(--text-primary);
    line-height: 1.25;
  }

  .view-subtitle {
    font-size: 0.9375rem;
    color: var(--text-secondary);
    max-width: 650px;
  }

  .search-input-wrap {
    margin-top: 0.5rem;
    max-width: 480px;
  }

  .search-box {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: var(--bg-surface);
    border: 1px solid var(--border-medium);
    border-radius: var(--radius-md);
    padding: 0.5rem 0.875rem;
    color: var(--text-secondary);
  }

  .search-box input {
    border: none;
    background: transparent;
    padding: 0;
    font-size: 0.875rem;
    box-shadow: none !important;
  }

  .clear-btn {
    color: var(--text-muted);
  }

  .results-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .cards-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
  }

  @media (max-width: 1080px) {
    .cards-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 680px) {
    .cards-grid {
      grid-template-columns: 1fr;
    }
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
