<script>
  import { createEventDispatcher } from 'svelte';
  import { hackathons } from '../stores/hackathons.js';
  import { toasts } from '../stores/toast.js';
  import { formatDisplayDate, formatDateRange, getDeadlineStatus } from '../utils/dateUtils.js';
  import { FORM_STATUSES } from '../data/sampleHackathons.js';
  import { getVerifiedEventUrl } from '../utils/urlHelper.js';
  import Icon from './Icon.svelte';

  export let hackathon;

  const dispatch = createEventDispatcher();

  $: deadlineInfo = getDeadlineStatus(hackathon.registrationDeadline);

  function handleBookmarkToggle() {
    hackathons.toggleBookmark(hackathon.id);
    if (!hackathon.bookmarked) {
      toasts.success(`Bookmarked "${hackathon.title}"`);
    } else {
      toasts.info(`Removed bookmark`);
    }
  }

  function handleStatusChange(event) {
    const newStatus = event.target.value;
    hackathons.updateStatus(hackathon.id, newStatus);
    toasts.success(`Status updated to "${newStatus}"`);
  }

  function getCategoryClass(cat) {
    const map = {
      'AI/ML': 'cat-ai-ml',
      'Web Development': 'cat-web-dev',
      'Mobile Development': 'cat-mobile-dev',
      'Blockchain': 'cat-blockchain',
      'Cybersecurity': 'cat-cybersecurity',
      'IoT': 'cat-iot',
      'Cloud': 'cat-cloud',
      'Open Innovation': 'cat-open-innovation',
      'Other': 'cat-other'
    };
    return map[cat] || 'cat-other';
  }

  function getStatusClass(status) {
    const map = {
      'Not Registered': 'status-not-registered',
      'Registered': 'status-registered',
      'Participating': 'status-participating',
      'Completed': 'status-completed'
    };
    return map[status] || 'status-not-registered';
  }

  $: platformInfo = getPlatformInfo(hackathon);

  function getPlatformInfo(item) {
    if (!item) return null;
    if (item.platformName) return { name: item.platformName, id: item.platform || 'ai' };
    const s = ((item.source || '') + ' ' + (item.organizer || '')).toLowerCase();
    if (s.includes('devpost')) return { name: 'Devpost', id: 'devpost' };
    if (s.includes('devfolio')) return { name: 'Devfolio', id: 'devfolio' };
    if (s.includes('hackerearth')) return { name: 'HackerEarth', id: 'hackerearth' };
    if (s.includes('unstop')) return { name: 'Unstop', id: 'unstop' };
    if (s.includes('reskill')) return { name: 'Reskill', id: 'reskill' };
    if (s.includes('hack2skill')) return { name: 'Hack2Skill', id: 'hack2skill' };
    if (s.includes('mlh')) return { name: 'MLH', id: 'mlh' };
    if (s.includes('herox')) return { name: 'HeroX', id: 'herox' };
    if (s.includes('brightidea')) return { name: 'Brightidea', id: 'brightidea' };
    if (s.includes('bemyapp')) return { name: 'BeMyApp', id: 'bemyapp' };
    if (s.includes('stackup')) return { name: 'StackUp', id: 'stackup' };
    if (s.includes('jamao')) return { name: 'Jamao', id: 'jamao' };
    if (s.includes('luma') || s.includes('lu.ma')) return { name: 'Luma', id: 'luma' };
    if (s.includes('eventbrite')) return { name: 'Eventbrite', id: 'eventbrite' };
    if (s.includes('allevents')) return { name: 'AllEvents', id: 'allevents' };
    if (s.includes('maidan')) return { name: 'Maidan', id: 'maidan' };
    if (s.includes('techmeetup')) return { name: 'TechMeetups', id: 'techmeetups' };
    if (s.includes('startupmela')) return { name: 'StartupMelas', id: 'startupmelas' };
    if (s.includes('eventindia')) return { name: 'EventIndia', id: 'eventindia' };
    if (s.includes('devfest') || s.includes('devfest chennai')) return { name: 'DevFest Chennai', id: 'devfest-chennai' };
    if (s.includes('gdg') || s.includes('gdg chennai')) return { name: 'GDG Chennai', id: 'gdg-chennai' };
    if (s.includes('bengaluru tech week') || s.includes('tech week')) return { name: 'Bengaluru Tech Week', id: 'bengaluru-tech-week' };
    if (item.source && item.source.includes('AI')) return { name: 'AI Crawler', id: 'ai' };
    return null;
  }
</script>

<article class="hackathon-card" class:bookmarked={hackathon.bookmarked} class:is-new={hackathon.isNew}>
  <!-- Card Header -->
  <div class="card-header">
    <div class="badges-row">
      {#if platformInfo}
        <span class="platform-badge platform-{platformInfo.id}" title="Scraped from {platformInfo.name}">
          <Icon name="globe" size={10} />
          <span>{platformInfo.name}</span>
        </span>
      {:else if hackathon.isNew || (hackathon.source && hackathon.source.includes('AI'))}
        <span class="badge badge-ai-source" title="Discovered autonomously by AI Scout Agent">
          <Icon name="bot" size={11} />
          <span>AI Scout</span>
        </span>
      {/if}

      <span class="badge {getCategoryClass(hackathon.category)}">
        {hackathon.category}
      </span>

      <span class="mode-badge">
        <Icon name={hackathon.mode === 'Online' ? 'globe' : 'map-pin'} size={11} />
        <span>{hackathon.mode}</span>
      </span>
    </div>

    <!-- Bookmark Button -->
    <button
      class="bookmark-btn"
      class:is-active={hackathon.bookmarked}
      on:click={handleBookmarkToggle}
      aria-label={hackathon.bookmarked ? "Remove bookmark" : "Bookmark event"}
      title={hackathon.bookmarked ? "Remove bookmark" : "Bookmark this event"}
    >
      <Icon name="star" size={16} filled={hackathon.bookmarked} />
    </button>
  </div>

  <!-- Card Body: Title & Organizer -->
  <div class="card-body">
    <h3 class="hackathon-title" title={hackathon.title}>
      <button
        type="button"
        class="title-btn"
        on:click={() => dispatch('viewDetails', hackathon)}
      >
        {hackathon.title}
      </button>
    </h3>

    <div class="organizer-row">
      <span class="organizer-name">by {hackathon.organizer || "Community Host"}</span>
      {#if hackathon.prizePool}
        <span class="prize-pill">🏆 {hackathon.prizePool}</span>
      {/if}
    </div>

    {#if hackathon.description}
      <p class="hackathon-desc">
        {hackathon.description}
      </p>
    {/if}

    <!-- Meta Details Grid -->
    <div class="meta-details">
      <!-- Deadline Section -->
      <div class="meta-item">
        <div class="meta-label">
          <Icon name="clock" size={12} />
          <span>Registration Deadline</span>
        </div>
        <div class="meta-value-row">
          <span class="date-text">{formatDisplayDate(hackathon.registrationDeadline)}</span>
          <span class="badge {deadlineInfo.statusClass}">
            {deadlineInfo.label}
          </span>
        </div>
      </div>

      <!-- Event Dates Section -->
      <div class="meta-item">
        <div class="meta-label">
          <Icon name="calendar" size={12} />
          <span>Event Schedule</span>
        </div>
        <span class="date-text text-secondary">
          {formatDateRange(hackathon.eventStartDate, hackathon.eventEndDate)}
        </span>
      </div>

      <!-- Location if available -->
      {#if hackathon.location}
        <div class="meta-item">
          <div class="meta-label">
            <Icon name="map-pin" size={12} />
            <span>Venue / Location</span>
          </div>
          <span class="date-text text-secondary loc-truncate">{hackathon.location}</span>
        </div>
      {/if}
    </div>
  </div>

  <!-- Card Footer: Status Selector & Actions -->
  <div class="card-footer">
    <!-- Status Selector -->
    <div class="status-control">
      <label for="status-{hackathon.id}" class="sr-only">Registration Status</label>
      <select
        id="status-{hackathon.id}"
        class="status-select {getStatusClass(hackathon.status)}"
        value={hackathon.status}
        on:change={handleStatusChange}
        title="Change registration status"
      >
        {#each FORM_STATUSES as st}
          <option value={st}>{st}</option>
        {/each}
      </select>
    </div>

    <!-- Actions -->
    <div class="card-actions">
      <a
        href={getVerifiedEventUrl(hackathon)}
        target="_blank"
        rel="noopener noreferrer"
        class="btn-icon"
        title={`Open Official Registration (${hackathon.platformName || 'Platform'})`}
      >
        <Icon name="external-link" size={14} />
      </a>

      <button
        class="btn-icon"
        on:click={() => dispatch('viewDetails', hackathon)}
        title="View Full Details"
      >
        <Icon name="eye" size={14} />
      </button>

      <button
        class="btn-icon"
        on:click={() => dispatch('edit', hackathon)}
        title="Edit Item"
      >
        <Icon name="edit" size={14} />
      </button>

      <button
        class="btn-icon btn-icon-danger"
        on:click={() => dispatch('delete', hackathon)}
        title="Delete Item"
      >
        <Icon name="trash" size={14} />
      </button>
    </div>
  </div>
</article>

<style>
  .hackathon-card {
    background-color: var(--bg-surface);
    border: 1px solid var(--border-medium);
    border-radius: var(--radius-lg);
    display: flex;
    flex-direction: column;
    box-shadow: var(--shadow-sm);
    transition: all var(--transition-fast);
    overflow: hidden;
    position: relative;
  }

  .hackathon-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    border-color: var(--border-focus);
  }

  .hackathon-card.bookmarked {
    border-left: 3px solid #f59e0b;
  }

  .hackathon-card.is-new {
    border-top: 2px solid #10b981;
  }

  /* Header */
  .card-header {
    padding: 0.875rem 1rem 0.375rem 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .badges-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.375rem;
  }

  .badge-ai-source {
    background: rgba(139, 92, 246, 0.12);
    color: #a78bfa;
    border: 1px solid rgba(139, 92, 246, 0.25);
    font-weight: 700;
  }

  .mode-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.6875rem;
    font-weight: 600;
    padding: 0.15rem 0.45rem;
    border-radius: var(--radius-full);
    background-color: var(--bg-surface-hover);
    color: var(--text-secondary);
    border: 1px solid var(--border-subtle);
  }

  .bookmark-btn {
    color: var(--text-muted);
    padding: 0.3rem;
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition-fast);
  }

  .bookmark-btn:hover {
    color: #f59e0b;
    background-color: rgba(245, 158, 11, 0.12);
    transform: scale(1.1);
  }

  .bookmark-btn.is-active {
    color: #f59e0b;
  }

  /* Body */
  .card-body {
    padding: 0.375rem 1rem 0.875rem 1rem;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .hackathon-title {
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.35;
    margin-bottom: 0.25rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .title-btn {
    text-align: left;
    padding: 0;
    margin: 0;
    font-size: inherit;
    font-weight: inherit;
    color: var(--text-primary);
    line-height: inherit;
    display: inline;
    cursor: pointer;
    transition: color var(--transition-fast);
  }

  .title-btn:hover {
    color: var(--primary-500);
  }

  .organizer-row {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-bottom: 0.625rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .organizer-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .prize-pill {
    font-size: 0.6875rem;
    font-weight: 700;
    color: #f59e0b;
    background: rgba(245, 158, 11, 0.12);
    padding: 0.1rem 0.4rem;
    border-radius: var(--radius-xs);
    border: 1px solid rgba(245, 158, 11, 0.25);
    white-space: nowrap;
  }

  .hackathon-desc {
    font-size: 0.8125rem;
    color: var(--text-secondary);
    line-height: 1.45;
    margin-bottom: 0.75rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* Meta details */
  .meta-details {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    background-color: var(--bg-surface-hover);
    padding: 0.625rem 0.75rem;
    border-radius: var(--radius-md);
    border: 1px solid var(--border-subtle);
  }

  :global([data-theme="dark"]) .meta-details {
    background-color: #090d16;
    border-color: rgba(255, 255, 255, 0.05);
  }

  .meta-item {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .meta-label {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.6875rem;
    font-weight: 700;
    color: var(--text-muted);
    letter-spacing: 0.02em;
  }

  .meta-value-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  .date-text {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-primary);
    font-feature-settings: "tnum";
  }

  .text-secondary {
    color: var(--text-secondary);
    font-weight: 500;
  }

  .loc-truncate {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Footer */
  .card-footer {
    padding: 0.625rem 1rem;
    border-top: 1px solid var(--border-medium);
    background-color: var(--bg-surface);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .status-control {
    flex: 1;
    max-width: 130px;
  }

  .status-select {
    padding: 0.25rem 0.5rem;
    font-size: 0.6875rem;
    font-weight: 700;
    border-radius: var(--radius-full);
    cursor: pointer;
    text-align: center;
    border: 1px solid transparent;
  }

  .card-actions {
    display: flex;
    align-items: center;
    gap: 0.15rem;
  }

  .btn-icon {
    padding: 0.35rem;
    border-radius: var(--radius-xs);
    color: var(--text-secondary);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    transition: all var(--transition-fast);
  }

  .btn-icon:hover {
    background-color: var(--bg-surface-hover);
    color: var(--text-primary);
  }

  .btn-icon-danger:hover {
    background-color: rgba(239, 68, 68, 0.12);
    color: #ef4444;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
  }
</style>
