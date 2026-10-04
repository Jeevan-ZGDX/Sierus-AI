/**
 * Express REST API Server with SQLite Database Integration
 * Serves endpoints on http://localhost:3001
 */

import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';

import {
  initDatabase,
  getAllHackathons,
  getHackathonById,
  insertHackathon,
  updateHackathon,
  deleteHackathon,
  updateHackathonStatus,
  toggleHackathonBookmark,
  markAllSeen,
  seedHackathons,
  resetHackathons,
  getDatabaseStats,
  getAllScraperSources,
  seedScraperSources,
  updateScraperSource,
  getCrawlerLogs,
  insertCrawlerLog,
  clearCrawlerLogs,
  db
} from './db.js';

import { checkSupabaseHealth, migrateSqliteToSupabase } from './supabase.js';

import { SAMPLE_HACKATHONS } from '../src/data/sampleHackathons.js';
import { SCRAPER_PLATFORMS, DISCOVERABLE_EVENTS } from '../src/data/aiDiscoverySources.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '15mb' }));

// Initialize database schema
initDatabase();

// Seed initial platforms & sample hackathons if database table is empty
try {
  const currentSources = getAllScraperSources();
  if (currentSources.length === 0) {
    seedScraperSources(SCRAPER_PLATFORMS);
    console.log(`[Database] Seeded ${SCRAPER_PLATFORMS.length} scraper sources into SQLite.`);
  }

  const currentHackathons = getAllHackathons();
  if (currentHackathons.length === 0) {
    seedHackathons(SAMPLE_HACKATHONS);
    console.log(`[Database] Seeded ${SAMPLE_HACKATHONS.length} initial hackathons into SQLite.`);
  }
} catch (err) {
  console.error('[Database Seed Error]:', err.message);
}

// --------------------------------------------------------------------------
// System & Database Health Endpoints
// --------------------------------------------------------------------------

app.get('/api/health', (req, res) => {
  const stats = getDatabaseStats();
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    database: stats
  });
});

app.get('/api/db/stats', (req, res) => {
  try {
    const stats = getDatabaseStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/supabase/status', async (req, res) => {
  try {
    const status = await checkSupabaseHealth();
    res.json({ success: true, data: status });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/supabase/migrate', async (req, res) => {
  try {
    const result = await migrateSqliteToSupabase(db);
    insertCrawlerLog({
      timestamp: new Date().toLocaleTimeString(),
      text: `🚀 Migrated SQLite database to Supabase (${result.hackathonsMigrated} hackathons, ${result.sourcesMigrated} sources).`,
      type: 'info'
    });
    res.json(result);
  } catch (err) {
    console.error('Supabase Migration Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/db/reset', (req, res) => {
  try {
    const combinedInitial = [...SAMPLE_HACKATHONS];
    resetHackathons(combinedInitial);
    seedScraperSources(SCRAPER_PLATFORMS);
    clearCrawlerLogs();
    insertCrawlerLog({
      timestamp: new Date().toLocaleTimeString(),
      text: '🔄 Database reset to factory seed state.',
      type: 'warn'
    });
    res.json({ success: true, message: 'Database reset and reseeded successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/db/backup', (req, res) => {
  try {
    const allItems = getAllHackathons();
    const allPlatforms = getAllScraperSources();
    const logs = getCrawlerLogs(200);

    const backupData = {
      version: '2.4',
      database: 'SQLite 3.x',
      exportedAt: new Date().toISOString(),
      hackathons: allItems,
      platforms: allPlatforms,
      logs
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=hackathon_tracker_backup_${Date.now()}.json`);
    res.json(backupData);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/db/restore', (req, res) => {
  try {
    const { hackathons: incomingHackathons } = req.body;
    if (!Array.isArray(incomingHackathons)) {
      return res.status(400).json({ success: false, error: 'Invalid backup format: hackathons array required.' });
    }

    resetHackathons(incomingHackathons);
    insertCrawlerLog({
      timestamp: new Date().toLocaleTimeString(),
      text: `📥 Restored ${incomingHackathons.length} records from backup dump into SQLite database.`,
      type: 'info'
    });

    res.json({ success: true, count: incomingHackathons.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --------------------------------------------------------------------------
// Hackathons & Tech Events CRUD Endpoints
// --------------------------------------------------------------------------

app.get('/api/hackathons', (req, res) => {
  try {
    const filters = {
      type: req.query.type,
      category: req.query.category,
      mode: req.query.mode,
      status: req.query.status,
      platform: req.query.platform,
      bookmarked: req.query.bookmarked,
      q: req.query.q,
      sortBy: req.query.sortBy
    };

    const items = getAllHackathons(filters);
    res.json({ success: true, count: items.length, data: items });
  } catch (err) {
    console.error('API Error in GET /api/hackathons:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/hackathons/:id', (req, res) => {
  try {
    const item = getHackathonById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Hackathon not found' });
    }
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/hackathons', (req, res) => {
  try {
    const newItem = {
      ...req.body,
      id: req.body.id || 'hack-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)
    };
    const saved = insertHackathon(newItem);
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/hackathons/:id', (req, res) => {
  try {
    const updated = updateHackathon(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Hackathon not found' });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/hackathons/:id', (req, res) => {
  try {
    const result = deleteHackathon(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/hackathons/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, error: 'Missing status property' });
    }
    const updated = updateHackathonStatus(req.params.id, status);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/hackathons/:id/bookmark', (req, res) => {
  try {
    const updated = toggleHackathonBookmark(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/hackathons/mark-seen', (req, res) => {
  try {
    markAllSeen();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --------------------------------------------------------------------------
// Scraper Platforms & Telemetry Logs Endpoints
// --------------------------------------------------------------------------

app.get('/api/crawler/platforms', (req, res) => {
  try {
    const platforms = getAllScraperSources();
    res.json({ success: true, data: platforms });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/crawler/platforms/:id', (req, res) => {
  try {
    const updated = updateScraperSource(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/crawler/logs', (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 100;
    const logs = getCrawlerLogs(limit);
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/crawler/logs', (req, res) => {
  try {
    insertCrawlerLog(req.body);
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/crawler/logs', (req, res) => {
  try {
    clearCrawlerLogs();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve production static build if dist/ exists
const distPath = join(__dirname, '..', 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('{*path}', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(join(distPath, 'index.html'));
  });
}

// Start listening
app.listen(PORT, () => {
  console.log(`\n========================================================`);
  console.log(`🗄️  Hackathon Tracker Database API Server is Running!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`💾 Database: SQLite (Native node:sqlite in data/hackathons.db)`);
  console.log(`========================================================\n`);
});
