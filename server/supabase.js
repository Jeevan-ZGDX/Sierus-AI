/**
 * Backend Supabase Service
 * Connects Express backend to Supabase PostgreSQL when credentials are configured.
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_KEY && !SUPABASE_URL.includes('your-project-id'));
}

export function getBackendSupabaseClient() {
  if (!isSupabaseConfigured()) return null;
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

/**
 * Check connectivity and retrieve count from Supabase
 */
export async function checkSupabaseHealth() {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      connected: false,
      message: 'Supabase credentials not configured in environment.'
    };
  }

  try {
    const client = getBackendSupabaseClient();
    const { count, error } = await client
      .from('hackathons')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    return {
      configured: true,
      connected: true,
      url: SUPABASE_URL,
      totalRecords: count || 0
    };
  } catch (err) {
    return {
      configured: true,
      connected: false,
      url: SUPABASE_URL,
      error: err.message
    };
  }
}

/**
 * Migrate SQLite records to Supabase
 */
export async function migrateSqliteToSupabase(sqliteDb) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured in .env. Please provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  const client = getBackendSupabaseClient();

  // 1. Get hackathons from SQLite
  const hackathons = sqliteDb.prepare('SELECT * FROM hackathons').all();
  const sources = sqliteDb.prepare('SELECT * FROM scraper_sources').all();

  const formattedHackathons = hackathons.map(row => ({
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
    created_at: row.created_at,
    updated_at: row.updated_at
  }));

  const { error: hackathonError } = await client
    .from('hackathons')
    .upsert(formattedHackathons, { onConflict: 'id' });

  if (hackathonError) throw hackathonError;

  if (sources.length > 0) {
    const formattedSources = sources.map(row => ({
      id: row.id,
      name: row.name,
      url: row.url || row.base_url || '',
      type: row.type || row.target_type || 'hackathon',
      color: row.color,
      status: row.status || 'active',
      last_scraped_at: row.last_scraped_at || row.last_scraped,
      items_found: Number(row.items_found || 0),
      enabled: Boolean(row.enabled)
    }));

    await client.from('scraper_sources').upsert(formattedSources, { onConflict: 'id' });
  }

  return {
    success: true,
    hackathonsMigrated: formattedHackathons.length,
    sourcesMigrated: sources.length
  };
}
