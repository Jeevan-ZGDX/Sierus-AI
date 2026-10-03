<script>
  import { onMount } from 'svelte';
  import { theme } from './stores/theme.js';
  import { activePage } from './stores/navigation.js';
  import { aiAgent } from './stores/aiAgent.js';
  import Navbar from './components/Navbar.svelte';
  import Sidebar from './components/Sidebar.svelte';
  import Stats from './components/Stats.svelte';
  import SearchBar from './components/SearchBar.svelte';
  import FilterBar from './components/FilterBar.svelte';
  import HackathonList from './components/HackathonList.svelte';
  import HackathonForm from './components/HackathonForm.svelte';
  import HackathonDetailsModal from './components/HackathonDetailsModal.svelte';
  import DeleteModal from './components/DeleteModal.svelte';
  import StatusFilteredView from './components/StatusFilteredView.svelte';
  import LocationExplorer from './components/LocationExplorer.svelte';
  import AIAgentConsole from './components/AIAgentConsole.svelte';
  import Toast from './components/Toast.svelte';

  // Modal states
  let showFormModal = false;
  let hackathonToEdit = null;

  let showDetailsModal = false;
  let selectedHackathonForDetails = null;

  let showDeleteModal = false;
  let hackathonToDelete = null;

  onMount(() => {
    theme.init();
  });

  function openAddModal() {
    hackathonToEdit = null;
    showFormModal = true;
  }

  function handleEditHackathon(event) {
    hackathonToEdit = event.detail;
    showFormModal = true;
  }

  function handleViewDetails(event) {
    selectedHackathonForDetails = event.detail;
    showDetailsModal = true;
  }

  function handleDeletePrompt(event) {
    hackathonToDelete = event.detail;
    showDeleteModal = true;
  }
</script>

<div class="app-shell">
  <!-- Top Navigation -->
  <Navbar on:openAddModal={openAddModal} />

  <div class="app-body">
    <!-- Sidebar Navigation Drawer -->
    <Sidebar />

    <!-- Main Dynamic Content Workspace -->
    <main class="content-workspace">
      {#if $activePage === 'dashboard'}
        <!-- Main Dashboard View -->
        <div class="hero-section">
          <h2 class="hero-title">Discover, Track & Win Next-Gen Hackathons</h2>
          <p class="hero-subtitle">
            Autonomous discovery, countdown timers, multi-track filters, and participation manager in one place.
          </p>
        </div>

        <Stats />

        <div class="controls-section">
          <SearchBar />
          <FilterBar />
        </div>

        <HackathonList
          on:openAddModal={openAddModal}
          on:viewDetails={handleViewDetails}
          on:edit={handleEditHackathon}
          on:delete={handleDeletePrompt}
        />
      {:else if $activePage === 'new-discovered'}
        <!-- AI Discovered Feed -->
        <StatusFilteredView
          pageType="new-discovered"
          on:openAddModal={openAddModal}
          on:viewDetails={handleViewDetails}
          on:edit={handleEditHackathon}
          on:delete={handleDeletePrompt}
        />
      {:else if $activePage === 'registered'}
        <!-- Registered & Participating -->
        <StatusFilteredView
          pageType="registered"
          on:openAddModal={openAddModal}
          on:viewDetails={handleViewDetails}
          on:edit={handleEditHackathon}
          on:delete={handleDeletePrompt}
        />
      {:else if $activePage === 'not-registered'}
        <!-- Open Opportunities -->
        <StatusFilteredView
          pageType="not-registered"
          on:openAddModal={openAddModal}
          on:viewDetails={handleViewDetails}
          on:edit={handleEditHackathon}
          on:delete={handleDeletePrompt}
        />
      {:else if $activePage === 'hackathons-by-location'}
        <!-- Hackathons by Location -->
        <LocationExplorer
          modeType="hackathons"
          on:openAddModal={openAddModal}
          on:viewDetails={handleViewDetails}
          on:edit={handleEditHackathon}
          on:delete={handleDeletePrompt}
        />
      {:else if $activePage === 'tech-events-by-location'}
        <!-- Tech Events by Location -->
        <LocationExplorer
          modeType="tech-events"
          on:openAddModal={openAddModal}
          on:viewDetails={handleViewDetails}
          on:edit={handleEditHackathon}
          on:delete={handleDeletePrompt}
        />
      {:else if $activePage === 'ai-agent'}
        <!-- AI Agent Console -->
        <AIAgentConsole />
      {/if}
    </main>
  </div>

  <!-- Modals -->
  {#if showFormModal}
    <HackathonForm
      {hackathonToEdit}
      on:close={() => {
        showFormModal = false;
        hackathonToEdit = null;
      }}
    />
  {/if}

  {#if showDetailsModal && selectedHackathonForDetails}
    <HackathonDetailsModal
      hackathon={selectedHackathonForDetails}
      on:close={() => {
        showDetailsModal = false;
        selectedHackathonForDetails = null;
      }}
      on:edit={handleEditHackathon}
      on:delete={handleDeletePrompt}
    />
  {/if}

  {#if showDeleteModal && hackathonToDelete}
    <DeleteModal
      hackathon={hackathonToDelete}
      on:close={() => {
        showDeleteModal = false;
        hackathonToDelete = null;
      }}
    />
  {/if}

  <!-- Toast System -->
  <Toast />

  <!-- Global Footer -->
  <footer class="app-footer">
    <div class="footer-inner">
      <p>🤖 <strong>AI-Powered Hackathon Tracker</strong> — Autonomous Event Discovery & Local Storage.</p>
      <p class="footer-note">All data persists privately in your browser. No account required.</p>
    </div>
  </footer>
</div>

<style>
  .app-shell {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .app-body {
    display: flex;
    flex: 1;
    width: 100%;
    max-width: 1536px;
    margin: 0 auto;
  }

  .content-workspace {
    flex: 1;
    min-width: 0;
    padding: 2rem 2rem;
  }

  .hero-section {
    margin-bottom: 2rem;
  }

  .hero-title {
    font-size: 1.85rem;
    font-weight: 800;
    color: var(--text-primary);
    letter-spacing: -0.03em;
    line-height: 1.25;
    margin-bottom: 0.5rem;
  }

  .hero-subtitle {
    font-size: 1rem;
    color: var(--text-secondary);
    max-width: 720px;
    line-height: 1.5;
  }

  .controls-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .app-footer {
    border-top: 1px solid var(--border-subtle);
    background-color: var(--bg-surface);
    padding: 1.75rem 1.5rem;
    margin-top: auto;
  }

  .footer-inner {
    max-width: 1536px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    text-align: center;
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .footer-note {
    font-size: 0.8125rem;
    color: var(--text-muted);
  }

  @media (max-width: 768px) {
    .content-workspace {
      padding: 1.25rem 1rem;
    }

    .hero-title {
      font-size: 1.4rem;
    }
  }
</style>
