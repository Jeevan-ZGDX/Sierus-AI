<script>
  import { hackathonStats, selectedStatus, onlyBookmarked, selectedCategory, selectedMode } from '../stores/hackathons.js';
  import Icon from './Icon.svelte';

  function filterByBookmarked() {
    onlyBookmarked.update(val => !val);
  }

  function filterByStatus(status) {
    selectedStatus.set(status);
  }

  function showAll() {
    selectedStatus.set('All');
    selectedCategory.set('All');
    selectedMode.set('All');
    onlyBookmarked.set(false);
  }
</script>

<div class="stats-grid">
  <!-- Total Card -->
  <button class="stat-card stat-card-total" on:click={showAll} title="View all hackathons">
    <div class="stat-header">
      <span class="stat-label">TOTAL TRACKED</span>
      <div class="stat-icon icon-total">
        <Icon name="trophy" size={16} />
      </div>
    </div>
    <div class="stat-body">
      <span class="stat-value">{$hackathonStats.total}</span>
      <span class="stat-sub">All active opportunities</span>
    </div>
  </button>

  <!-- Upcoming Card -->
  <div class="stat-card stat-card-upcoming">
    <div class="stat-header">
      <span class="stat-label">OPEN DEADLINES</span>
      <div class="stat-icon icon-upcoming">
        <Icon name="clock" size={16} />
      </div>
    </div>
    <div class="stat-body">
      <span class="stat-value text-emerald">{$hackathonStats.upcoming}</span>
      <span class="stat-sub">Ready for registration</span>
    </div>
  </div>

  <!-- Bookmarked Card -->
  <button
    class="stat-card stat-card-bookmarked"
    class:active-card={$onlyBookmarked}
    on:click={filterByBookmarked}
    title="Toggle bookmarked filter"
  >
    <div class="stat-header">
      <span class="stat-label">BOOKMARKED</span>
      <div class="stat-icon icon-bookmarked">
        <Icon name="star" size={16} filled={true} />
      </div>
    </div>
    <div class="stat-body">
      <span class="stat-value text-amber">{$hackathonStats.bookmarked}</span>
      <span class="stat-sub">Favorite shortlisted</span>
    </div>
  </button>

  <!-- Registered / Participating Card -->
  <button
    class="stat-card stat-card-registered"
    class:active-card={$selectedStatus === 'Registered' || $selectedStatus === 'Participating'}
    on:click={() => filterByStatus('Registered')}
    title="Filter registered hackathons"
  >
    <div class="stat-header">
      <span class="stat-label">MY REGISTRATIONS</span>
      <div class="stat-icon icon-registered">
        <Icon name="sparkles" size={16} />
      </div>
    </div>
    <div class="stat-body">
      <span class="stat-value text-purple">{$hackathonStats.activeOpportunities}</span>
      <span class="stat-sub">Registered / Active</span>
    </div>
  </button>
</div>

<style>
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.875rem;
    margin-bottom: 1.25rem;
  }

  .stat-card {
    background-color: var(--bg-surface);
    border: 1px solid var(--border-medium);
    border-radius: var(--radius-lg);
    padding: 1rem 1.125rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 0.75rem;
    box-shadow: var(--shadow-sm);
    text-align: left;
    transition: all var(--transition-fast);
    position: relative;
    overflow: hidden;
  }

  .stat-card::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    opacity: 0;
    transition: opacity var(--transition-fast);
  }

  .stat-card-total::after { background: var(--primary-500); }
  .stat-card-upcoming::after { background: var(--accent-emerald); }
  .stat-card-bookmarked::after { background: var(--accent-amber); }
  .stat-card-registered::after { background: var(--accent-purple); }

  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    border-color: var(--border-medium);
  }

  .stat-card:hover::after,
  .active-card::after {
    opacity: 1;
  }

  .active-card {
    border-color: var(--primary-500);
    background-color: var(--primary-50);
  }

  .stat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .stat-label {
    font-size: 0.6875rem;
    font-weight: 800;
    color: var(--text-muted);
    letter-spacing: 0.05em;
  }

  .stat-icon {
    width: 28px;
    height: 28px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .icon-total {
    background-color: rgba(59, 130, 246, 0.12);
    color: #3b82f6;
  }

  .icon-upcoming {
    background-color: rgba(16, 185, 129, 0.12);
    color: #10b981;
  }

  .icon-bookmarked {
    background-color: rgba(245, 158, 11, 0.12);
    color: #f59e0b;
  }

  .icon-registered {
    background-color: rgba(139, 92, 246, 0.12);
    color: #8b5cf6;
  }

  .stat-body {
    display: flex;
    flex-direction: column;
  }

  .stat-value {
    font-size: 1.65rem;
    font-weight: 800;
    color: var(--text-primary);
    line-height: 1.1;
    font-feature-settings: "tnum";
  }

  .text-emerald { color: #10b981; }
  .text-amber { color: #f59e0b; }
  .text-purple { color: #8b5cf6; }

  :global([data-theme="dark"]) .text-emerald { color: #34d399; }
  :global([data-theme="dark"]) .text-amber { color: #fbbf24; }
  :global([data-theme="dark"]) .text-purple { color: #a78bfa; }

  .stat-sub {
    font-size: 0.6875rem;
    color: var(--text-muted);
    font-weight: 500;
    margin-top: 0.2rem;
  }

  @media (max-width: 900px) {
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 480px) {
    .stats-grid {
      grid-template-columns: 1fr;
      gap: 0.625rem;
    }
  }
</style>
