<script>
  import { createEventDispatcher } from 'svelte';
  import { hackathons } from '../stores/hackathons.js';
  import { theme } from '../stores/theme.js';
  import { sidebarOpen, navigateTo } from '../stores/navigation.js';
  import { aiAgent } from '../stores/aiAgent.js';
  import { toasts } from '../stores/toast.js';
  import { dbStatus } from '../services/db.js';
  import DatabaseModal from './DatabaseModal.svelte';
  import Icon from './Icon.svelte';

  const dispatch = createEventDispatcher();

  let fileInputRef;
  let showDbModal = false;

  function toggleSidebar() {
    sidebarOpen.update(val => !val);
  }

  function handleAddClick() {
    dispatch('openAddModal');
  }

  function handleResetData() {
    if (confirm('Reset your hackathon list to default sample data?')) {
      hackathons.resetToSampleData();
      toasts.success('Sample data restored!');
    }
  }

  function handleExportJson() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify($hackathons, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `hackathon-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toasts.success('Exported hackathon data as JSON');
  }

  function triggerImportFile() {
    if (fileInputRef) {
      fileInputRef.click();
    }
  }

  function handleFileImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (Array.isArray(parsed)) {
          hackathons.importData(parsed);
          toasts.success(`Successfully imported ${parsed.length} items!`);
        } else {
          toasts.error('Invalid JSON file structure.');
        }
      } catch (err) {
        toasts.error('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }
</script>

<header class="navbar">
  <div class="navbar-container">
    <!-- Left: Menu trigger & Brand -->
    <div class="brand-wrap">
      <button
        class="btn-menu"
        on:click={toggleSidebar}
        aria-label="Toggle navigation sidebar"
        title="Toggle sidebar menu"
      >
        <Icon name="menu" size={18} />
      </button>

      <button
        class="brand-btn"
        on:click={() => navigateTo('dashboard')}
        title="Go to main dashboard"
      >
        <div class="brand-icon">
          <Icon name="trophy" size={20} />
        </div>
        <div class="brand-text">
          <div class="title-row">
            <span class="brand-title">Hackathon<span class="brand-accent">Tracker</span></span>
            <span class="pro-badge">PRO</span>
          </div>
          <p class="brand-subtitle">AI Discovery & Competition Radar</p>
        </div>
      </button>
    </div>

    <!-- Right: Actions -->
    <div class="navbar-actions">
      <!-- Hidden file input for JSON import -->
      <input
        type="file"
        accept=".json"
        style="display: none;"
        bind:this={fileInputRef}
        on:change={handleFileImport}
      />

      <!-- AI Agent Scout Quick Button -->
      <button
        class="btn-ai-nav"
        class:is-active={$aiAgent.isScanning}
        on:click={() => navigateTo('ai-agent')}
        title="Open AI Scout Agent Console"
      >
        <span class="ai-spark-dot"></span>
        <Icon name="bot" size={15} />
        <span class="desktop-text">{$aiAgent.isScanning ? 'AI Scanning...' : 'AI Scout'}</span>
      </button>

      <!-- SQLite Database Status Pill Button -->
      <button
        class="btn-db-nav"
        class:is-connected={$dbStatus.connected}
        on:click={() => showDbModal = true}
        title="SQLite Relational Database Status & Controls"
      >
        <span class="db-dot" class:online={$dbStatus.connected}></span>
        <Icon name="layers" size={14} />
        <span class="desktop-text">{$dbStatus.connected ? 'SQLite DB' : 'Local DB'}</span>
      </button>

      <div class="nav-divider"></div>

      <!-- Backup / Export & Restore Tools -->
      <div class="utility-group">
        <button
          class="btn-icon-nav"
          on:click={handleExportJson}
          title="Export JSON backup"
          aria-label="Export data"
        >
          <Icon name="download" size={15} />
        </button>

        <button
          class="btn-icon-nav"
          on:click={triggerImportFile}
          title="Import JSON backup"
          aria-label="Import data"
        >
          <Icon name="upload" size={15} />
        </button>

        <button
          class="btn-icon-nav"
          on:click={handleResetData}
          title="Reset to default sample data"
          aria-label="Reset data"
        >
          <Icon name="rotate-ccw" size={15} />
        </button>
      </div>

      <!-- Theme Toggle -->
      <button
        class="btn-icon-nav theme-toggle"
        on:click={theme.toggle}
        title={$theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        aria-label="Toggle dark/light theme"
      >
        <Icon name={$theme === 'dark' ? 'sun' : 'moon'} size={16} />
      </button>

      <!-- Primary Action -->
      <button class="btn-primary" on:click={handleAddClick}>
        <Icon name="plus" size={16} />
        <span>Add Event</span>
      </button>
    </div>
  </div>
</header>

{#if showDbModal}
  <DatabaseModal on:close={() => showDbModal = false} />
{/if}

<style>
  .navbar {
    background-color: var(--bg-surface);
    border-bottom: 1px solid var(--border-medium);
    position: sticky;
    top: 0;
    z-index: 100;
    backdrop-filter: blur(12px);
  }

  :global([data-theme="dark"]) .navbar {
    background-color: rgba(14, 19, 31, 0.85);
  }

  .navbar-container {
    max-width: 1536px;
    margin: 0 auto;
    padding: 0.625rem 1.25rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    height: 60px;
  }

  .brand-wrap {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .btn-menu {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: var(--radius-md);
    background-color: var(--bg-surface-hover);
    color: var(--text-secondary);
    border: 1px solid var(--border-subtle);
  }

  .btn-menu:hover {
    color: var(--text-primary);
    background-color: var(--bg-surface-active);
  }

  .brand-btn {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
    background: none;
    border: none;
    padding: 0;
    text-align: left;
  }

  .brand-icon {
    width: 36px;
    height: 36px;
    border-radius: var(--radius-md);
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
    flex-shrink: 0;
  }

  .title-row {
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }

  .brand-title {
    font-size: 1.1rem;
    font-weight: 800;
    color: var(--text-primary);
    line-height: 1.2;
    letter-spacing: -0.02em;
  }

  .brand-accent {
    color: var(--primary-500);
  }

  .pro-badge {
    font-size: 0.625rem;
    font-weight: 800;
    padding: 0.1rem 0.35rem;
    border-radius: var(--radius-xs);
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    color: #ffffff;
    letter-spacing: 0.05em;
  }

  .brand-subtitle {
    font-size: 0.6875rem;
    color: var(--text-muted);
    font-weight: 500;
    letter-spacing: 0.01em;
  }

  .navbar-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .btn-ai-nav {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.4375rem 0.75rem;
    border-radius: var(--radius-md);
    font-size: 0.75rem;
    font-weight: 700;
    background: rgba(139, 92, 246, 0.1);
    color: #a78bfa;
    border: 1px solid rgba(139, 92, 246, 0.25);
    position: relative;
    overflow: hidden;
  }

  .ai-spark-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #a78bfa;
    box-shadow: 0 0 8px #a78bfa;
    display: inline-block;
  }

  .btn-ai-nav:hover {
    background: rgba(139, 92, 246, 0.18);
    border-color: #a78bfa;
  }

  .btn-ai-nav.is-active {
    animation: pulseGlow 1.5s infinite alternate;
  }

  @keyframes pulseGlow {
    0% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4); }
    100% { box-shadow: 0 0 12px 2px rgba(139, 92, 246, 0.6); }
  }

  .btn-db-nav {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.4375rem 0.6875rem;
    border-radius: var(--radius-md);
    font-size: 0.75rem;
    font-weight: 700;
    background: rgba(16, 185, 129, 0.08);
    color: #059669;
    border: 1px solid rgba(16, 185, 129, 0.25);
    transition: all var(--transition-fast);
  }

  :global([data-theme="dark"]) .btn-db-nav {
    color: #34d399;
    border-color: rgba(52, 211, 153, 0.25);
  }

  .btn-db-nav:hover {
    background: rgba(16, 185, 129, 0.16);
    border-color: #10b981;
  }

  .db-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #f59e0b;
    display: inline-block;
  }

  .db-dot.online {
    background: #10b981;
    box-shadow: 0 0 6px #10b981;
  }

  .nav-divider {
    width: 1px;
    height: 20px;
    background-color: var(--border-medium);
    margin: 0 0.25rem;
  }

  .utility-group {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .btn-icon-nav {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-md);
    background-color: var(--bg-surface);
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--border-medium);
    transition: all var(--transition-fast);
  }

  .btn-icon-nav:hover {
    color: var(--text-primary);
    background-color: var(--bg-surface-hover);
    border-color: var(--text-muted);
  }

  .theme-toggle:hover {
    color: #f59e0b;
  }

  @media (max-width: 768px) {
    .navbar-container {
      padding: 0.5rem 0.875rem;
    }

    .brand-subtitle {
      display: none;
    }

    .desktop-text {
      display: none;
    }

    .utility-group {
      display: none;
    }

    .nav-divider {
      display: none;
    }
  }
</style>
