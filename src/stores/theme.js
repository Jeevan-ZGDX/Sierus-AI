import { writable } from 'svelte/store';

const THEME_STORAGE_KEY = 'hackathon_theme_v1';

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch (e) {
    // fallback
  }
  return 'light';
}

function createThemeStore() {
  const { subscribe, set, update } = writable(getInitialTheme());

  return {
    subscribe,
    toggle: () => {
      update(current => {
        const next = current === 'dark' ? 'light' : 'dark';
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(THEME_STORAGE_KEY, next);
            document.documentElement.setAttribute('data-theme', next);
          } catch (e) {}
        }
        return next;
      });
    },
    init: () => {
      if (typeof window !== 'undefined') {
        const theme = getInitialTheme();
        document.documentElement.setAttribute('data-theme', theme);
        set(theme);
      }
    }
  };
}

export const theme = createThemeStore();
