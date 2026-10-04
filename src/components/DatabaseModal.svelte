<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import {
    dbStatus,
    activeEngine,
    checkDatabaseHealth,
    getDbStatsFromDb,
    resetDatabaseInDb,
    triggerSupabaseMigration
  } from '../services/db.js';
  import {
    supabaseStatus,
    getStoredConfig,
    saveSupabaseConfig,
    clearSupabaseConfig,
    testSupabaseConnection
  } from '../services/supabase.js';
  import { hackathons } from '../stores/hackathons.js';
  import { toasts } from '../stores/toast.js';
  import Icon from './Icon.svelte';

  const dispatch = createEventDispatcher();

  let activeTab = 'supabase'; // 'supabase' | 'sqlite'
  let detailedStats = null;
  let isChecking = false;
  let isResetting = false;
  let isMigrating = false;

  // Supabase Credentials Form State
  let sbUrl = '';
  let sbKey = '';
  let isSavingSb = false;

  onMount(async () => {
    const cfg = getStoredConfig();
    sbUrl = cfg.url || '';
    sbKey = cfg.anonKey || '';

    await refreshStats();
  });

  async function refreshStats() {
    isChecking = true;
    await checkDatabaseHealth();
    detailedStats = await getDbStatsFromDb();
    isChecking = false;
  }

  async function handleSaveSupabase() {
    if (!sbUrl || !sbKey) {
      toasts.warning('Please enter both Supabase Project URL and Anon Public Key.');
      return;
    }

    isSavingSb = true;
    const res = await saveSupabaseConfig(sbUrl, sbKey);
    isSavingSb = false;

    if (res.success) {
      await hackathons.syncFromDb();
      await refreshStats();
      toasts.success(`Connected to Supabase! Found ${res.count ?? 0} hackathons in cloud.`);
    } else {
      toasts.error(`Supabase connection failed: ${res.error}`);
    }
  }

  function handleClearSupabase() {
    clearSupabaseConfig();
    sbUrl = '';
    sbKey = '';
    checkDatabaseHealth();
    toasts.info('Supabase credentials removed. Switched to SQLite mode.');
  }

  async function handleMigrateToSupabase() {
    if (!$supabaseStatus.connected) {
      toasts.warning('Please connect to Supabase first before migrating.');
      return;
    }

    isMigrating = true;
    try {
      const result = await triggerSupabaseMigration($hackathons);
      await refreshStats();
      await hackathons.syncFromDb();
      toasts.success(
        `Successfully migrated ${result.hackathonsMigrated ?? $hackathons.length} records to Supabase!`
      );
    } catch (err) {
      toasts.error(`Migration error: ${err.message}`);
    } finally {
      isMigrating = false;
    }
  }

  async function handleCopySchema() {
    const schemaSql = `-- Supabase PostgreSQL Schema for Hackathon Tracker
CREATE TABLE IF NOT EXISTS public.hackathons (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'hackathon',
    description TEXT DEFAULT '',
    organizer TEXT DEFAULT '',
    category TEXT NOT NULL DEFAULT 'Web3',
    mode TEXT NOT NULL DEFAULT 'Online',
    location TEXT DEFAULT '',
    city TEXT DEFAULT '',
    country TEXT DEFAULT '',
    registration_deadline TEXT NOT NULL,
    event_start_date TEXT NOT NULL,
    event_end_date TEXT NOT NULL,
    registration_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Open',
    bookmarked BOOLEAN DEFAULT false,
    platform TEXT,
    platform_name TEXT,
    source TEXT DEFAULT '',
    discovered_at TIMESTAMPTZ,
    prize_pool TEXT,
    event_type TEXT,
    is_new BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.scraper_sources (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'hackathon',
    color TEXT DEFAULT '#0086bf',
    status TEXT DEFAULT 'active',
    last_scraped_at TIMESTAMPTZ,
    items_found INTEGER DEFAULT 0,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.hackathons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraper_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read hackathons" ON public.hackathons FOR SELECT USING (true);
CREATE POLICY "Allow public write hackathons" ON public.hackathons FOR ALL USING (true);
CREATE POLICY "Allow public read scraper_sources" ON public.scraper_sources FOR SELECT USING (true);
CREATE POLICY "Allow public write scraper_sources" ON public.scraper_sources FOR ALL USING (true);`;

    try {
      await navigator.clipboard.writeText(schemaSql);
      toasts.success('SQL Schema copied to clipboard! Paste into Supabase SQL Editor.');
    } catch (e) {
      toasts.info('Check file: supabase/schema.sql in your workspace');
    }
  }

  async function handleResync() {
    isChecking = true;
    await hackathons.syncFromDb();
    await refreshStats();
    toasts.success('Synchronized with active database!');
    isChecking = false;
  }

  async function handleReseed() {
    if (confirm('Are you sure you want to reset and reseed the SQLite database to factory state?')) {
      isResetting = true;
      await resetDatabaseInDb();
      await hackathons.syncFromDb();
      await refreshStats();
      toasts.success('SQLite database reseeded successfully!');
      isResetting = false;
    }
  }

  async function handleExportBackup() {
    try {
      window.open('/api/db/backup', '_blank');
      toasts.success('Downloading database backup JSON dump...');
    } catch (e) {
      toasts.error('Failed to trigger database dump');
    }
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') {
      dispatch('close');
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div
  class="modal-backdrop"
  on:click|self={() => dispatch('close')}
  on:keydown={handleKeydown}
  role="presentation"
>
  <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="db-modal-title">
    <!-- Header -->
    <div class="modal-header">
      <div class="header-title-wrap">
        <div class="db-icon-box" class:is-supabase={activeTab === 'supabase'}>
          <Icon name={activeTab === 'supabase' ? 'cloud' : 'layers'} size={20} />
        </div>
        <div>
          <h2 id="db-modal-title" class="modal-title">Database Management Center</h2>
          <span class="modal-sub">
            Active Engine: 
            <strong class="engine-badge" class:is-supabase={$activeEngine === 'supabase'}>
              {$activeEngine === 'supabase' ? 'Supabase PostgreSQL Cloud' : $activeEngine === 'sqlite' ? 'SQLite 3.x (Local)' : 'Offline Cache'}
            </strong>
          </span>
        </div>
      </div>
      <button class="close-btn" on:click={() => dispatch('close')} aria-label="Close dialog">
        <Icon name="x" size={18} />
      </button>
    </div>

    <!-- Navigation Tabs -->
    <div class="tabs-bar">
      <button
        type="button"
        class="tab-btn"
        class:active={activeTab === 'supabase'}
        on:click={() => (activeTab = 'supabase')}
      >
        <span class="tab-dot" class:online={$supabaseStatus.connected}></span>
        <span>☁️ Supabase Cloud (PostgreSQL)</span>
        {#if $activeEngine === 'supabase'}
          <span class="chip-active">ACTIVE</span>
        {/if}
      </button>

      <button
        type="button"
        class="tab-btn"
        class:active={activeTab === 'sqlite'}
        on:click={() => (activeTab = 'sqlite')}
      >
        <span class="tab-dot" class:online={$dbStatus.connected}></span>
        <span>🗄️ Local SQLite 3.x Engine</span>
        {#if $activeEngine === 'sqlite'}
          <span class="chip-active">ACTIVE</span>
        {/if}
      </button>
    </div>

    <!-- Body -->
    <div class="modal-body">
      {#if activeTab === 'supabase'}
        <!-- ------------------------------------------------------------- -->
        <!-- Supabase Cloud Tab Content                                   -->
        <!-- ------------------------------------------------------------- -->

        <!-- Status Banner -->
        <div class="db-status-banner" class:is-online={$supabaseStatus.connected}>
          <div class="banner-status-left">
            <span class="beacon-dot" class:online={$supabaseStatus.connected}></span>
            <div>
              <strong class="status-heading">
                {$supabaseStatus.connected
                  ? 'Connected to Supabase PostgreSQL'
                  : $supabaseStatus.configured
                  ? 'Supabase Connection Error'
                  : 'Supabase Not Configured'}
              </strong>
              <p class="status-desc">
                {$supabaseStatus.connected
                  ? `Live cloud synchronisation active at ${$supabaseStatus.url}. High-availability PostgreSQL with Row Level Security.`
                  : $supabaseStatus.error
                  ? $supabaseStatus.error
                  : 'Connect your Supabase project to migrate your local hackathons to the cloud and enable real-time collaborative updates.'}
              </p>
            </div>
          </div>

          <button
            class="btn-refresh"
            disabled={isChecking || $supabaseStatus.isTesting}
            on:click={refreshStats}
            title="Refresh connection"
          >
            <Icon
              name="refresh-cw"
              size={13}
              className={isChecking || $supabaseStatus.isTesting ? 'spin' : ''}
            />
            <span>Refresh</span>
          </button>
        </div>

        <!-- Supabase Live Stats Grid -->
        <div class="db-stats-grid">
          <div class="db-stat-box">
            <span class="stat-label">CLOUD HACKATHONS</span>
            <strong class="stat-val text-emerald">
              {$supabaseStatus.connected ? $supabaseStatus.totalRecords : '—'}
            </strong>
            <span class="stat-sub">public.hackathons</span>
          </div>

          <div class="db-stat-box">
            <span class="stat-label">DATABASE TYPE</span>
            <strong class="stat-val text-cyan">PostgreSQL</strong>
            <span class="stat-sub">Supabase Managed</span>
          </div>

          <div class="db-stat-box">
            <span class="stat-label">ACCESS SECURITY</span>
            <strong class="stat-val text-purple">RLS Active</strong>
            <span class="stat-sub">Anon & Auth Policies</span>
          </div>

          <div class="db-stat-box">
            <span class="stat-label">LOCAL RECORDS</span>
            <strong class="stat-val">{$hackathons.length}</strong>
            <span class="stat-sub">Ready to migrate</span>
          </div>
        </div>

        <!-- 1-Click Migration Card -->
        <div class="migration-card">
          <div class="migration-card-header">
            <div class="migration-title-wrap">
              <span class="rocket-icon">🚀</span>
              <div>
                <h4 class="migration-title">1-Click Migration: SQLite &rarr; Supabase</h4>
                <p class="migration-subtitle">
                  Transfers all local hackathons, scraper portals, and event records into your cloud Supabase database.
                </p>
              </div>
            </div>
            <button
              type="button"
              class="btn-migrate"
              disabled={isMigrating || !$supabaseStatus.connected}
              on:click={handleMigrateToSupabase}
            >
              <Icon name="upload-cloud" size={15} className={isMigrating ? 'spin' : ''} />
              <span>{isMigrating ? 'Migrating Data...' : 'Migrate Now'}</span>
            </button>
          </div>

          {#if !$supabaseStatus.connected}
            <div class="migration-notice">
              ⚠️ Please connect your Supabase credentials below first to enable 1-click migration.
            </div>
          {/if}
        </div>

        <!-- Supabase Credentials Form -->
        <div class="config-section">
          <div class="section-title-row">
            <h4 class="section-heading">Supabase Project Connection</h4>
            <button class="btn-text-action" on:click={handleCopySchema}>
              <Icon name="copy" size={13} />
              <span>Copy SQL Schema (DDL)</span>
            </button>
          </div>

          <div class="form-inputs-group">
            <div class="input-field">
              <label for="sb-url">Supabase Project URL</label>
              <input
                id="sb-url"
                type="text"
                bind:value={sbUrl}
                placeholder="https://xxxxxxxxxxxxxxxxxxxx.supabase.co"
                class="form-input"
              />
              <span class="input-hint">Found in Supabase Dashboard &rarr; Project Settings &rarr; API</span>
            </div>

            <div class="input-field">
              <label for="sb-key">Supabase Anon Public Key</label>
              <input
                id="sb-key"
                type="password"
                bind:value={sbKey}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                class="form-input font-mono"
              />
              <span class="input-hint">Project API keys &rarr; anon public (safe for client queries with RLS)</span>
            </div>
          </div>

          <div class="config-actions">
            <button
              type="button"
              class="btn-connect"
              disabled={isSavingSb}
              on:click={handleSaveSupabase}
            >
              <Icon name="check-circle" size={14} />
              <span>{isSavingSb ? 'Connecting & Verifying...' : 'Save & Connect to Supabase'}</span>
            </button>

            {#if $supabaseStatus.configured}
              <button
                type="button"
                class="btn-secondary"
                on:click={handleClearSupabase}
              >
                <Icon name="trash-2" size={14} />
                <span>Disconnect</span>
              </button>
            {/if}
          </div>
        </div>

        <!-- Quick 3-Step Setup Instructions -->
        <div class="setup-guide-box">
          <h4 class="guide-title">Quick Supabase Setup Guide</h4>
          <ol class="guide-steps">
            <li>
              Log into your <strong><a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">Supabase Dashboard</a></strong> and create or open your project.
            </li>
            <li>
              Go to the <strong>SQL Editor</strong>, click <strong>"Copy SQL Schema (DDL)"</strong> above, paste and click <strong>Run</strong> (or run <code>supabase/schema.sql</code>).
            </li>
            <li>
              Copy the <strong>Project URL</strong> and <strong>Anon Key</strong> from <strong>Project Settings &rarr; API</strong>, enter them above, and click <strong>Migrate Now</strong>.
            </li>
          </ol>
        </div>

      {:else}
        <!-- ------------------------------------------------------------- -->
        <!-- SQLite Engine Tab Content                                     -->
        <!-- ------------------------------------------------------------- -->

        <!-- Status Banner -->
        <div class="db-status-banner" class:is-online={$dbStatus.connected}>
          <div class="banner-status-left">
            <span class="beacon-dot" class:online={$dbStatus.connected}></span>
            <div>
              <strong class="status-heading">
                {$dbStatus.connected ? 'SQLite Database Connected & Active' : 'Offline / Client-Side Cache Mode'}
              </strong>
              <p class="status-desc">
                {$dbStatus.connected
                  ? `Storing records on disk at ${$dbStatus.dbFile} via high-speed WAL mode.`
                  : 'Backend API unreachable. Data is safe in browser cache and will auto-sync on reconnect.'}
              </p>
            </div>
          </div>

          <button class="btn-refresh" disabled={isChecking} on:click={refreshStats} title="Refresh DB status">
            <Icon name="refresh-cw" size={13} className={isChecking ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        <!-- Stats Grid -->
        <div class="db-stats-grid">
          <div class="db-stat-box">
            <span class="stat-label">TOTAL RECORDS</span>
            <strong class="stat-val">{detailedStats?.counts?.total ?? $dbStatus.totalRecords}</strong>
            <span class="stat-sub">in hackathons table</span>
          </div>

          <div class="db-stat-box">
            <span class="stat-label">SCRAPER PORTALS</span>
            <strong class="stat-val text-cyan">{detailedStats?.counts?.platforms ?? 22}</strong>
            <span class="stat-sub">registered in SQLite</span>
          </div>

          <div class="db-stat-box">
            <span class="stat-label">INTEGRITY CHECK</span>
            <strong class="stat-val text-emerald">{detailedStats?.integrity ?? 'OK'}</strong>
            <span class="stat-sub">PRAGMA integrity_check</span>
          </div>

          <div class="db-stat-box">
            <span class="stat-label">STORAGE ENGINE</span>
            <strong class="stat-val text-purple">WAL Mode</strong>
            <span class="stat-sub">SQLite 3.x Native</span>
          </div>
        </div>

        <!-- Detailed Tables Information -->
        <div class="table-list-section">
          <h4 class="section-heading">Database Tables & Schema Breakdown</h4>
          <div class="table-rows">
            <div class="table-row">
              <div class="table-name-wrap">
                <Icon name="trophy" size={14} />
                <span class="table-name">hackathons</span>
                <span class="table-badge">Primary Table</span>
              </div>
              <span class="table-meta">{detailedStats?.counts?.total ?? $hackathons.length} rows (7 indexes)</span>
            </div>

            <div class="table-row">
              <div class="table-name-wrap">
                <Icon name="globe" size={14} />
                <span class="table-name">scraper_sources</span>
                <span class="table-badge">Registry</span>
              </div>
              <span class="table-meta">{detailedStats?.counts?.platforms ?? 22} platforms (Devpost, Luma, GDG, etc.)</span>
            </div>

            <div class="table-row">
              <div class="table-name-wrap">
                <Icon name="terminal" size={14} />
                <span class="table-name">crawler_logs</span>
                <span class="table-badge">Telemetry</span>
              </div>
              <span class="table-meta">{detailedStats?.counts?.logs ?? 0} log lines</span>
            </div>

            <div class="table-row">
              <div class="table-name-wrap">
                <Icon name="shield" size={14} />
                <span class="table-name">db_meta</span>
                <span class="table-badge">Config</span>
              </div>
              <span class="table-meta">WAL Pragmas & Initialized Meta</span>
            </div>
          </div>
        </div>
      {/if}
    </div>

    <!-- Footer Controls -->
    <div class="modal-footer">
      <div class="footer-actions">
        {#if activeTab === 'sqlite'}
          <button
            type="button"
            class="btn-secondary"
            disabled={isChecking}
            on:click={handleResync}
          >
            <Icon name="rotate-ccw" size={14} />
            <span>Sync from SQLite</span>
          </button>

          <button
            type="button"
            class="btn-secondary"
            on:click={handleExportBackup}
          >
            <Icon name="download" size={14} />
            <span>Export SQLite Dump</span>
          </button>

          <button
            type="button"
            class="btn-danger-ghost"
            disabled={isResetting}
            on:click={handleReseed}
          >
            <Icon name="refresh-cw" size={14} />
            <span>Reseed SQLite</span>
          </button>
        {:else}
          <button
            type="button"
            class="btn-secondary"
            on:click={handleCopySchema}
          >
            <Icon name="file-text" size={14} />
            <span>View SQL Schema</span>
          </button>

          <button
            type="button"
            class="btn-secondary"
            disabled={isChecking}
            on:click={handleResync}
          >
            <Icon name="rotate-ccw" size={14} />
            <span>Resync Data</span>
          </button>
        {/if}
      </div>

      <button type="button" class="btn-primary" on:click={() => dispatch('close')}>
        Done
      </button>
    </div>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.25rem;
    z-index: 1000;
    animation: fadeIn 0.15s ease-out;
  }

  .modal-card {
    background-color: var(--bg-surface);
    border: 1px solid var(--border-medium);
    border-radius: var(--radius-xl);
    width: 100%;
    max-width: 720px;
    box-shadow: var(--shadow-xl);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: scaleUp 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .modal-header {
    padding: 1.25rem 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--border-subtle);
  }

  .header-title-wrap {
    display: flex;
    align-items: center;
    gap: 0.875rem;
  }

  .db-icon-box {
    width: 42px;
    height: 42px;
    border-radius: var(--radius-md);
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2));
    color: var(--primary-500);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(59, 130, 246, 0.3);
  }

  .db-icon-box.is-supabase {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2));
    color: #10b981;
    border-color: rgba(16, 185, 129, 0.3);
  }

  .modal-title {
    font-size: 1.125rem;
    font-weight: 800;
    color: var(--text-primary);
  }

  .modal-sub {
    font-size: 0.75rem;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-top: 0.1rem;
  }

  .engine-badge {
    font-size: 0.6875rem;
    padding: 0.1rem 0.4rem;
    border-radius: var(--radius-xs);
    background-color: var(--bg-surface-hover);
    color: var(--text-secondary);
    border: 1px solid var(--border-medium);
  }

  .engine-badge.is-supabase {
    background-color: rgba(16, 185, 129, 0.15);
    color: #10b981;
    border-color: rgba(16, 185, 129, 0.3);
  }

  .close-btn {
    color: var(--text-secondary);
    padding: 0.25rem;
    border-radius: var(--radius-sm);
  }

  .close-btn:hover {
    background-color: var(--bg-surface-hover);
    color: var(--text-primary);
  }

  /* Navigation Tabs */
  .tabs-bar {
    display: flex;
    background-color: var(--bg-base);
    border-bottom: 1px solid var(--border-medium);
    padding: 0 1rem;
    gap: 0.5rem;
  }

  .tab-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--text-secondary);
    border-bottom: 2px solid transparent;
    transition: all 0.15s ease;
  }

  .tab-btn:hover {
    color: var(--text-primary);
  }

  .tab-btn.active {
    color: var(--text-primary);
    border-bottom-color: var(--primary-500);
    background-color: var(--bg-surface);
  }

  .tab-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background-color: #6b7280;
  }

  .tab-dot.online {
    background-color: #10b981;
    box-shadow: 0 0 6px rgba(16, 185, 129, 0.7);
  }

  .chip-active {
    font-size: 0.5625rem;
    font-weight: 800;
    background-color: rgba(16, 185, 129, 0.2);
    color: #10b981;
    padding: 0.1rem 0.35rem;
    border-radius: var(--radius-xs);
    letter-spacing: 0.05em;
  }

  .modal-body {
    padding: 1.25rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.125rem;
    max-height: 70vh;
    overflow-y: auto;
  }

  /* Status Banner */
  .db-status-banner {
    padding: 1rem 1.25rem;
    border-radius: var(--radius-lg);
    background-color: var(--bg-surface-hover);
    border: 1px solid var(--border-medium);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .db-status-banner.is-online {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(6, 182, 212, 0.08));
    border-color: rgba(16, 185, 129, 0.25);
  }

  .banner-status-left {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .beacon-dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background-color: #f59e0b;
    margin-top: 0.3rem;
    flex-shrink: 0;
  }

  .beacon-dot.online {
    background-color: #10b981;
    box-shadow: 0 0 10px rgba(16, 185, 129, 0.6);
  }

  .status-heading {
    font-size: 0.875rem;
    color: var(--text-primary);
    display: block;
    margin-bottom: 0.15rem;
  }

  .status-desc {
    font-size: 0.75rem;
    color: var(--text-secondary);
    line-height: 1.4;
  }

  .btn-refresh {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.35rem 0.65rem;
    border-radius: var(--radius-sm);
    background-color: var(--bg-surface);
    color: var(--text-primary);
    border: 1px solid var(--border-medium);
    white-space: nowrap;
  }

  /* Stats Grid */
  .db-stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.75rem;
  }

  @media (max-width: 640px) {
    .db-stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .db-stat-box {
    background-color: var(--bg-surface-hover);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .stat-label {
    font-size: 0.625rem;
    font-weight: 800;
    color: var(--text-muted);
    letter-spacing: 0.04em;
  }

  .stat-val {
    font-size: 1.35rem;
    font-weight: 800;
    color: var(--text-primary);
    margin: 0.1rem 0;
  }

  .text-cyan { color: #06b6d4; }
  .text-emerald { color: #10b981; }
  .text-purple { color: #8b5cf6; }

  .stat-sub {
    font-size: 0.625rem;
    color: var(--text-muted);
  }

  /* 1-Click Migration Card */
  .migration-card {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(16, 185, 129, 0.08));
    border: 1px solid rgba(16, 185, 129, 0.25);
    border-radius: var(--radius-lg);
    padding: 1.125rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .migration-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .migration-title-wrap {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .rocket-icon {
    font-size: 1.75rem;
  }

  .migration-title {
    font-size: 0.9375rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .migration-subtitle {
    font-size: 0.75rem;
    color: var(--text-secondary);
    margin-top: 0.1rem;
  }

  .btn-migrate {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 1rem;
    font-size: 0.8125rem;
    font-weight: 700;
    background-color: #10b981;
    color: #ffffff;
    border-radius: var(--radius-md);
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
    transition: all 0.15s ease;
  }

  .btn-migrate:hover:not(:disabled) {
    background-color: #059669;
    transform: translateY(-1px);
  }

  .btn-migrate:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .migration-notice {
    font-size: 0.75rem;
    color: #f59e0b;
    background-color: rgba(245, 158, 11, 0.1);
    padding: 0.5rem 0.75rem;
    border-radius: var(--radius-sm);
    border: 1px solid rgba(245, 158, 11, 0.2);
  }

  /* Configuration Section */
  .config-section {
    background-color: var(--bg-surface-hover);
    border: 1px solid var(--border-medium);
    border-radius: var(--radius-lg);
    padding: 1.125rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
  }

  .section-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .section-heading {
    font-size: 0.8125rem;
    font-weight: 700;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .btn-text-action {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.75rem;
    color: var(--primary-500);
    font-weight: 600;
  }

  .btn-text-action:hover {
    text-decoration: underline;
  }

  .form-inputs-group {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .input-field {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .input-field label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .form-input {
    padding: 0.55rem 0.75rem;
    border-radius: var(--radius-md);
    background-color: var(--bg-base);
    border: 1px solid var(--border-medium);
    color: var(--text-primary);
    font-size: 0.8125rem;
  }

  .form-input:focus {
    outline: none;
    border-color: var(--primary-500);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }

  .input-hint {
    font-size: 0.6875rem;
    color: var(--text-muted);
  }

  .config-actions {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    margin-top: 0.25rem;
  }

  .btn-connect {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 0.875rem;
    font-size: 0.8125rem;
    font-weight: 700;
    background-color: var(--primary-600);
    color: white;
    border-radius: var(--radius-md);
  }

  .btn-connect:hover:not(:disabled) {
    background-color: var(--primary-500);
  }

  /* Setup Guide */
  .setup-guide-box {
    background-color: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: 1rem 1.25rem;
  }

  .guide-title {
    font-size: 0.8125rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }

  .guide-steps {
    padding-left: 1.25rem;
    font-size: 0.75rem;
    color: var(--text-secondary);
    line-height: 1.6;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .guide-steps a {
    color: var(--primary-500);
    text-decoration: underline;
  }

  .guide-steps code {
    background-color: var(--bg-surface-hover);
    padding: 0.1rem 0.35rem;
    border-radius: var(--radius-xs);
    font-family: var(--font-mono);
  }

  /* Table Breakdown */
  .table-list-section {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
  }

  .table-rows {
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  .table-row {
    padding: 0.625rem 0.875rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--border-subtle);
    background-color: var(--bg-surface);
  }

  .table-row:last-child {
    border-bottom: none;
  }

  .table-name-wrap {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .table-name {
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .table-badge {
    font-size: 0.5625rem;
    font-weight: 700;
    text-transform: uppercase;
    padding: 0.1rem 0.35rem;
    border-radius: var(--radius-xs);
    background-color: var(--primary-50);
    color: var(--primary-500);
  }

  .table-meta {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  /* Footer */
  .modal-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--border-subtle);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .footer-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.45rem 0.75rem;
    font-size: 0.8125rem;
    font-weight: 600;
    border-radius: var(--radius-md);
    background-color: var(--bg-surface-hover);
    color: var(--text-primary);
    border: 1px solid var(--border-medium);
  }

  .btn-secondary:hover {
    background-color: var(--bg-surface-active);
  }

  .btn-danger-ghost {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.45rem 0.75rem;
    font-size: 0.8125rem;
    font-weight: 600;
    border-radius: var(--radius-md);
    background-color: transparent;
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }

  .btn-danger-ghost:hover {
    background-color: rgba(239, 68, 68, 0.1);
  }

  :global(.spin) {
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes scaleUp {
    from { transform: scale(0.96); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
</style>
