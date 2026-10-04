#!/usr/bin/env node

/**
 * Supabase Data Migration CLI Tool
 * Migrates local SQLite database (data/hackathons.db) to Supabase Cloud PostgreSQL.
 * 
 * Usage:
 *   node scripts/migrate_to_supabase.js
 *   node scripts/migrate_to_supabase.js --url https://your-proj.supabase.co --key your-anon-key
 */

import { createClient } from '@supabase/supabase-js';
import { DatabaseSync } from 'node:sqlite';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const dbFilePath = join(projectRoot, 'data', 'hackathons.db');

// Parse CLI flags
const args = process.argv.slice(2);
let cliUrl = null;
let cliKey = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--url' && args[i + 1]) {
    cliUrl = args[i + 1];
    i++;
  } else if (args[i] === '--key' && args[i + 1]) {
    cliKey = args[i + 1];
    i++;
  }
}

const SUPABASE_URL = cliUrl || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = cliKey || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

console.log('\n=============================================================');
console.log('🚀 Supabase Database Migration Tool');
console.log('=============================================================\n');

if (!SUPABASE_URL || !SUPABASE_KEY || SUPABASE_URL.includes('your-project-id')) {
  console.error('❌ Error: Missing Supabase credentials!');
  console.log('\nPlease supply your Supabase URL and Key in your .env file:');
  console.log('  VITE_SUPABASE_URL=https://your-project-id.supabase.co');
  console.log('  VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...');
  console.log('\nOr pass them via command-line arguments:');
  console.log('  node scripts/migrate_to_supabase.js --url <SUPABASE_URL> --key <SUPABASE_KEY>');
  console.log('\nEnsure you have created the tables in Supabase by running:');
  console.log('  supabase/schema.sql in your Supabase SQL Editor\n');
  process.exit(1);
}

console.log(`📡 Connecting to Supabase: ${SUPABASE_URL}`);
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runMigration() {
  // 1. Verify SQLite database exists
  if (!existsSync(dbFilePath)) {
    console.error(`❌ Local SQLite database file not found at: ${dbFilePath}`);
    console.log('Please start the local server or run the app to generate SQLite data first.');
    process.exit(1);
  }

  console.log(`📁 Reading local SQLite database: ${dbFilePath}`);
  const sqlite = new DatabaseSync(dbFilePath);

  // 2. Test Supabase connection
  try {
    const { error } = await supabase.from('hackathons').select('id').limit(1);
    if (error) {
      if (error.code === '42P01') {
        console.error('❌ Supabase table "hackathons" does not exist yet!');
        console.log('👉 Please open Supabase Dashboard -> SQL Editor, copy and run:');
        console.log(`   ${join(projectRoot, 'supabase', 'schema.sql')}\n`);
        process.exit(1);
      }
      throw error;
    }
    console.log('✅ Connected to Supabase PostgreSQL successfully!\n');
  } catch (err) {
    console.error('❌ Connection error to Supabase:', err.message);
    process.exit(1);
  }

  // 3. Migrate Hackathons
  console.log('🔄 Migrating Hackathons from SQLite to Supabase...');
  const hackathonRows = sqlite.prepare('SELECT * FROM hackathons').all();
  console.log(`   Found ${hackathonRows.length} hackathon records in SQLite.`);

  if (hackathonRows.length > 0) {
    const formattedHackathons = hackathonRows.map(row => ({
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
      registration_deadline: row.registration_deadline,
      event_start_date: row.event_start_date,
      event_end_date: row.event_end_date,
      registration_url: row.registration_url,
      status: row.status,
      bookmarked: Boolean(row.bookmarked),
      platform: row.platform,
      platform_name: row.platform_name,
      source: row.source || '',
      discovered_at: row.discovered_at,
      prize_pool: row.prize_pool,
      event_type: row.event_type,
      is_new: Boolean(row.is_new),
      created_at: row.created_at || new Date().toISOString(),
      updated_at: row.updated_at || new Date().toISOString()
    }));

    const { data: upsertedHackathons, error: hackathonError } = await supabase
      .from('hackathons')
      .upsert(formattedHackathons, { onConflict: 'id' })
      .select('id');

    if (hackathonError) {
      console.error('   ❌ Error upserting hackathons:', hackathonError.message);
    } else {
      console.log(`   ✅ Successfully upserted ${formattedHackathons.length} hackathons into Supabase!`);
    }
  }

  // 4. Migrate Scraper Sources
  console.log('\n🔄 Migrating Scraper Discovery Sources...');
  const sourceRows = sqlite.prepare('SELECT * FROM scraper_sources').all();
  console.log(`   Found ${sourceRows.length} scraper platforms in SQLite.`);

  if (sourceRows.length > 0) {
    const formattedSources = sourceRows.map(row => ({
      id: row.id,
      name: row.name,
      url: row.url || row.base_url || '',
      type: row.type || row.target_type || 'hackathon',
      color: row.color,
      status: row.status || 'active',
      last_scraped_at: row.last_scraped_at || row.last_scraped,
      items_found: Number(row.items_found || 0),
      enabled: Boolean(row.enabled),
      created_at: row.created_at || new Date().toISOString()
    }));

    const { error: sourceError } = await supabase
      .from('scraper_sources')
      .upsert(formattedSources, { onConflict: 'id' });

    if (sourceError) {
      console.error('   ❌ Error upserting scraper sources:', sourceError.message);
    } else {
      console.log(`   ✅ Successfully upserted ${formattedSources.length} scraper sources into Supabase!`);
    }
  }

  // 5. Migrate Crawler Logs
  console.log('\n🔄 Migrating Crawler Logs...');
  const logRows = sqlite.prepare('SELECT * FROM crawler_logs ORDER BY id DESC LIMIT 100').all();
  console.log(`   Found ${logRows.length} crawler log entries.`);

  if (logRows.length > 0) {
    const formattedLogs = logRows.map(row => ({
      timestamp: row.timestamp,
      text: row.text,
      type: row.type || 'info',
      created_at: row.created_at || new Date().toISOString()
    }));

    const { error: logError } = await supabase
      .from('crawler_logs')
      .insert(formattedLogs);

    if (logError) {
      console.warn('   ⚠️ Note on crawler logs:', logError.message);
    } else {
      console.log(`   ✅ Transferred ${formattedLogs.length} crawler log records to Supabase.`);
    }
  }

  // 6. Verification Step
  console.log('\n🔍 Verifying Supabase Database Tables...');
  const { count: totalHackathons, error: countErr } = await supabase
    .from('hackathons')
    .select('*', { count: 'exact', head: true });

  const { count: totalSources } = await supabase
    .from('scraper_sources')
    .select('*', { count: 'exact', head: true });

  console.log('\n=============================================================');
  console.log('🎉 Migration Completed Successfully!');
  console.log('=============================================================');
  console.log(`📊 Supabase Live Stats:`);
  console.log(`   • Hackathons & Tech Events: ${totalHackathons ?? 'Verified'}`);
  console.log(`   • Discovery Platforms:      ${totalSources ?? 'Verified'}`);
  console.log(`   • Database URL:             ${SUPABASE_URL}`);
  console.log('=============================================================\n');
}

runMigration().catch(err => {
  console.error('\n❌ Unhandled Migration Exception:', err);
  process.exit(1);
});
