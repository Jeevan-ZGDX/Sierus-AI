import { writable, derived } from 'svelte/store';
import { initialHackathons } from '../data/sampleHackathons.js';
import { getDeadlineStatus } from '../utils/dateUtils.js';

const STORAGE_KEY = 'hackathons_v1';

// Safe LocalStorage loader
function loadFromStorage() {
  if (typeof window === 'undefined') return initialHackathons;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialHackathons));
      return initialHackathons;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return initialHackathons;
  } catch (err) {
    console.error('Failed to read from localStorage:', err);
    return initialHackathons;
  }
}

// Save to LocalStorage helper
function saveToStorage(data) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to write to localStorage:', err);
  }
}

function createHackathonsStore() {
  const { subscribe, set, update } = writable(loadFromStorage());

  return {
    subscribe,
    addHackathon: (item) => {
      const newItem = {
        id: 'hack-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        bookmarked: false,
        status: item.status || 'Not Registered',
        type: item.type || 'hackathon',
        location: item.location || (item.mode === 'Online' ? 'Online' : 'Location TBD'),
        ...item
      };
      update((list) => {
        const updated = [newItem, ...list];
        saveToStorage(updated);
        return updated;
      });
      return newItem;
    },
    updateHackathon: (id, updates) => {
      update((list) => {
        const updated = list.map((item) => (item.id === id ? { ...item, ...updates } : item));
        saveToStorage(updated);
        return updated;
      });
    },
    deleteHackathon: (id) => {
      update((list) => {
        const updated = list.filter((item) => item.id !== id);
        saveToStorage(updated);
        return updated;
      });
    },
    toggleBookmark: (id) => {
      update((list) => {
        const updated = list.map((item) =>
          item.id === id ? { ...item, bookmarked: !item.bookmarked } : item
        );
        saveToStorage(updated);
        return updated;
      });
    },
    updateStatus: (id, newStatus) => {
      update((list) => {
        const updated = list.map((item) =>
          item.id === id ? { ...item, status: newStatus } : item
        );
        saveToStorage(updated);
        return updated;
      });
    },
    markAllAsSeen: () => {
      update((list) => {
        const updated = list.map((item) => ({ ...item, isNew: false }));
        saveToStorage(updated);
        return updated;
      });
    },
    resetToSampleData: () => {
      saveToStorage(initialHackathons);
      set(initialHackathons);
    },
    clearAll: () => {
      saveToStorage([]);
      set([]);
    },
    importData: (importedList) => {
      if (Array.isArray(importedList)) {
        saveToStorage(importedList);
        set(importedList);
        return true;
      }
      return false;
    }
  };
}

export const hackathons = createHackathonsStore();

// Filter & Search stores
export const searchQuery = writable('');
export const selectedCategory = writable('All');
export const selectedMode = writable('All');
export const selectedStatus = writable('All');
export const selectedLocation = writable('All Locations');
export const onlyBookmarked = writable(false);
export const sortBy = writable('deadline-asc'); // 'deadline-asc', 'deadline-desc', 'title-asc', 'start-date'

// Helper to reset all search & filters
export function resetFilters() {
  searchQuery.set('');
  selectedCategory.set('All');
  selectedMode.set('All');
  selectedStatus.set('All');
  selectedLocation.set('All Locations');
  onlyBookmarked.set(false);
}

// Active filters count
export const activeFiltersCount = derived(
  [searchQuery, selectedCategory, selectedMode, selectedStatus, selectedLocation, onlyBookmarked],
  ([$search, $cat, $mode, $stat, $loc, $book]) => {
    let count = 0;
    if ($search.trim()) count++;
    if ($cat !== 'All') count++;
    if ($mode !== 'All') count++;
    if ($stat !== 'All') count++;
    if ($loc !== 'All Locations') count++;
    if ($book) count++;
    return count;
  }
);

// Derived filtered hackathons list
export const filteredHackathons = derived(
  [hackathons, searchQuery, selectedCategory, selectedMode, selectedStatus, selectedLocation, onlyBookmarked, sortBy],
  ([$hackathons, $search, $category, $mode, $status, $location, $bookmarked, $sortBy]) => {
    const query = $search.trim().toLowerCase();

    return $hackathons
      .filter((h) => {
        if (query) {
          const matchTitle = (h.title || '').toLowerCase().includes(query);
          const matchOrganizer = (h.organizer || '').toLowerCase().includes(query);
          const matchCategory = (h.category || '').toLowerCase().includes(query);
          const matchLocation = (h.location || '').toLowerCase().includes(query);
          const matchDesc = (h.description || '').toLowerCase().includes(query);

          if (!matchTitle && !matchOrganizer && !matchCategory && !matchLocation && !matchDesc) {
            return false;
          }
        }

        if ($category !== 'All' && h.category !== $category) {
          return false;
        }

        if ($mode !== 'All' && h.mode !== $mode) {
          return false;
        }

        if ($status !== 'All' && h.status !== $status) {
          return false;
        }

        if ($location !== 'All Locations') {
          const targetLoc = $location.toLowerCase();
          const itemLoc = (h.location || '').toLowerCase();
          const itemCity = (h.city || '').toLowerCase();
          const itemCountry = (h.country || '').toLowerCase();

          if (!itemLoc.includes(targetLoc) && !itemCity.includes(targetLoc) && !itemCountry.includes(targetLoc)) {
            // Check if user filtered by Online
            if (targetLoc.includes('online') && (h.mode === 'Online' || itemLoc.includes('online'))) {
              // match
            } else {
              return false;
            }
          }
        }

        if ($bookmarked && !h.bookmarked) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if ($sortBy === 'deadline-asc') {
          const statusA = getDeadlineStatus(a.registrationDeadline);
          const statusB = getDeadlineStatus(b.registrationDeadline);

          if (statusA.isClosed && !statusB.isClosed) return 1;
          if (!statusA.isClosed && statusB.isClosed) return -1;
          return (a.registrationDeadline || '').localeCompare(b.registrationDeadline || '');
        } else if ($sortBy === 'deadline-desc') {
          return (b.registrationDeadline || '').localeCompare(a.registrationDeadline || '');
        } else if ($sortBy === 'title-asc') {
          return (a.title || '').localeCompare(b.title || '');
        } else if ($sortBy === 'start-date') {
          return (a.eventStartDate || '').localeCompare(b.eventStartDate || '');
        }
        return 0;
      });
  }
);

// Derived statistics store
export const hackathonStats = derived(hackathons, ($hackathons) => {
  const total = $hackathons.length;
  let upcoming = 0;
  let bookmarked = 0;
  let registered = 0;
  let notRegistered = 0;
  let participating = 0;
  let completed = 0;
  let newlyDiscovered = 0;
  let techEventsCount = 0;
  let hackathonsCount = 0;

  $hackathons.forEach((h) => {
    const status = getDeadlineStatus(h.registrationDeadline);
    if (!status.isClosed) {
      upcoming++;
    }
    if (h.bookmarked) {
      bookmarked++;
    }
    if (h.status === 'Registered') {
      registered++;
    } else if (h.status === 'Not Registered') {
      notRegistered++;
    } else if (h.status === 'Participating') {
      participating++;
    } else if (h.status === 'Completed') {
      completed++;
    }

    if (h.isNew || (h.source && h.source.includes('AI'))) {
      newlyDiscovered++;
    }

    if (h.type === 'tech-event') {
      techEventsCount++;
    } else {
      hackathonsCount++;
    }
  });

  return {
    total,
    upcoming,
    bookmarked,
    registered,
    notRegistered,
    participating,
    completed,
    newlyDiscovered,
    techEventsCount,
    hackathonsCount,
    activeOpportunities: registered + participating
  };
});
