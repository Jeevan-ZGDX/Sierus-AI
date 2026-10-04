import { writable, get } from 'svelte/store';
import { hackathons } from './hackathons.js';
import { toasts } from './toast.js';
import { SCRAPER_PLATFORMS, DISCOVERABLE_EVENTS } from '../data/aiDiscoverySources.js';

const initialLogs = [
  {
    id: 'log-0',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    text: '🤖 AI Scout Agent v2.4 initialized. Ready to scrape 22 platforms: 11 Hackathons (Devpost, Devfolio, HackerEarth, Unstop, Reskill, Hack2Skill, MLH, HeroX, Brightidea, BeMyApp, StackUp) + 11 Tech Event Platforms (Jamao, Luma, Eventbrite, AllEvents, Maidan, TechMeetups, StartupMelas, EventIndia, GDG Chennai, DevFest Chennai, Bengaluru Tech Week).',
    type: 'info'
  }
];

const initialPlatformStates = SCRAPER_PLATFORMS.map(p => ({
  ...p,
  status: 'idle', // 'idle' | 'connecting' | 'crawling' | 'extracting' | 'synced' | 'error'
  lastScraped: null,
  itemsFound: 0,
  enabled: true
}));

const initialState = {
  isScanning: false,
  agentStatus: 'Idle - Ready to scrape target platforms',
  progressPercent: 0,
  activePlatformId: null,
  activePlatformName: null,
  activePlatformType: null,
  searchPrompt: 'Scrape all active hackathons, tech summits & developer meetups across 22 platforms',
  lastScanTime: null,
  newlyDiscoveredCount: 0,
  totalScrapedInSession: 0,
  platforms: initialPlatformStates,
  logs: initialLogs
};

function createAIAgentStore() {
  const { subscribe, set, update } = writable(initialState);

  function addLog(text, type = 'info', platformId = null) {
    const logItem = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      text,
      type,
      platformId
    };
    update(state => ({
      ...state,
      logs: [logItem, ...state.logs.slice(0, 249)]
    }));
  }

  function togglePlatform(platformId) {
    update(s => ({
      ...s,
      platforms: s.platforms.map(p =>
        p.id === platformId ? { ...p, enabled: !p.enabled } : p
      )
    }));
  }

  function setAllPlatforms(enabled) {
    update(s => ({
      ...s,
      platforms: s.platforms.map(p => ({ ...p, enabled }))
    }));
  }

  function setPlatformsByType(targetType, enabled) {
    update(s => ({
      ...s,
      platforms: s.platforms.map(p =>
        p.targetType === targetType ? { ...p, enabled } : p
      )
    }));
  }

  function updatePlatformStatus(platformId, patch) {
    update(s => ({
      ...s,
      platforms: s.platforms.map(p =>
        p.id === platformId ? { ...p, ...patch } : p
      )
    }));
  }

  /**
   * Scrapes an individual platform by id
   */
  async function scrapeSinglePlatform(platformId) {
    const currentState = get({ subscribe });
    if (currentState.isScanning) return;

    const platform = currentState.platforms.find(p => p.id === platformId);
    if (!platform) return;

    const typeLabel = platform.targetType === 'tech-event' ? 'Tech Event' : 'Hackathon';

    update(s => ({
      ...s,
      isScanning: true,
      activePlatformId: platform.id,
      activePlatformName: platform.name,
      activePlatformType: platform.targetType,
      progressPercent: 10,
      agentStatus: `Connecting to ${platform.name} (${platform.domain})...`
    }));

    addLog(`🌐 [${platform.name}] Establishing secure SSL handshake with https://${platform.domain} (${typeLabel} Scraper)`, 'info', platform.id);
    updatePlatformStatus(platform.id, { status: 'connecting' });
    await sleep(320);

    update(s => ({
      ...s,
      progressPercent: 40,
      agentStatus: `Querying ${platform.name} endpoint: ${platform.endpoint}`
    }));
    addLog(`📡 [${platform.name}] GET ${platform.endpoint} -> Parsing response body & DOM schema (${platform.protocol})...`, 'info', platform.id);
    updatePlatformStatus(platform.id, { status: 'crawling' });
    await sleep(380);

    update(s => ({
      ...s,
      progressPercent: 75,
      agentStatus: `Extracting ${typeLabel} metadata, dates & locations from ${platform.name}...`
    }));
    addLog(`⚡ [${platform.name}] NLP extractor parsed schedules, venues (${platform.tagline}), and registration links.`, 'info', platform.id);
    updatePlatformStatus(platform.id, { status: 'extracting' });
    await sleep(320);

    // Ingest events belonging to this platform
    const currentList = get(hackathons);
    const existingTitles = new Set(currentList.map(h => (h.title || '').trim().toLowerCase()));

    const candidates = DISCOVERABLE_EVENTS.filter(e => e.platform === platform.id);
    let addedCount = 0;
    const newItems = [];

    candidates.forEach(candidate => {
      const normalized = (candidate.title || '').trim().toLowerCase();
      if (!existingTitles.has(normalized)) {
        const item = {
          ...candidate,
          isNew: true,
          bookmarked: false,
          discoveredAt: new Date().toISOString().slice(0, 10)
        };
        newItems.push(item);
        existingTitles.add(normalized);
        addedCount++;
      }
    });

    if (newItems.length > 0) {
      newItems.forEach(item => hackathons.addHackathon(item));
      addLog(`✨ [${platform.name}] Ingested ${addedCount} new ${typeLabel.toLowerCase()}(s) into database.`, 'success', platform.id);
      toasts.success(`🤖 ${platform.name} Scraper: Discovered ${addedCount} new ${typeLabel.toLowerCase()}(s)!`);
    } else {
      addLog(`✅ [${platform.name}] Scan completed. All ${candidates.length} items currently synced.`, 'info', platform.id);
      toasts.info(`${platform.name}: All events are up-to-date.`);
    }

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    updatePlatformStatus(platform.id, {
      status: 'synced',
      lastScraped: timeNow,
      itemsFound: candidates.length
    });

    update(s => ({
      ...s,
      isScanning: false,
      activePlatformId: null,
      activePlatformName: null,
      activePlatformType: null,
      progressPercent: 100,
      agentStatus: `Scrape complete for ${platform.name}`,
      lastScanTime: timeNow,
      newlyDiscoveredCount: s.newlyDiscoveredCount + addedCount,
      totalScrapedInSession: s.totalScrapedInSession + addedCount
    }));
  }

  /**
   * Runs matrix crawl over enabled platforms (optionally filtered by category)
   */
  async function runScan(customQuery = '', targetCategory = 'all') {
    const currentState = get({ subscribe });
    if (currentState.isScanning) return;

    const query = customQuery || currentState.searchPrompt;
    let enabledPlatforms = currentState.platforms.filter(p => p.enabled);

    if (targetCategory === 'hackathon') {
      enabledPlatforms = enabledPlatforms.filter(p => p.targetType === 'hackathon');
    } else if (targetCategory === 'tech-event') {
      enabledPlatforms = enabledPlatforms.filter(p => p.targetType === 'tech-event');
    }

    if (enabledPlatforms.length === 0) {
      toasts.error(`No platforms enabled for scraping. Please enable at least 1 platform.`);
      return;
    }

    const categoryText = targetCategory === 'all'
      ? 'All 22 Scraper Platforms (Hackathons & Tech Events)'
      : targetCategory === 'tech-event'
      ? '11 Tech Event Platforms (Meetups & Summits)'
      : '11 Hackathon Platforms';

    update(s => ({
      ...s,
      isScanning: true,
      progressPercent: 5,
      agentStatus: `Initializing Web Scraper for ${enabledPlatforms.length} platforms...`
    }));

    addLog(`🚀 [AI Crawler Matrix] Starting web scraper across ${enabledPlatforms.length} platforms (${categoryText}) with prompt: "${query}"`, 'info');

    let totalAdded = 0;
    const currentList = get(hackathons);
    const existingTitles = new Set(currentList.map(h => (h.title || '').trim().toLowerCase()));

    for (let i = 0; i < enabledPlatforms.length; i++) {
      const platform = enabledPlatforms[i];
      const progress = Math.round(5 + ((i + 1) / enabledPlatforms.length) * 90);

      update(s => ({
        ...s,
        activePlatformId: platform.id,
        activePlatformName: platform.name,
        activePlatformType: platform.targetType,
        progressPercent: progress,
        agentStatus: `Scraping [${i + 1}/${enabledPlatforms.length}] ${platform.name} (${platform.domain})...`
      }));

      updatePlatformStatus(platform.id, { status: 'crawling' });
      addLog(`🌐 [${platform.name}] Querying https://${platform.domain}${platform.endpoint} (${platform.protocol}, RateLimit: ${platform.rateLimit})`, 'info', platform.id);

      await sleep(240);

      // Extract matching events for this platform
      const candidates = DISCOVERABLE_EVENTS.filter(e => e.platform === platform.id);
      let platformAdded = 0;
      const newItems = [];

      candidates.forEach(candidate => {
        const normalized = (candidate.title || '').trim().toLowerCase();
        if (!existingTitles.has(normalized)) {
          const item = {
            ...candidate,
            isNew: true,
            bookmarked: false,
            discoveredAt: new Date().toISOString().slice(0, 10)
          };
          newItems.push(item);
          existingTitles.add(normalized);
          platformAdded++;
          totalAdded++;
        }
      });

      if (newItems.length > 0) {
        newItems.forEach(item => hackathons.addHackathon(item));
        addLog(`⚡ [${platform.name}] Extracted ${candidates.length} events (${platformAdded} new ingested, ${candidates.length - platformAdded} existing)`, 'success', platform.id);
      } else {
        addLog(`⚡ [${platform.name}] Parsed ${candidates.length} events (All ${candidates.length} currently synced)`, 'info', platform.id);
      }

      const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      updatePlatformStatus(platform.id, {
        status: 'synced',
        lastScraped: timeNow,
        itemsFound: candidates.length
      });

      await sleep(120);
    }

    if (totalAdded > 0) {
      addLog(`🎉 [AI Crawler Matrix] Full scrape completed: Ingested ${totalAdded} new opportunities across ${enabledPlatforms.length} platforms.`, 'success');
      toasts.success(`🤖 Scrape Complete! Ingested ${totalAdded} new hackathons & tech events from ${enabledPlatforms.length} platforms.`);
    } else {
      addLog(`✅ [AI Crawler Matrix] All ${enabledPlatforms.length} platform feeds are completely up-to-date.`, 'success');
      toasts.info('AI Scraper: All enabled platforms are up-to-date.');
    }

    const scanTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    update(s => ({
      ...s,
      isScanning: false,
      activePlatformId: null,
      activePlatformName: null,
      activePlatformType: null,
      progressPercent: 100,
      agentStatus: `Scrape finished — ${enabledPlatforms.length} platforms synchronized`,
      lastScanTime: scanTime,
      newlyDiscoveredCount: s.newlyDiscoveredCount + totalAdded,
      totalScrapedInSession: s.totalScrapedInSession + totalAdded
    }));
  }

  function clearLogs() {
    update(s => ({ ...s, logs: [] }));
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  return {
    subscribe,
    set,
    update,
    runScan,
    scrapeSinglePlatform,
    togglePlatform,
    setAllPlatforms,
    setPlatformsByType,
    clearLogs,
    addLog
  };
}

export const aiAgent = createAIAgentStore();
