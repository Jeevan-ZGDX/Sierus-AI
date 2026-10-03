import { writable } from 'svelte/store';

export const activePage = writable('dashboard');
export const sidebarOpen = writable(false);
export const selectedLocationFilter = writable('All Locations');

export function navigateTo(page, location = 'All Locations') {
  activePage.set(page);
  if (location) {
    selectedLocationFilter.set(location);
  }
  // On mobile, close sidebar after navigation
  sidebarOpen.set(false);
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
