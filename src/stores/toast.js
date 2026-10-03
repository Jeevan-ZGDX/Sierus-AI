import { writable } from 'svelte/store';

function createToastStore() {
  const { subscribe, update } = writable([]);

  function show(message, type = 'info', duration = 3000) {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const toast = { id, message, type, duration };

    update(toasts => [...toasts, toast]);

    if (duration > 0) {
      setTimeout(() => {
        dismiss(id);
      }, duration);
    }
  }

  function dismiss(id) {
    update(toasts => toasts.filter(t => t.id !== id));
  }

  return {
    subscribe,
    show,
    success: (msg, dur) => show(msg, 'success', dur),
    error: (msg, dur) => show(msg, 'error', dur),
    info: (msg, dur) => show(msg, 'info', dur),
    dismiss
  };
}

export const toasts = createToastStore();
