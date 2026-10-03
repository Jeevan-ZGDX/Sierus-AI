<script>
  import { aiAgent } from '../stores/aiAgent.js';
  import { hackathons, hackathonStats } from '../stores/hackathons.js';
  import { navigateTo } from '../stores/navigation.js';
  import Icon from './Icon.svelte';

  let customPromptInput = $aiAgent.searchPrompt;
  let selectedPlatformFilter = 'all';

  function handleStartScan() {
    aiAgent.runScan(customPromptInput);
  }

  function handleMarkSeen() {
    hackathons.markAllAsSeen();
  }

  function handleScrapeSingle(platformId) {
    aiAgent.scrapeSinglePlatform(platformId);
  }

  $: enabledCount = $aiAgent.platforms.filter(p => p.enabled).length;

  $: filteredLogs = $aiAgent.logs.filter(log => {
    if (selectedPlatformFilter === 'all') return true;
    return log.platformId === selectedPlatformFilter;
  });
</script>

<div class="ai-console-wrapper">
  <!-- Top Banner -->
  <div class="ai-banner">
    <div class="banner-left">
      <div class="agent-avatar-lg" class:scanning={$aiAgent.isScanning}>
        <Icon name="bot" size={32} />
      </div>
      <div class="banner-text">
        <div class="badge-row">
          <span class="badge-ai">AUTONOMOUS SCOUT ENGINE</span>
          <span class="badge-version">v2.4 Multi-Source Spider</span>
        </div>
        <h2 class="banner-title">Autonomous Web Scraper Matrix (11 Platforms)</h2>
        <p class="banner-desc">
          Continuously scrapes hackathons, developer bounties, student hackathons, and corporate open innovation challenges from <strong>Devpost, Devfolio, HackerEarth, Unstop, Reskill, Hack2Skill, MLH, HeroX, Brightidea, BeMyApp, and StackUp</strong>.
        </p>
      </div>
    </div>

    <div class="banner-actions">
      <button
        class="btn-primary btn-scan-large"
        disabled={$aiAgent.isScanning}
        on:click={handleStartScan}
      >
        <Icon name={$aiAgent.isScanning ? 'activity' : 'sparkles'} size={16} />
        <span>{$aiAgent.isScanning ? 'Scraping Web Feeds...' : `Scrape All ${enabledCount} Platforms`}</span>
      </button>
    </div>
  </div>

  <!-- Progress Bar (if active) -->
  {#if $aiAgent.isScanning}
    <div class="scan-progress-box">
      <div class="progress-info">
        <span class="status-msg">
          <span class="pulse-indicator"></span>
          {$aiAgent.agentStatus}
        </span>
        <span class="percent-text">{$aiAgent.progressPercent}%</span>
      </div>
      <div class="progress-bar-track">
        <div class="progress-bar-fill" style="width: {$aiAgent.progressPercent}%"></div>
      </div>
    </div>
  {/if}

  <!-- Stats & Metrics Grid -->
  <div class="metrics-grid">
    <div class="metric-card">
      <span class="metric-num">{$hackathonStats.newlyDiscovered}</span>
      <span class="metric-lbl">DISCOVERED EVENTS</span>
    </div>
    <div class="metric-card">
      <span class="metric-num text-cyan">11</span>
      <span class="metric-lbl">SUPPORTED WEBSITES</span>
    </div>
    <div class="metric-card">
      <span class="metric-num">{enabledCount} / 11</span>
      <span class="metric-lbl">ACTIVE SCRAPERS</span>
    </div>
    <div class="metric-card">
      <span class="metric-num status-online">Operational</span>
      <span class="metric-lbl">SCRAPER STATUS</span>
    </div>
  </div>

  <!-- Target Platforms Scraper Matrix -->
  <div class="platforms-panel">
    <div class="panel-top-row">
      <div class="panel-header">
        <Icon name="layers" size={18} />
        <h3 class="panel-heading">Target Websites & Live Scraper Matrix</h3>
        <span class="platform-count-tag">{enabledCount} Active</span>
      </div>

      <div class="platform-bulk-actions">
        <button
          type="button"
          class="bulk-btn"
          disabled={$aiAgent.isScanning}
          on:click={() => aiAgent.setAllPlatforms(true)}
        >
          Select All
        </button>
        <button
          type="button"
          class="bulk-btn"
          disabled={$aiAgent.isScanning}
          on:click={() => aiAgent.setAllPlatforms(false)}
        >
          Deselect All
        </button>
      </div>
    </div>

    <p class="panel-sub">
      Toggle individual websites to include/exclude from the crawler cycle or click <strong>Scrape</strong> on any platform to fetch immediately.
    </p>

    <!-- 11 Scraper Cards Grid -->
    <div class="platforms-grid">
      {#each $aiAgent.platforms as platform (platform.id)}
        <div
          class="platform-card"
          class:is-active={$aiAgent.activePlatformId === platform.id}
          class:is-disabled={!platform.enabled}
        >
          <!-- Platform Header -->
          <div class="platform-card-header">
            <label class="platform-toggle-wrap" title="Enable or disable scraper for {platform.name}">
              <input
                type="checkbox"
                checked={platform.enabled}
                disabled={$aiAgent.isScanning}
                on:change={() => aiAgent.togglePlatform(platform.id)}
              />
              <span class="platform-name-wrap">
                <span class="platform-icon" style="color: {platform.color}">
                  <Icon name={platform.icon || 'globe'} size={15} />
                </span>
                <strong class="platform-title">{platform.name}</strong>
              </span>
            </label>

            <!-- Status Badge -->
            {#if $aiAgent.activePlatformId === platform.id}
              <span class="status-chip scraping">
                <span class="pulse-dot"></span>
                Scraping...
              </span>
            {:else if platform.status === 'synced'}
              <span class="status-chip synced">
                <Icon name="check" size={10} />
                Synced
              </span>
            {:else}
              <span class="status-chip idle">Idle</span>
            {/if}
          </div>

          <!-- Platform Domain & Tagline -->
          <div class="platform-domain-row">
            <span class="platform-domain">{platform.domain}</span>
            <span class="platform-protocol">{platform.protocol}</span>
          </div>
          <p class="platform-desc">{platform.tagline}</p>

          <!-- Platform Footer -->
          <div class="platform-card-footer">
            <span class="platform-rate">{platform.rateLimit}</span>
            <button
              class="btn-platform-scrape"
              disabled={$aiAgent.isScanning || !platform.enabled}
              on:click={() => handleScrapeSingle(platform.id)}
              title="Scrape {platform.name} now"
            >
              <Icon name="refresh-cw" size={12} />
              <span>Scrape</span>
            </button>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Agent Custom Search / Targeting Form -->
  <div class="query-panel">
    <div class="panel-header">
      <Icon name="search" size={16} />
      <h3 class="panel-heading">Targeted Prompt & Crawler Keywords</h3>
    </div>
    <p class="panel-sub">
      Instruct the AI Scout which specific domains, programming languages, tracks, or geographic regions to prioritize.
    </p>

    <div class="query-input-wrap">
      <input
        type="text"
        placeholder="e.g. Scrape AI, Web3, and Cloud hackathons from Devpost, Devfolio, HackerEarth and Unstop..."
        bind:value={customPromptInput}
        class="query-input"
        disabled={$aiAgent.isScanning}
      />
      <button
        class="btn-primary"
        disabled={$aiAgent.isScanning}
        on:click={handleStartScan}
      >
        <Icon name="sparkles" size={15} />
        <span>Scrape Feeds</span>
      </button>
    </div>

    <!-- Quick Target Badges -->
    <div class="quick-prompts">
      <span class="quick-label">Platform Presets:</span>
      <button
        class="quick-pill"
        on:click={() => {
          customPromptInput = 'Scrape AI/ML & Agent hackathons from Devpost, HackerEarth & Reskill';
          aiAgent.runScan(customPromptInput);
        }}
      >
        🤖 Devpost + HackerEarth + Reskill (AI)
      </button>
      <button
        class="quick-pill"
        on:click={() => {
          customPromptInput = 'Scrape Web3 & Blockchain bounties from Devfolio & StackUp';
          aiAgent.runScan(customPromptInput);
        }}
      >
        ⛓️ Devfolio + StackUp (Web3)
      </button>
      <button
        class="quick-pill"
        on:click={() => {
          customPromptInput = 'Scrape student & collegiate hackathons from MLH, Unstop & Hack2Skill';
          aiAgent.runScan(customPromptInput);
        }}
      >
        🎓 MLH + Unstop + Hack2Skill (Collegiate)
      </button>
      <button
        class="quick-pill"
        on:click={() => {
          customPromptInput = 'Scrape enterprise challenges from HeroX, Brightidea & BeMyApp';
          aiAgent.runScan(customPromptInput);
        }}
      >
        🚀 HeroX + Brightidea + BeMyApp (Moonshots)
      </button>
    </div>
  </div>

  <!-- Real-time Agent Activity Terminal Logs -->
  <div class="terminal-panel">
    <div class="terminal-header">
      <div class="terminal-title">
        <div class="terminal-dots">
          <span class="dot red"></span>
          <span class="dot yellow"></span>
          <span class="dot green"></span>
        </div>
        <span class="term-name">AI_SCRAPER_STREAM_LOGS.log</span>
      </div>

      <!-- Platform Log Filter -->
      <div class="terminal-filter-wrap">
        <label for="platform-log-select" class="filter-lbl">Source:</label>
        <select id="platform-log-select" bind:value={selectedPlatformFilter} class="term-select">
          <option value="all">All 11 Platforms ({$aiAgent.logs.length})</option>
          {#each $aiAgent.platforms as p}
            <option value={p.id}>{p.name}</option>
          {/each}
        </select>
      </div>

      <div class="terminal-controls">
        <button class="term-btn" on:click={handleMarkSeen} title="Clear new indicators">
          Mark Reviewed
        </button>
        <button class="term-btn" on:click={aiAgent.clearLogs}>
          Clear
        </button>
        <button class="term-btn primary" on:click={() => navigateTo('new-discovered')}>
          View Scraped Feed ({$hackathonStats.newlyDiscovered})
        </button>
      </div>
    </div>

    <div class="terminal-body">
      {#if filteredLogs.length > 0}
        {#each filteredLogs as log (log.id)}
          <div class="log-line log-{log.type}">
            <span class="log-time">[{log.timestamp}]</span>
            <span class="log-text">{log.text}</span>
          </div>
        {/each}
      {:else}
        <div class="empty-logs">
          <span>No log lines for the selected source yet. Run a scrape to view output.</span>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .ai-console-wrapper {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    animation: fadeIn 0.25s ease-out;
  }

  /* Banner */
  .ai-banner {
    background: linear-gradient(135deg, rgba(14, 19, 31, 0.95), rgba(9, 13, 22, 0.95));
    border: 1px solid var(--border-medium);
    border-radius: var(--radius-xl);
    padding: 1.75rem 2rem;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
    flex-wrap: wrap;
    box-shadow: var(--shadow-md);
    position: relative;
    overflow: hidden;
  }

  .ai-banner::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.6), transparent);
  }

  .banner-left {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    max-width: 780px;
  }

  .agent-avatar-lg {
    width: 60px;
    height: 60px;
    border-radius: var(--radius-lg);
    background: linear-gradient(135deg, #7c3aed, #3b82f6);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 0 20px rgba(124, 58, 237, 0.35);
  }

  .agent-avatar-lg.scanning {
    animation: agentPulse 1.2s infinite alternate;
  }

  @keyframes agentPulse {
    from { transform: scale(1); box-shadow: 0 0 12px rgba(124, 58, 237, 0.4); }
    to { transform: scale(1.06); box-shadow: 0 0 28px rgba(124, 58, 237, 0.8); }
  }

  .badge-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
  }

  .badge-ai {
    font-size: 0.625rem;
    font-weight: 800;
    background: rgba(139, 92, 246, 0.2);
    color: #c4b5fd;
    padding: 0.15rem 0.45rem;
    border-radius: var(--radius-full);
    letter-spacing: 0.05em;
    border: 1px solid rgba(139, 92, 246, 0.3);
  }

  .badge-version {
    font-size: 0.625rem;
    font-weight: 600;
    color: var(--text-muted);
    font-family: var(--font-mono);
  }

  .banner-title {
    font-size: 1.35rem;
    font-weight: 800;
    line-height: 1.25;
    margin-bottom: 0.35rem;
    color: var(--text-primary);
  }

  .banner-desc {
    font-size: 0.8125rem;
    color: var(--text-secondary);
    line-height: 1.5;
  }

  .btn-scan-large {
    padding: 0.6875rem 1.375rem;
    font-size: 0.875rem;
  }

  /* Scan Progress Box */
  .scan-progress-box {
    background-color: var(--bg-surface);
    border: 1px solid var(--primary-500);
    border-radius: var(--radius-lg);
    padding: 0.875rem 1.125rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .progress-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.8125rem;
    font-weight: 600;
  }

  .status-msg {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--primary-500);
  }

  .pulse-indicator {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--primary-500);
    animation: blink 0.8s infinite;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.2; }
  }

  .percent-text {
    font-family: var(--font-mono);
    color: var(--text-primary);
  }

  .progress-bar-track {
    height: 6px;
    background: var(--bg-surface-hover);
    border-radius: var(--radius-full);
    overflow: hidden;
  }

  .progress-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
    transition: width 0.3s ease;
  }

  /* Metrics Grid */
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.875rem;
  }

  .metric-card {
    background-color: var(--bg-surface);
    border: 1px solid var(--border-medium);
    border-radius: var(--radius-lg);
    padding: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    box-shadow: var(--shadow-sm);
  }

  .metric-num {
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--text-primary);
    font-feature-settings: "tnum";
  }

  .text-cyan { color: #06b6d4; }

  .metric-lbl {
    font-size: 0.625rem;
    font-weight: 800;
    color: var(--text-muted);
    margin-top: 0.25rem;
    letter-spacing: 0.05em;
  }

  .status-online {
    color: #10b981;
  }

  :global([data-theme="dark"]) .status-online {
    color: #34d399;
  }

  /* Platforms Panel */
  .platforms-panel {
    background-color: var(--bg-surface);
    border: 1px solid var(--border-medium);
    border-radius: var(--radius-lg);
    padding: 1.25rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    box-shadow: var(--shadow-sm);
  }

  .panel-top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .panel-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-primary);
  }

  .panel-heading {
    font-size: 0.9375rem;
    font-weight: 700;
  }

  .platform-count-tag {
    font-size: 0.6875rem;
    font-weight: 700;
    background-color: var(--primary-50);
    color: var(--primary-500);
    padding: 0.15rem 0.5rem;
    border-radius: var(--radius-full);
  }

  .platform-bulk-actions {
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }

  .bulk-btn {
    font-size: 0.6875rem;
    font-weight: 600;
    padding: 0.25rem 0.5rem;
    border-radius: var(--radius-sm);
    background-color: var(--bg-surface-hover);
    color: var(--text-secondary);
    border: 1px solid var(--border-subtle);
  }

  .bulk-btn:hover {
    background-color: var(--bg-surface-active);
    color: var(--text-primary);
  }

  .panel-sub {
    font-size: 0.8125rem;
    color: var(--text-secondary);
  }

  /* Platforms Grid */
  .platforms-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.875rem;
  }

  @media (max-width: 1100px) {
    .platforms-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 640px) {
    .platforms-grid {
      grid-template-columns: 1fr;
    }
  }

  .platform-card {
    background-color: var(--bg-surface-hover);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: 0.875rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    transition: all var(--transition-fast);
  }

  :global([data-theme="dark"]) .platform-card {
    background-color: #0c101b;
    border-color: rgba(255, 255, 255, 0.05);
  }

  .platform-card:hover {
    border-color: var(--border-medium);
  }

  .platform-card.is-active {
    border-color: #3b82f6;
    box-shadow: 0 0 12px rgba(59, 130, 246, 0.25);
    background-color: rgba(59, 130, 246, 0.04);
  }

  .platform-card.is-disabled {
    opacity: 0.5;
  }

  .platform-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .platform-toggle-wrap {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }

  .platform-toggle-wrap input[type="checkbox"] {
    width: 14px;
    height: 14px;
    cursor: pointer;
    accent-color: var(--primary-500);
  }

  .platform-name-wrap {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .platform-icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .platform-title {
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .status-chip {
    font-size: 0.625rem;
    font-weight: 700;
    padding: 0.15rem 0.4rem;
    border-radius: var(--radius-full);
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }

  .status-chip.idle {
    background-color: var(--bg-surface-active);
    color: var(--text-muted);
  }

  .status-chip.scraping {
    background-color: rgba(59, 130, 246, 0.15);
    color: #60a5fa;
    border: 1px solid rgba(59, 130, 246, 0.3);
  }

  .status-chip.synced {
    background-color: rgba(16, 185, 129, 0.15);
    color: #34d399;
    border: 1px solid rgba(16, 185, 129, 0.3);
  }

  .pulse-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background-color: #60a5fa;
    animation: blink 0.6s infinite;
  }

  .platform-domain-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.6875rem;
    font-family: var(--font-mono);
  }

  .platform-domain {
    color: var(--text-secondary);
  }

  .platform-protocol {
    color: var(--text-muted);
    font-size: 0.625rem;
  }

  .platform-desc {
    font-size: 0.75rem;
    color: var(--text-muted);
    line-height: 1.35;
    margin: 0.125rem 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .platform-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: auto;
    padding-top: 0.375rem;
    border-top: 1px solid var(--border-subtle);
  }

  .platform-rate {
    font-size: 0.625rem;
    color: var(--text-muted);
    font-family: var(--font-mono);
  }

  .btn-platform-scrape {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.2rem 0.5rem;
    font-size: 0.6875rem;
    font-weight: 600;
    border-radius: var(--radius-xs);
    background-color: var(--bg-surface);
    color: var(--text-secondary);
    border: 1px solid var(--border-medium);
  }

  .btn-platform-scrape:hover:not(:disabled) {
    background-color: var(--primary-50);
    color: var(--primary-500);
    border-color: var(--primary-500);
  }

  /* Query Panel */
  .query-panel {
    background-color: var(--bg-surface);
    border: 1px solid var(--border-medium);
    border-radius: var(--radius-lg);
    padding: 1.25rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    box-shadow: var(--shadow-sm);
  }

  .query-input-wrap {
    display: flex;
    gap: 0.625rem;
  }

  .query-input {
    flex: 1;
  }

  .quick-prompts {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    flex-wrap: wrap;
    margin-top: 0.125rem;
  }

  .quick-label {
    font-size: 0.6875rem;
    font-weight: 700;
    color: var(--text-muted);
  }

  .quick-pill {
    font-size: 0.6875rem;
    font-weight: 600;
    padding: 0.2rem 0.5rem;
    border-radius: var(--radius-full);
    background-color: var(--bg-surface-hover);
    color: var(--text-secondary);
    border: 1px solid var(--border-subtle);
  }

  .quick-pill:hover {
    background-color: var(--primary-50);
    color: var(--primary-500);
    border-color: var(--primary-500);
  }

  /* Terminal Panel */
  .terminal-panel {
    background-color: var(--bg-primary);
    border: 1px solid var(--border-medium);
    border-radius: var(--radius-lg);
    overflow: hidden;
    box-shadow: var(--shadow-md);
  }

  .terminal-header {
    background-color: var(--bg-surface);
    padding: 0.625rem 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--border-medium);
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .terminal-title {
    display: flex;
    align-items: center;
    gap: 0.625rem;
  }

  .terminal-dots {
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }

  .dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
  }

  .dot.red { background-color: #f43f5e; }
  .dot.yellow { background-color: #f59e0b; }
  .dot.green { background-color: #10b981; }

  .term-name {
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    color: var(--text-secondary);
  }

  .terminal-filter-wrap {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.6875rem;
  }

  .filter-lbl {
    color: var(--text-muted);
    font-weight: 600;
  }

  .term-select {
    font-size: 0.6875rem;
    font-family: var(--font-mono);
    padding: 0.2rem 0.5rem;
    background-color: var(--bg-surface-hover);
    border: 1px solid var(--border-medium);
    border-radius: var(--radius-xs);
    color: var(--text-primary);
  }

  .terminal-controls {
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }

  .term-btn {
    font-size: 0.6875rem;
    font-weight: 600;
    padding: 0.2rem 0.45rem;
    border-radius: 4px;
    background-color: var(--bg-surface-hover);
    color: var(--text-primary);
    border: 1px solid var(--border-medium);
  }

  .term-btn:hover {
    background-color: var(--bg-surface-active);
  }

  .term-btn.primary {
    background-color: var(--primary-600);
    color: #ffffff;
    border-color: rgba(255, 255, 255, 0.1);
  }

  .terminal-body {
    padding: 0.875rem 1rem;
    max-height: 280px;
    overflow-y: auto;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    background-color: #05080e;
  }

  .empty-logs {
    padding: 1.5rem;
    text-align: center;
    color: #475569;
    font-style: italic;
  }

  .log-line {
    display: flex;
    gap: 0.5rem;
    line-height: 1.45;
  }

  .log-time {
    color: #475569;
    flex-shrink: 0;
  }

  .log-info .log-text { color: #94a3b8; }
  .log-success .log-text { color: #34d399; }
  .log-warn .log-text { color: #fbbf24; }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 768px) {
    .metrics-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .query-input-wrap {
      flex-direction: column;
    }
  }
</style>
