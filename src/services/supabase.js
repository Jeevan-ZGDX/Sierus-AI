/**
 * Supabase Client & Service Layer
 * 
 * Provides PostgreSQL cloud database capabilities for the Hackathon Tracker:
 * - Direct real-time sync with Supabase
 * - Dynamic configuration via environment variables or UI settings
 * - High performance indexing & RLS security
 */

import { createClient } from '@supabase/supabase-js';
import { writable } from 'svelte/store';

const STORAGE_CONFIG_KEY = 'hackathon_tracker_supabase_cfg';

// Reactive store for Supabase status
export const supabaseStatus = writable({
  configured: false,
  connected: false,
  url: '',
  anonKey: '',
  tableName: 'hackathons',
  totalRecords: 0,
  lastChecked: null,
  error: null,
  isTesting: false
});

let clientInstance = null;

/**
 * Get current configured credentials (prioritizes env vars, falls back to localStorage)
 */
export function getStoredConfig() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (envUrl && envKey && !envUrl.includes('your-project-id')) {
    return { url: envUrl.trim(), anonKey: envKey.trim(), source: 'env' };
  }

  try {
    const saved = localStorage.getItem(STORAGE_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.url && parsed.anonKey) {
        return { ...parsed, source: 'localStorage' };
      }
    }
  } catch (e) {
    console.warn('Could not read Supabase config from localStorage:', e);
  }

  return { url: '', anonKey: '', source: 'none' };
}

/**
 * Initialize or retrieve the Supabase client singleton
 */
export function getSupabaseClient() {
  const cfg = getStoredConfig();
  if (!cfg.url || !cfg.anonKey) {
    clientInstance = null;
    return null;
  }

  if (!clientInstance) {
    try {
      clientInstance = createClient(cfg.url, cfg.anonKey, {
        auth: { persistSession: false }
      });
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      clientInstance = null;
    }
  }

  return clientInstance;
}

/**
 * Save user credentials to localStorage
 */
export function saveSupabaseConfig(url, anonKey) {
  const cleanUrl = (url || '').trim();
  const cleanKey = (anonKey || '').trim();

  localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify({
    url: cleanUrl,
    anonKey: cleanKey
  }));

  // Reset client instance so it re-creates with new credentials
  clientInstance = null;
  return testSupabaseConnection(cleanUrl, cleanKey);
}

/**
 * Remove stored credentials
 */
export function clearSupabaseConfig() {
  localStorage.removeItem(STORAGE_CONFIG_KEY);
  clientInstance = null;
  supabaseStatus.set({
    configured: false,
    connected: false,
    url: '',
    anonKey: '',
    tableName: 'hackathons',
    totalRecords: 0,
    lastChecked: new Date().toLocaleTimeString(),
    error: null,
    isTesting: false
  });
}

/**
 * Test Supabase connectivity and query record counts
 */
export async function testSupabaseConnection(overrideUrl, overrideKey) {
  const cfg = overrideUrl && overrideKey 
    ? { url: overrideUrl.trim(), anonKey: overrideKey.trim() } 
    : getStoredConfig();

  if (!cfg.url || !cfg.anonKey) {
    supabaseStatus.update(s => ({
      ...s,
      configured: false,
      connected: false,
      url: '',
      error: 'Supabase URL or Anon Key is missing.'
    }));
    return { success: false, error: 'Credentials missing' };
  }

  supabaseStatus.update(s => ({ ...s, isTesting: true, error: null }));

  try {
    const testClient = createClient(cfg.url, cfg.anonKey, { auth: { persistSession: false } });
    
    // Test hackathons table
    const { count, error } = await testClient
      .from('hackathons')
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw error;
    }

    supabaseStatus.set({
      configured: true,
      connected: true,
      url: cfg.url,
      anonKey: cfg.anonKey,
      tableName: 'hackathons',
      totalRecords: count || 0,
      lastChecked: new Date().toLocaleTimeString(),
      error: null,
      isTesting: false
    });

    return { success: true, count };
  } catch (err) {
    const errorMsg = err.message || 'Failed to connect to Supabase';
    supabaseStatus.update(s => ({
      ...s,
      configured: true,
      connected: false,
      url: cfg.url,
      lastChecked: new Date().toLocaleTimeString(),
      error: errorMsg,
      isTesting: false
    }));

    return { success: false, error: errorMsg };
  }
}

/**
 * Fetch all hackathons from Supabase
 */
export async function fetchSupabaseHackathons(filters = {}) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client is not configured');

  let query = client.from('hackathons').select('*');

  if (filters.type && filters.type !== 'all') {
    query = query.eq('type', filters.type);
  }
  if (filters.category && filters.category !== 'All') {
    query = query.eq('category', filters.category);
  }
  if (filters.mode && filters.mode !== 'All') {
    query = query.eq('mode', filters.mode);
  }
  if (filters.status && filters.status !== 'All') {
    query = query.eq('status', filters.status);
  }
  if (filters.platform && filters.platform !== 'all') {
    query = query.eq('platform', filters.platform);
  }
  if (filters.bookmarked === true) {
    query = query.eq('bookmarked', true);
  }

  // Sorting
  switch (filters.sortBy) {
    case 'deadline-asc':
      query = query.order('registration_deadline', { ascending: true });
      break;
    case 'deadline-desc':
      query = query.order('registration_deadline', { ascending: false });
      break;
    case 'title-asc':
      query = query.order('title', { ascending: true });
      break;
    case 'start-date':
      query = query.order('event_start_date', { ascending: true });
      break;
    default:
      query = query.order('registration_deadline', { ascending: true });
      break;
  }

  const { data, error } = await query;
  if (error) throw error;

  // Format snake_case from Postgres to standard camelCase
  return (data || []).map(row => ({
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
    registrationUrl: row.registration_url,
    status: row.status,
    bookmarked: Boolean(row.bookmarked),
    platform: row.platform,
    platformName: row.platform_name,
    source: row.source || '',
    discoveredAt: row.discovered_at,
    prizePool: row.prize_pool,
    eventType: row.event_type,
    isNew: Boolean(row.is_new),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

/**
 * Insert or replace hackathon in Supabase
 */
export async function createSupabaseHackathon(item) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client is not configured');

  const row = {
    id: item.id || `hack-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title: item.title,
    type: item.type || 'hackathon',
    description: item.description || '',
    organizer: item.organizer || '',
    category: item.category || 'Web3',
    mode: item.mode || 'Online',
    location: item.location || '',
    city: item.city || '',
    country: item.country || '',
    registration_deadline: item.registrationDeadline || item.registration_deadline,
    event_start_date: item.eventStartDate || item.event_start_date,
    event_end_date: item.eventEndDate || item.event_end_date,
    registration_url: item.registrationUrl || item.registration_url,
    status: item.status || 'Not Registered',
    bookmarked: Boolean(item.bookmarked),
    platform: item.platform || null,
    platform_name: item.platformName || item.platform_name || null,
    source: item.source || '',
    discovered_at: item.discoveredAt || item.discovered_at || null,
    prize_pool: item.prizePool || item.prize_pool || null,
    event_type: item.eventType || item.event_type || null,
    is_new: Boolean(item.isNew || item.is_new)
  };

  const { data, error } = await client
    .from('hackathons')
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update hackathon in Supabase
 */
export async function updateSupabaseHackathon(id, updates) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client is not configured');

  const payload = {};
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.type !== undefined) payload.type = updates.type;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.organizer !== undefined) payload.organizer = updates.organizer;
  if (updates.category !== undefined) payload.category = updates.category;
  if (updates.mode !== undefined) payload.mode = updates.mode;
  if (updates.location !== undefined) payload.location = updates.location;
  if (updates.city !== undefined) payload.city = updates.city;
  if (updates.country !== undefined) payload.country = updates.country;
  if (updates.registrationDeadline !== undefined) payload.registration_deadline = updates.registrationDeadline;
  if (updates.eventStartDate !== undefined) payload.event_start_date = updates.eventStartDate;
  if (updates.eventEndDate !== undefined) payload.event_end_date = updates.eventEndDate;
  if (updates.registrationUrl !== undefined) payload.registration_url = updates.registrationUrl;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.bookmarked !== undefined) payload.bookmarked = Boolean(updates.bookmarked);
  if (updates.prizePool !== undefined) payload.prize_pool = updates.prizePool;
  if (updates.platform !== undefined) payload.platform = updates.platform;
  if (updates.platformName !== undefined) payload.platform_name = updates.platformName;
  if (updates.source !== undefined) payload.source = updates.source;

  const { data, error } = await client
    .from('hackathons')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete hackathon from Supabase
 */
export async function deleteSupabaseHackathon(id) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client is not configured');

  const { error } = await client
    .from('hackathons')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

/**
 * Toggle bookmark in Supabase
 */
export async function toggleSupabaseBookmark(id, currentBookmarked) {
  return updateSupabaseHackathon(id, { bookmarked: !currentBookmarked });
}

/**
 * Update registration status in Supabase
 */
export async function updateSupabaseStatus(id, newStatus) {
  return updateSupabaseHackathon(id, { status: newStatus });
}

/**
 * Batch migrate a list of hackathons to Supabase
 */
export async function migrateListToSupabase(items) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client is not configured');

  const formatted = items.map(item => ({
    id: item.id,
    title: item.title,
    type: item.type || 'hackathon',
    description: item.description || '',
    organizer: item.organizer || '',
    category: item.category || 'Web3',
    mode: item.mode || 'Online',
    location: item.location || '',
    city: item.city || '',
    country: item.country || '',
    registration_deadline: item.registrationDeadline || item.registration_deadline,
    event_start_date: item.eventStartDate || item.event_start_date,
    event_end_date: item.eventEndDate || item.event_end_date,
    registration_url: item.registrationUrl || item.registration_url,
    status: item.status || 'Not Registered',
    bookmarked: Boolean(item.bookmarked),
    platform: item.platform || null,
    platform_name: item.platformName || item.platform_name || null,
    source: item.source || '',
    discovered_at: item.discoveredAt || item.discovered_at || null,
    prize_pool: item.prizePool || item.prize_pool || null,
    event_type: item.eventType || item.event_type || null,
    is_new: Boolean(item.isNew || item.is_new)
  }));

  const { data, error } = await client
    .from('hackathons')
    .upsert(formatted, { onConflict: 'id' });

  if (error) throw error;

  await testSupabaseConnection();
  return { success: true, count: formatted.length };
}
