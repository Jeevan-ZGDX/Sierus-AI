/**
 * Unified Database Service (Supabase PostgreSQL + SQLite + Offline Cache)
 * 
 * Intelligently routes data operations:
 * 1. Supabase PostgreSQL (Cloud Database) when credentials configured and reachable
 * 2. Local SQLite 3.x (node:sqlite REST API) when backend server is running
 * 3. Browser Cache (LocalStorage) for 100% offline resilience
 */

import { writable, get } from 'svelte/store';
import { initialHackathons } from '../data/sampleHackathons.js';
import {
  supabaseStatus,
  getSupabaseClient,
  testSupabaseConnection,
  fetchSupabaseHackathons,
  createSupabaseHackathon,
  updateSupabaseHackathon,
  deleteSupabaseHackathon,
  toggleSupabaseBookmark,
  updateSupabaseStatus,
  migrateListToSupabase
} from './supabase.js';

export const activeEngine = writable('sqlite'); // 'supabase' | 'sqlite' | 'offline'

export const dbStatus = writable({
  connected: false,
  engine: 'Connecting...',
  status: 'initializing',
  activeProvider: 'sqlite', // 'supabase' | 'sqlite' | 'offline'
  totalRecords: 0,
  dbFile: 'data/hackathons.db',
  integrity: 'checking',
  lastSynced: null,
  isSyncing: false
});

const STORAGE_KEY = 'hackathon_tracker_data_v2';

/**
 * Check backend database connectivity across both Supabase and SQLite
 */
export async function checkDatabaseHealth() {
  // 1. Check Supabase first
  try {
    const sbResult = await testSupabaseConnection();
    if (sbResult.success) {
      activeEngine.set('supabase');
      dbStatus.update(s => ({
        ...s,
        connected: true,
        engine: 'Supabase Cloud PostgreSQL',
        activeProvider: 'supabase',
        status: 'online',
        totalRecords: sbResult.count || 0,
        integrity: 'cloud-verified',
        lastSynced: new Date().toLocaleTimeString()
      }));
      return true;
    }
  } catch (e) {
    // Supabase not available or not configured
  }

  // 2. Check local SQLite backend
  try {
    const res = await fetch('/api/health');
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'online') {
        activeEngine.set('sqlite');
        dbStatus.update(s => ({
          ...s,
          connected: true,
          engine: 'SQLite 3.x Relational Engine',
          activeProvider: 'sqlite',
          status: 'online',
          totalRecords: data.database?.counts?.total || 0,
          dbFile: data.database?.dbFile || 'data/hackathons.db',
          integrity: data.database?.integrity || 'ok',
          lastSynced: new Date().toLocaleTimeString()
        }));
        return true;
      }
    }
  } catch (err) {
    // SQLite backend unreachable
  }

  // 3. Fallback to client cache
  activeEngine.set('offline');
  dbStatus.update(s => ({
    ...s,
    connected: false,
    engine: 'Client Database (Local / Offline)',
    activeProvider: 'offline',
    status: 'offline',
    lastSynced: new Date().toLocaleTimeString()
  }));
  return false;
}

/**
 * Fetch all hackathons from the active database
 */
export async function fetchHackathonsFromDb(filters = {}) {
  await checkDatabaseHealth();
  const currentEngine = get(activeEngine);

  // A. Supabase
  if (currentEngine === 'supabase') {
    try {
      const items = await fetchSupabaseHackathons(filters);
      if (Array.isArray(items)) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch (e) {}
        return items;
      }
    } catch (err) {
      console.warn('Failed to fetch from Supabase, trying SQLite/Local fallback:', err);
    }
  }

  // B. SQLite
  if (currentEngine === 'sqlite' || currentEngine === 'auto') {
    try {
      const res = await fetch('/api/hackathons');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(json.data));
          } catch (e) {}
          return json.data;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch from backend SQLite, using cached storage:', err);
    }
  }

  // C. Fallback to localStorage or sample data
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('LocalStorage read error:', e);
  }

  return initialHackathons;
}

/**
 * Save new hackathon
 */
export async function createHackathonInDb(item) {
  const currentEngine = get(activeEngine);

  if (currentEngine === 'supabase') {
    try {
      const created = await createSupabaseHackathon(item);
      checkDatabaseHealth();
      return created;
    } catch (e) {
      console.warn('Supabase insert failed, saving to SQLite fallback:', e);
    }
  }

  try {
    const res = await fetch('/api/hackathons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success) {
        checkDatabaseHealth();
        return json.data;
      }
    }
  } catch (err) {
    console.warn('Offline mode: SQLite write failed, item saved locally');
  }
  return item;
}

/**
 * Update hackathon
 */
export async function updateHackathonInDb(id, item) {
  const currentEngine = get(activeEngine);

  if (currentEngine === 'supabase') {
    try {
      const updated = await updateSupabaseHackathon(id, item);
      return updated;
    } catch (e) {
      console.warn('Supabase update failed:', e);
    }
  }

  try {
    const res = await fetch(`/api/hackathons/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success) return json.data;
    }
  } catch (err) {
    console.warn('Offline mode: SQLite update failed');
  }
  return item;
}

/**
 * Delete hackathon
 */
export async function deleteHackathonFromDb(id) {
  const currentEngine = get(activeEngine);

  if (currentEngine === 'supabase') {
    try {
      await deleteSupabaseHackathon(id);
      checkDatabaseHealth();
      return true;
    } catch (e) {
      console.warn('Supabase delete failed:', e);
    }
  }

  try {
    await fetch(`/api/hackathons/${id}`, { method: 'DELETE' });
    checkDatabaseHealth();
  } catch (err) {
    console.warn('Offline mode: SQLite delete failed');
  }
}

/**
 * Update registration status
 */
export async function updateStatusInDb(id, status) {
  const currentEngine = get(activeEngine);

  if (currentEngine === 'supabase') {
    try {
      return await updateSupabaseStatus(id, status);
    } catch (e) {
      console.warn('Supabase status update failed:', e);
    }
  }

  try {
    const res = await fetch(`/api/hackathons/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success) return json.data;
    }
  } catch (err) {
    console.warn('Offline mode: SQLite status patch failed');
  }
}

/**
 * Toggle bookmark
 */
export async function toggleBookmarkInDb(id, currentBookmarked = false) {
  const currentEngine = get(activeEngine);

  if (currentEngine === 'supabase') {
    try {
      return await toggleSupabaseBookmark(id, currentBookmarked);
    } catch (e) {
      console.warn('Supabase bookmark toggle failed:', e);
    }
  }

  try {
    const res = await fetch(`/api/hackathons/${id}/bookmark`, { method: 'PATCH' });
    if (res.ok) {
      const json = await res.json();
      if (json.success) return json.data;
    }
  } catch (err) {
    console.warn('Offline mode: SQLite bookmark patch failed');
  }
}

/**
 * Mark all as seen
 */
export async function markAllSeenInDb() {
  try {
    await fetch('/api/hackathons/mark-seen', { method: 'POST' });
    checkDatabaseHealth();
  } catch (err) {
    console.warn('Offline mode: mark-seen failed');
  }
}

/**
 * Reset database to initial seed data
 */
export async function resetDatabaseInDb() {
  try {
    const res = await fetch('/api/db/reset', { method: 'POST' });
    if (res.ok) {
      checkDatabaseHealth();
      return true;
    }
  } catch (err) {
    console.warn('Offline mode: Database reset failed on server');
  }
  return false;
}

/**
 * Get detailed stats from database
 */
export async function getDbStatsFromDb() {
  try {
    const res = await fetch('/api/db/stats');
    if (res.ok) {
      const json = await res.json();
      if (json.success) return json.data;
    }
  } catch (err) {
    console.warn('Offline mode: getDbStats failed');
  }
  return null;
}

/**
 * Migrate SQLite data to Supabase (via backend API or client fallback)
 */
export async function triggerSupabaseMigration(items = []) {
  try {
    const res = await fetch('/api/supabase/migrate', { method: 'POST' });
    if (res.ok) {
      const json = await res.json();
      if (json.success) {
        await checkDatabaseHealth();
        return json;
      }
    }
  } catch (err) {
    console.warn('Server-side migration call failed, attempting client-side upload:', err);
  }

  // Client-side fallback migration
  if (items && items.length > 0) {
    return await migrateListToSupabase(items);
  }

  throw new Error('Unable to trigger migration: backend endpoint unreachable and no items provided.');
}
