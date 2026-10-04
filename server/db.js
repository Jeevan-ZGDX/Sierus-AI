/**
 * SQLite Database Manager for Hackathon Tracker
 * Built with native Node.js SQLite (node:sqlite)
 * 
 * Provides relational schema, transactions, migrations,
 * and high-performance querying for hackathons, tech events,
 * scraping sources, and telemetry logs.
 */

import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, '..', 'data');
const DB_FILE = join(DATA_DIR, 'hackathons.db');

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize SQLite Database instance
export const db = new DatabaseSync(DB_FILE);

/**
 * Initialize Schema, Tables, and Indexes
 */
export function initDatabase() {
  // Enable WAL mode (Write-Ahead Logging) and Foreign Keys for peak performance
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    PRAGMA foreign_keys = ON;

    -- Hackathons & Tech Events Table
    CREATE TABLE IF NOT EXISTS hackathons (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'hackathon', -- 'hackathon' | 'tech-event'
      description TEXT,
      organizer TEXT,
      category TEXT NOT NULL,
      mode TEXT NOT NULL DEFAULT 'Online', -- 'Online' | 'Offline' | 'Hybrid'
      location TEXT,
      city TEXT,
      country TEXT,
      registration_deadline TEXT NOT NULL,
      event_start_date TEXT NOT NULL,
      event_end_date TEXT NOT NULL,
      registration_url TEXT,
      status TEXT NOT NULL DEFAULT 'Not Registered', -- 'Not Registered' | 'Registered' | 'Participating' | 'Completed'
      bookmarked INTEGER NOT NULL DEFAULT 0,
      platform TEXT,
      platform_name TEXT,
      source TEXT,
      discovered_at TEXT,
      prize_pool TEXT,
      event_type TEXT,
      is_new INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Indexes for high-speed filtering
    CREATE INDEX IF NOT EXISTS idx_hackathons_status ON hackathons(status);
    CREATE INDEX IF NOT EXISTS idx_hackathons_category ON hackathons(category);
    CREATE INDEX IF NOT EXISTS idx_hackathons_mode ON hackathons(mode);
    CREATE INDEX IF NOT EXISTS idx_hackathons_type ON hackathons(type);
    CREATE INDEX IF NOT EXISTS idx_hackathons_platform ON hackathons(platform);
    CREATE INDEX IF NOT EXISTS idx_hackathons_deadline ON hackathons(registration_deadline);
    CREATE INDEX IF NOT EXISTS idx_hackathons_city ON hackathons(city);

    -- Scraper Platforms Table
    CREATE TABLE IF NOT EXISTS scraper_sources (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      domain TEXT NOT NULL,
      base_url TEXT,
      endpoint TEXT,
      category TEXT,
      target_type TEXT NOT NULL DEFAULT 'hackathon',
      tagline TEXT,
      color TEXT,
      rate_limit TEXT,
      protocol TEXT,
      enabled INTEGER NOT NULL DEFAULT 1,
      last_scraped TEXT,
      items_found INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'idle',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Crawler Telemetry Logs Table
    CREATE TABLE IF NOT EXISTS crawler_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      text TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info',
      platform_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Metadata & Settings Table
    CREATE TABLE IF NOT EXISTS db_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Record initialization timestamp
  const setInitMeta = db.prepare(`
    INSERT INTO db_meta (key, value) VALUES ('initialized_at', datetime('now'))
    ON CONFLICT(key) DO UPDATE SET updated_at = datetime('now');
  `);
  setInitMeta.run();
}

/**
 * Format a database row into standard JS camelCase object
 */
function rowToHackathon(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    type: row.type || 'hackathon',
    description: row.description || '',
    organizer: row.organizer || '',
    category: row.category,
    mode: row.mode,
    location: row.location || '',
    city: row.city || '',
    country: row.country || '',
    registrationDeadline: row.registration_deadline,
    eventStartDate: row.event_start_date,
    eventEndDate: row.event_end_date,
    registrationUrl: row.registration_url || '',
    status: row.status,
    bookmarked: Boolean(row.bookmarked),
    platform: row.platform || null,
    platformName: row.platform_name || null,
    source: row.source || '',
    discoveredAt: row.discovered_at || null,
    prizePool: row.prize_pool || null,
    eventType: row.event_type || null,
    isNew: Boolean(row.is_new),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/**
 * Get all hackathons with optional filtering
 */
export function getAllHackathons(filters = {}) {
  let query = 'SELECT * FROM hackathons WHERE 1=1';
  const params = [];

  const isValidParam = (v) => v !== undefined && v !== null && v !== '' && v !== 'undefined' && v !== 'null';

  if (isValidParam(filters.type) && filters.type !== 'all') {
    query += ' AND type = ?';
    params.push(String(filters.type));
  }

  if (isValidParam(filters.category) && filters.category !== 'All') {
    query += ' AND category = ?';
    params.push(String(filters.category));
  }

  if (isValidParam(filters.mode) && filters.mode !== 'All') {
    query += ' AND mode = ?';
    params.push(String(filters.mode));
  }

  if (isValidParam(filters.status) && filters.status !== 'All') {
    query += ' AND status = ?';
    params.push(String(filters.status));
  }

  if (isValidParam(filters.platform) && filters.platform !== 'all') {
    query += ' AND platform = ?';
    params.push(String(filters.platform));
  }

  if (filters.bookmarked === 'true' || filters.bookmarked === true || filters.bookmarked === 1 || filters.bookmarked === '1') {
    query += ' AND bookmarked = 1';
  }

  if (isValidParam(filters.q) && String(filters.q).trim()) {
    query += ` AND (
      LOWER(title) LIKE ? OR
      LOWER(organizer) LIKE ? OR
      LOWER(category) LIKE ? OR
      LOWER(location) LIKE ? OR
      LOWER(city) LIKE ?
    )`;
    const searchParam = `%${String(filters.q).toLowerCase().trim()}%`;
    params.push(searchParam, searchParam, searchParam, searchParam, searchParam);
  }

  // Sorting
  switch (filters.sortBy) {
    case 'deadline-asc':
      query += ' ORDER BY registration_deadline ASC';
      break;
    case 'deadline-desc':
      query += ' ORDER BY registration_deadline DESC';
      break;
    case 'title-asc':
      query += ' ORDER BY title COLLATE NOCASE ASC';
      break;
    case 'start-date':
      query += ' ORDER BY event_start_date ASC';
      break;
    default:
      query += ' ORDER BY registration_deadline ASC';
      break;
  }

  const stmt = db.prepare(query);
  const rows = stmt.all(...params);
  return rows.map(rowToHackathon);
}

/**
 * Get single hackathon by ID
 */
export function getHackathonById(id) {
  const stmt = db.prepare('SELECT * FROM hackathons WHERE id = ?');
  const row = stmt.get(id);
  return rowToHackathon(row);
}

/**
 * Insert or replace hackathon
 */
export function insertHackathon(item) {
  const stmt = db.prepare(`
    INSERT INTO hackathons (
      id, title, type, description, organizer, category, mode,
      location, city, country, registration_deadline, event_start_date,
      event_end_date, registration_url, status, bookmarked,
      platform, platform_name, source, discovered_at, prize_pool,
      event_type, is_new, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, datetime('now'), datetime('now')
    )
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      type = excluded.type,
      description = excluded.description,
      organizer = excluded.organizer,
      category = excluded.category,
      mode = excluded.mode,
      location = excluded.location,
      city = excluded.city,
      country = excluded.country,
      registration_deadline = excluded.registration_deadline,
      event_start_date = excluded.event_start_date,
      event_end_date = excluded.event_end_date,
      registration_url = excluded.registration_url,
      status = excluded.status,
      bookmarked = excluded.bookmarked,
      platform = excluded.platform,
      platform_name = excluded.platform_name,
      source = excluded.source,
      prize_pool = excluded.prize_pool,
      event_type = excluded.event_type,
      updated_at = datetime('now')
  `);

  stmt.run(
    item.id,
    item.title,
    item.type || 'hackathon',
    item.description || '',
    item.organizer || '',
    item.category || 'Other',
    item.mode || 'Online',
    item.location || '',
    item.city || '',
    item.country || '',
    item.registrationDeadline,
    item.eventStartDate,
    item.eventEndDate,
    item.registrationUrl || '',
    item.status || 'Not Registered',
    item.bookmarked ? 1 : 0,
    item.platform || null,
    item.platformName || null,
    item.source || '',
    item.discoveredAt || null,
    item.prizePool || null,
    item.eventType || null,
    item.isNew ? 1 : 0
  );

  return getHackathonById(item.id);
}

/**
 * Update existing hackathon
 */
export function updateHackathon(id, data) {
  const existing = getHackathonById(id);
  if (!existing) return null;

  const merged = { ...existing, ...data, id };
  return insertHackathon(merged);
}

/**
 * Delete hackathon
 */
export function deleteHackathon(id) {
  const stmt = db.prepare('DELETE FROM hackathons WHERE id = ?');
  stmt.run(id);
  return { success: true, id };
}

/**
 * Update registration status
 */
export function updateHackathonStatus(id, newStatus) {
  const stmt = db.prepare(`
    UPDATE hackathons
    SET status = ?, updated_at = datetime('now')
    WHERE id = ?
  `);
  stmt.run(newStatus, id);
  return getHackathonById(id);
}

/**
 * Toggle bookmark
 */
export function toggleHackathonBookmark(id) {
  const existing = getHackathonById(id);
  if (!existing) return null;

  const newBookmarked = existing.bookmarked ? 0 : 1;
  const stmt = db.prepare(`
    UPDATE hackathons
    SET bookmarked = ?, updated_at = datetime('now')
    WHERE id = ?
  `);
  stmt.run(newBookmarked, id);
  return getHackathonById(id);
}

/**
 * Mark all as seen (clear is_new flag)
 */
export function markAllSeen() {
  const stmt = db.prepare("UPDATE hackathons SET is_new = 0 WHERE is_new = 1");
  stmt.run();
  return { success: true };
}

/**
 * Bulk seed hackathons into database
 */
export function seedHackathons(items) {
  db.exec('BEGIN TRANSACTION;');
  try {
    for (const item of items) {
      insertHackathon(item);
    }
    db.exec('COMMIT;');
    return { success: true, count: items.length };
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

/**
 * Reset hackathons table and reseed with initial data
 */
export function resetHackathons(initialItems) {
  db.exec('BEGIN TRANSACTION;');
  try {
    db.exec('DELETE FROM hackathons;');
    for (const item of initialItems) {
      insertHackathon(item);
    }
    db.exec('COMMIT;');
    return { success: true, count: initialItems.length };
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

/**
 * Database Telemetry & Statistics
 */
export function getDatabaseStats() {
  const hackathonsCountRow = db.prepare('SELECT COUNT(*) as count FROM hackathons').get();
  const registeredCountRow = db.prepare("SELECT COUNT(*) as count FROM hackathons WHERE status != 'Not Registered'").get();
  const notRegisteredCountRow = db.prepare("SELECT COUNT(*) as count FROM hackathons WHERE status = 'Not Registered'").get();
  const newDiscoveredCountRow = db.prepare('SELECT COUNT(*) as count FROM hackathons WHERE is_new = 1').get();
  const techEventsCountRow = db.prepare("SELECT COUNT(*) as count FROM hackathons WHERE type = 'tech-event'").get();
  const hackathonsTypeCountRow = db.prepare("SELECT COUNT(*) as count FROM hackathons WHERE type = 'hackathon'").get();
  const logsCountRow = db.prepare('SELECT COUNT(*) as count FROM crawler_logs').get();
  const platformsCountRow = db.prepare('SELECT COUNT(*) as count FROM scraper_sources').get();

  // Run integrity check
  const integrityRow = db.prepare('PRAGMA integrity_check').get();

  return {
    engine: 'SQLite 3.x (Native node:sqlite)',
    dbFile: DB_FILE,
    status: 'online',
    integrity: integrityRow ? Object.values(integrityRow)[0] : 'ok',
    counts: {
      total: hackathonsCountRow.count,
      hackathons: hackathonsTypeCountRow.count,
      techEvents: techEventsCountRow.count,
      registered: registeredCountRow.count,
      notRegistered: notRegisteredCountRow.count,
      newDiscovered: newDiscoveredCountRow.count,
      platforms: platformsCountRow.count,
      logs: logsCountRow.count
    }
  };
}

/**
 * Crawler Logs Table Operations
 */
export function getCrawlerLogs(limit = 100) {
  const stmt = db.prepare('SELECT * FROM crawler_logs ORDER BY created_at DESC LIMIT ?');
  return stmt.all(limit);
}

export function insertCrawlerLog(log) {
  const stmt = db.prepare(`
    INSERT INTO crawler_logs (id, timestamp, text, type, platform_id)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(
    log.id || 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    log.timestamp || new Date().toLocaleTimeString(),
    log.text,
    log.type || 'info',
    log.platformId || null
  );
}

export function clearCrawlerLogs() {
  db.exec('DELETE FROM crawler_logs;');
  return { success: true };
}

/**
 * Scraper Sources Operations
 */
export function getAllScraperSources() {
  const stmt = db.prepare('SELECT * FROM scraper_sources ORDER BY target_type, name ASC');
  return stmt.all();
}

export function seedScraperSources(platforms) {
  db.exec('BEGIN TRANSACTION;');
  try {
    const stmt = db.prepare(`
      INSERT INTO scraper_sources (
        id, name, domain, base_url, endpoint, category,
        target_type, tagline, color, rate_limit, protocol, enabled
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        domain = excluded.domain,
        base_url = excluded.base_url,
        endpoint = excluded.endpoint,
        category = excluded.category,
        target_type = excluded.target_type,
        tagline = excluded.tagline,
        color = excluded.color,
        rate_limit = excluded.rate_limit,
        protocol = excluded.protocol
    `);

    for (const p of platforms) {
      stmt.run(
        p.id,
        p.name,
        p.domain,
        p.baseUrl || '',
        p.endpoint || '',
        p.category || '',
        p.targetType || 'hackathon',
        p.tagline || '',
        p.color || '#3b82f6',
        p.rateLimit || '',
        p.protocol || '',
        p.enabled ? 1 : 0
      );
    }
    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

export function updateScraperSource(id, patch) {
  const existing = db.prepare('SELECT * FROM scraper_sources WHERE id = ?').get(id);
  if (!existing) return null;

  const enabled = patch.enabled !== undefined ? (patch.enabled ? 1 : 0) : existing.enabled;
  const status = patch.status !== undefined ? patch.status : existing.status;
  const lastScraped = patch.lastScraped !== undefined ? patch.lastScraped : existing.last_scraped;
  const itemsFound = patch.itemsFound !== undefined ? patch.itemsFound : existing.items_found;

  const stmt = db.prepare(`
    UPDATE scraper_sources
    SET enabled = ?, status = ?, last_scraped = ?, items_found = ?
    WHERE id = ?
  `);
  stmt.run(enabled, status, lastScraped, itemsFound, id);
  return db.prepare('SELECT * FROM scraper_sources WHERE id = ?').get(id);
}
