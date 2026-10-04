<script>
  import { createEventDispatcher } from 'svelte';
  import { hackathons } from '../stores/hackathons.js';
  import { toasts } from '../stores/toast.js';
  import { formatDisplayDate, formatDateRange, getDeadlineStatus } from '../utils/dateUtils.js';
  import { FORM_STATUSES } from '../data/sampleHackathons.js';
  import { getVerifiedEventUrl, getPlatformPortalUrl } from '../utils/urlHelper.js';
  import Icon from './Icon.svelte';

  export let hackathon;

  const dispatch = createEventDispatcher();

  $: currentHackathon = $hackathons.find(h => h.id === hackathon?.id) || hackathon;
  $: deadlineInfo = getDeadlineStatus(currentHackathon?.registrationDeadline);

  function handleBookmarkToggle() {
    hackathons.toggleBookmark(currentHackathon.id);
    if (!currentHackathon.bookmarked) {
      toasts.success(`Bookmarked "${currentHackathon.title}"`);
    } else {
      toasts.info(`Removed bookmark`);
    }
  }

  function handleStatusChange(e) {
    const newStatus = e.target.value;
    hackathons.updateStatus(currentHackathon.id, newStatus);
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

  $: platformInfo = getPlatformInfo(currentHackathon);

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

  function handleKeydown(e) {
    if (e.key === 'Escape') {
      dispatch('close');
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if currentHackathon}
  <div
    class="modal-backdrop"
    on:click|self={() => dispatch('close')}
    on:keydown={handleKeydown}
    role="presentation"
  >
    <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="details-title">
      <!-- Modal Header -->
      <div class="modal-header">
        <div class="header-badges">
          {#if platformInfo}
            <span class="platform-badge platform-{platformInfo.id}" title="Scraped from {platformInfo.name}">
              <Icon name="globe" size={11} />
              <span>{platformInfo.name}</span>
            </span>
          {/if}
          <span class="badge {getCategoryClass(currentHackathon.category)}">
            {currentHackathon.category}
          </span>
          <span class="badge badge-neutral">
            <Icon name={currentHackathon.mode === 'Online' ? 'globe' : 'map-pin'} size={12} />
            <span>{currentHackathon.mode}</span>
          </span>
        </div>

        <div class="header-actions">
          <button
            class="icon-btn"
            class:bookmarked={currentHackathon.bookmarked}
            on:click={handleBookmarkToggle}
            title={currentHackathon.bookmarked ? 'Remove bookmark' : 'Bookmark'}
          >
            <Icon name="star" size={18} filled={currentHackathon.bookmarked} />
          </button>
          <button class="icon-btn" on:click={() => dispatch('close')} aria-label="Close dialog">
            <Icon name="x" size={18} />
          </button>
        </div>
      </div>

      <!-- Modal Body -->
      <div class="details-body">
        <h2 id="details-title" class="details-title">
          {currentHackathon.title}
        </h2>
        <p class="details-organizer">Organized by <strong>{currentHackathon.organizer}</strong></p>

        <!-- Information Cards Grid -->
        <div class="info-grid">
          <!-- Deadline Card -->
          <div class="info-box">
            <div class="info-box-header">
              <Icon name="clock" size={15} />
              <span>Registration Deadline</span>
            </div>
            <p class="info-date">{formatDisplayDate(currentHackathon.registrationDeadline)}</p>
            <span class="badge {deadlineInfo.statusClass}">
              {deadlineInfo.label}
            </span>
          </div>

          <!-- Event Dates Card -->
          <div class="info-box">
            <div class="info-box-header">
              <Icon name="calendar" size={15} />
              <span>Event Schedule</span>
            </div>
            <p class="info-date">
              {formatDateRange(currentHackathon.eventStartDate, currentHackathon.eventEndDate)}
            </p>
          </div>

          <!-- Location Card -->
          <div class="info-box">
            <div class="info-box-header">
              <Icon name="map-pin" size={15} />
              <span>Venue / Location</span>
            </div>
            <p class="info-value">{currentHackathon.location || (currentHackathon.mode === 'Online' ? 'Online / Virtual' : 'To be confirmed')}</p>
          </div>

          <!-- Status Card -->
          <div class="info-box">
            <div class="info-box-header">
              <Icon name="sparkles" size={15} />
              <span>My Registration Status</span>
            </div>
            <select
              class="status-select-lg"
              value={currentHackathon.status}
              on:change={handleStatusChange}
            >
              {#each FORM_STATUSES as st}
                <option value={st}>{st}</option>
              {/each}
            </select>
          </div>
        </div>

        <!-- Description Section -->
        {#if currentHackathon.description}
          <div class="desc-section">
            <h4 class="section-title">About this Opportunity</h4>
            <p class="desc-text">{currentHackathon.description}</p>
          </div>
        {/if}

        <!-- Prize Pool & Scraper Source Badge Row -->
        {#if currentHackathon.prizePool || platformInfo || currentHackathon.source}
          <div class="meta-highlight-row">
            {#if currentHackathon.prizePool}
              <div class="highlight-item">
                <span class="hl-label">🏆 Total Prize Pool</span>
                <strong class="hl-value hl-prize">{currentHackathon.prizePool}</strong>
              </div>
            {/if}
            {#if platformInfo || currentHackathon.source}
              <div class="highlight-item">
                <span class="hl-label">🌐 Scraped Platform</span>
                <span class="hl-value">
                  {#if platformInfo}
                    <span class="platform-badge platform-{platformInfo.id}">
                      <Icon name="globe" size={10} />
                      <span>{platformInfo.name}</span>
                    </span>
                  {:else}
                    {currentHackathon.source}
                  {/if}
                </span>
              </div>
            {/if}
          </div>
        {/if}

        <!-- Registration Link Section -->
        <div class="url-section">
          <h4 class="section-title">Official Link</h4>
          <a
            href={getVerifiedEventUrl(currentHackathon)}
            target="_blank"
            rel="noopener noreferrer"
            class="reg-url-link"
          >
            <span>{getVerifiedEventUrl(currentHackathon)}</span>
            <Icon name="external-link" size={14} />
          </a>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="modal-footer">
        <div class="footer-left">
          <button
            class="btn-danger-outline"
            on:click={() => {
              dispatch('close');
              dispatch('delete', currentHackathon);
            }}
          >
            <Icon name="trash" size={15} />
            <span>Delete</span>
          </button>
        </div>

        <div class="footer-right">
          <button
            class="btn-secondary"
            on:click={() => {
              dispatch('close');
              dispatch('edit', currentHackathon);
            }}
          >
            <Icon name="edit" size={15} />
            <span>Edit</span>
          </button>

          <a
            href={getVerifiedEventUrl(currentHackathon)}
            target="_blank"
            rel="noopener noreferrer"
            class="btn-primary"
          >
            <Icon name="external-link" size={15} />
            <span>{currentHackathon.platformName ? `Register on ${currentHackathon.platformName}` : 'Official Registration'}</span>
          </a>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-header {
    padding: 1.25rem 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--border-subtle);
  }

  .header-badges {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .icon-btn {
    padding: 0.375rem;
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .icon-btn:hover {
    background-color: var(--bg-surface-hover);
    color: var(--text-primary);
  }

  .icon-btn.bookmarked {
    color: #f59e0b;
  }

  .details-body {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .details-title {
    font-size: 1.35rem;
    font-weight: 800;
    color: var(--text-primary);
    line-height: 1.3;
  }

  .details-organizer {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-top: -0.5rem;
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.875rem;
  }

  .info-box {
    background-color: var(--bg-primary);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: 0.875rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .info-box-header {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .info-date,
  .info-value {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .status-select-lg {
    padding: 0.375rem 0.625rem;
    font-size: 0.8125rem;
    font-weight: 600;
    border-radius: var(--radius-sm);
    background-color: var(--bg-surface);
  }

  .section-title {
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 0.375rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .meta-highlight-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
    background-color: var(--bg-primary);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: 0.75rem 1rem;
  }

  .highlight-item {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .hl-label {
    font-size: 0.6875rem;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .hl-value {
    font-size: 0.875rem;
    color: var(--text-primary);
  }

  .hl-prize {
    color: #f59e0b;
    font-weight: 800;
  }

  .desc-text {
    font-size: 0.9375rem;
    color: var(--text-secondary);
    line-height: 1.6;
    white-space: pre-line;
  }

  .reg-url-link {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    color: var(--primary-600);
    font-weight: 600;
    font-size: 0.875rem;
    text-decoration: underline;
    word-break: break-all;
  }

  .reg-url-link:hover {
    color: var(--primary-700);
  }

  .modal-footer {
    padding: 1.125rem 1.5rem;
    border-top: 1px solid var(--border-subtle);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .footer-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .btn-danger-outline {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 0.875rem;
    border-radius: var(--radius-md);
    color: #dc2626;
    border: 1px solid #fecaca;
    background: transparent;
    font-weight: 600;
  }

  .btn-danger-outline:hover {
    background-color: #fee2e2;
  }

  @media (max-width: 600px) {
    .info-grid {
      grid-template-columns: 1fr;
    }

    .modal-footer {
      flex-direction: column;
      align-items: stretch;
    }

    .footer-right {
      justify-content: flex-end;
    }
  }
</style>
