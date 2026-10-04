<script>
  import { activePage, sidebarOpen, navigateTo } from '../stores/navigation.js';
  import { hackathonStats } from '../stores/hackathons.js';
  import { aiAgent } from '../stores/aiAgent.js';
  import Icon from './Icon.svelte';

  function closeSidebarOnMobile() {
    sidebarOpen.set(false);
  }
</script>

<!-- Mobile backdrop -->
{#if $sidebarOpen}
  <div
    class="sidebar-backdrop"
    on:click={closeSidebarOnMobile}
    on:keydown={(e) => e.key === 'Escape' && closeSidebarOnMobile()}
    role="presentation"
  ></div>
{/if}

<aside class="app-sidebar" class:sidebar-open={$sidebarOpen}>
  <div class="sidebar-inner">
    <!-- Section: Mobile Header inside drawer -->
    <div class="sidebar-header-mobile">
      <div class="brand-mobile">
        <div class="brand-icon-sm">
          <Icon name="trophy" size={16} />
        </div>
        <span class="brand-name">Hackathon Tracker</span>
      </div>
      <button class="btn-ghost-sm" on:click={closeSidebarOnMobile} aria-label="Close sidebar">
        <Icon name="x" size={16} />
      </button>
    </div>

    <!-- AI Agent Radar Widget -->
    <div class="ai-radar-card">
      <button
        type="button"
        class="radar-top"
        on:click={() => navigateTo('ai-agent')}
        title="Open AI Scout Agent Console"
      >
        <div class="radar-avatar" class:is-scanning={$aiAgent.isScanning}>
          <Icon name="bot" size={18} />
        </div>
        <div class="radar-info">
          <div class="radar-title-row">
            <span class="radar-title">AI Scout Spider</span>
<<<<<<< HEAD
            <span class="radar-live-pill">11 WEBSITES</span>
          </div>
          <span class="radar-status">
            {#if $aiAgent.isScanning}
              <span class="pulse-dot scanning"></span> Scraping {$aiAgent.activePlatformName || 'web platforms'}...
            {:else}
              <span class="pulse-dot idle"></span> 11 Platforms Ready
=======
            <span class="radar-live-pill">22 PORTALS</span>
          </div>
          <span class="radar-status">
            {#if $aiAgent.isScanning}
              <span class="pulse-dot scanning"></span> Scraping {$aiAgent.activePlatformName || 'web portals'}...
            {:else}
              <span class="pulse-dot idle"></span> 22 Portals Connected
>>>>>>> 643a550 (supabase integration)
            {/if}
          </span>
        </div>
      </button>

      <div class="radar-action-wrap">
        <button
          type="button"
          class="btn-radar-scan"
          disabled={$aiAgent.isScanning}
          on:click={() => aiAgent.runScan()}
        >
          {#if $aiAgent.isScanning}
            <Icon name="activity" size={13} />
            <span>Crawling Registries...</span>
          {:else}
            <Icon name="sparkles" size={13} />
            <span>Run Discovery Scan</span>
          {/if}
        </button>
      </div>
    </div>

    <!-- Navigation Groups -->
    <nav class="sidebar-nav">
      <!-- Group: Main Directory -->
      <div class="nav-group">
        <span class="group-label">OVERVIEW</span>

        <button
          class="nav-link"
          class:active={$activePage === 'dashboard'}
          on:click={() => navigateTo('dashboard')}
        >
          <div class="nav-icon"><Icon name="trophy" size={17} /></div>
          <span class="nav-text">All Hackathons</span>
          <span class="nav-count">{$hackathonStats.total}</span>
        </button>

        <button
          class="nav-link"
          class:active={$activePage === 'new-discovered'}
          on:click={() => navigateTo('new-discovered')}
        >
          <div class="nav-icon icon-purple"><Icon name="sparkles" size={17} /></div>
          <span class="nav-text">AI Discovered</span>
          {#if $hackathonStats.newlyDiscovered > 0}
            <span class="nav-count count-highlight">{$hackathonStats.newlyDiscovered}</span>
          {/if}
        </button>
      </div>

      <!-- Group: My Registrations -->
      <div class="nav-group">
        <span class="group-label">PARTICIPATION</span>

        <button
          class="nav-link"
          class:active={$activePage === 'registered'}
          on:click={() => navigateTo('registered')}
        >
          <div class="nav-icon icon-green"><Icon name="check-circle" size={17} /></div>
          <span class="nav-text">Registered</span>
          <span class="nav-count">{$hackathonStats.registered}</span>
        </button>

        <button
          class="nav-link"
          class:active={$activePage === 'not-registered'}
          on:click={() => navigateTo('not-registered')}
        >
          <div class="nav-icon icon-amber"><Icon name="clock" size={17} /></div>
          <span class="nav-text">Not Registered Yet</span>
          <span class="nav-count">{$hackathonStats.notRegistered}</span>
        </button>
      </div>

      <!-- Group: Location Explorers -->
      <div class="nav-group">
        <span class="group-label">GLOBAL DIRECTORIES</span>

        <button
          class="nav-link"
          class:active={$activePage === 'hackathons-by-location'}
          on:click={() => navigateTo('hackathons-by-location')}
        >
          <div class="nav-icon icon-blue"><Icon name="map-pin" size={17} /></div>
          <span class="nav-text">Hackathons by City</span>
          <span class="nav-count">{$hackathonStats.hackathonsCount}</span>
        </button>

        <button
          class="nav-link"
          class:active={$activePage === 'tech-events-by-location'}
          on:click={() => navigateTo('tech-events-by-location')}
        >
          <div class="nav-icon icon-rose"><Icon name="compass" size={17} /></div>
          <span class="nav-text">Tech Summits & Events</span>
          <span class="nav-count">{$hackathonStats.techEventsCount}</span>
        </button>
      </div>

      <!-- Group: Automation -->
      <div class="nav-group">
        <span class="group-label">INTELLIGENCE</span>

        <button
          class="nav-link"
          class:active={$activePage === 'ai-agent'}
          on:click={() => navigateTo('ai-agent')}
        >
          <div class="nav-icon icon-purple"><Icon name="bot" size={17} /></div>
          <span class="nav-text">AI Scout Console</span>
          <span class="version-tag">v2.4</span>
        </button>
      </div>
    </nav>
  </div>
</aside>

<style>
  .app-sidebar {
    width: 260px;
    background-color: var(--bg-surface);
    border-right: 1px solid var(--border-medium);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    transition: transform var(--transition-normal);
    z-index: 90;
  }

  .sidebar-inner {
    padding: 1.125rem 0.875rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    position: sticky;
    top: 60px;
    max-height: calc(100vh - 60px);
    overflow-y: auto;
  }

  /* Mobile header inside sidebar */
  .sidebar-header-mobile {
    display: none;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--border-medium);
  }

  .brand-mobile {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 800;
    font-size: 0.9375rem;
  }

  .brand-icon-sm {
    width: 28px;
    height: 28px;
    border-radius: var(--radius-sm);
    background: var(--primary-600);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* AI Radar Widget */
  .ai-radar-card {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(139, 92, 246, 0.08));
    border: 1px solid var(--border-medium);
    border-radius: var(--radius-lg);
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
    transition: all var(--transition-fast);
  }

  :global([data-theme="dark"]) .ai-radar-card {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(139, 92, 246, 0.12));
    border-color: rgba(139, 92, 246, 0.25);
  }

  .radar-top {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    background: none;
    border: none;
    padding: 0;
    text-align: left;
    cursor: pointer;
    width: 100%;
  }

  .radar-avatar {
    width: 34px;
    height: 34px;
    border-radius: var(--radius-md);
    background: linear-gradient(135deg, #7c3aed, #3b82f6);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3);
    flex-shrink: 0;
  }

  .radar-avatar.is-scanning {
    animation: radarSpin 2s infinite linear;
  }

  @keyframes radarSpin {
    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.5); }
    50% { transform: scale(1.06); box-shadow: 0 0 10px 2px rgba(124, 58, 237, 0.7); }
    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.5); }
  }

  .radar-info {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }

  .radar-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .radar-title {
    font-size: 0.8125rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .radar-live-pill {
    font-size: 0.5625rem;
    font-weight: 800;
    color: #10b981;
    background: rgba(16, 185, 129, 0.12);
    padding: 0.1rem 0.35rem;
    border-radius: var(--radius-xs);
    letter-spacing: 0.05em;
  }

  .radar-status {
    font-size: 0.6875rem;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    gap: 0.375rem;
    margin-top: 0.125rem;
  }

  .pulse-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    display: inline-block;
  }

  .pulse-dot.idle {
    background-color: #10b981;
    box-shadow: 0 0 6px #10b981;
  }

  .pulse-dot.scanning {
    background-color: #f59e0b;
    box-shadow: 0 0 6px #f59e0b;
    animation: blink 0.8s infinite;
  }

  @keyframes blink {
    50% { opacity: 0.2; }
  }

  .btn-radar-scan {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    background: var(--bg-surface);
    color: var(--text-primary);
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.4375rem;
    border-radius: var(--radius-md);
    width: 100%;
    border: 1px solid var(--border-medium);
    box-shadow: var(--shadow-sm);
  }

  .btn-radar-scan:hover:not(:disabled) {
    background: var(--primary-600);
    color: #ffffff;
    border-color: var(--primary-600);
  }

  .btn-radar-scan:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  /* Navigation Links */
  .sidebar-nav {
    display: flex;
    flex-direction: column;
    gap: 1.125rem;
  }

  .nav-group {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .group-label {
    font-size: 0.625rem;
    font-weight: 800;
    color: var(--text-muted);
    letter-spacing: 0.08em;
    padding: 0 0.625rem 0.375rem 0.625rem;
  }

  .nav-link {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    padding: 0.5rem 0.625rem;
    border-radius: var(--radius-md);
    color: var(--text-secondary);
    font-weight: 500;
    font-size: 0.8125rem;
    text-align: left;
    transition: all var(--transition-fast);
    width: 100%;
    position: relative;
  }

  .nav-link:hover {
    background-color: var(--bg-surface-hover);
    color: var(--text-primary);
  }

  .nav-link.active {
    background-color: var(--primary-50);
    color: var(--primary-500);
    font-weight: 700;
  }

  :global([data-theme="dark"]) .nav-link.active {
    background-color: rgba(59, 130, 246, 0.14);
    color: #60a5fa;
  }

  .nav-link.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 6px;
    bottom: 6px;
    width: 3px;
    border-radius: var(--radius-full);
    background-color: var(--primary-500);
  }

  .nav-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    color: inherit;
    flex-shrink: 0;
  }

  .icon-purple { color: #a78bfa; }
  .icon-green { color: #34d399; }
  .icon-amber { color: #fbbf24; }
  .icon-blue { color: #38bdf8; }
  .icon-rose { color: #fb7185; }

  .nav-text {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .nav-count {
    font-size: 0.6875rem;
    font-weight: 700;
    padding: 0.1rem 0.4rem;
    border-radius: var(--radius-full);
    background-color: var(--bg-surface-hover);
    color: var(--text-muted);
    font-family: var(--font-mono);
  }

  .nav-link.active .nav-count {
    background-color: var(--primary-100);
    color: var(--primary-500);
  }

  .count-highlight {
    background-color: rgba(16, 185, 129, 0.15);
    color: #10b981;
  }

  .version-tag {
    font-size: 0.625rem;
    font-weight: 700;
    padding: 0.1rem 0.35rem;
    border-radius: var(--radius-xs);
    background: rgba(139, 92, 246, 0.15);
    color: #a78bfa;
    font-family: var(--font-mono);
  }

  /* Drawer for tablets & mobile */
  @media (max-width: 900px) {
    .app-sidebar {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      width: 260px;
      z-index: 1100;
      transform: translateX(-100%);
      box-shadow: var(--shadow-xl);
    }

    .app-sidebar.sidebar-open {
      transform: translateX(0);
    }

    .sidebar-inner {
      top: 0;
      max-height: 100vh;
    }

    .sidebar-header-mobile {
      display: flex;
    }

    .sidebar-backdrop {
      position: fixed;
      inset: 0;
      background-color: rgba(4, 7, 13, 0.7);
      backdrop-filter: blur(4px);
      z-index: 1050;
    }
  }
</style>
