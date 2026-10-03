<script>
  import { toasts } from '../stores/toast.js';
  import Icon from './Icon.svelte';
</script>

{#if $toasts.length > 0}
  <div class="toast-container" aria-live="polite">
    {#each $toasts as toast (toast.id)}
      <div class="toast toast-{toast.type}">
        <span class="toast-icon">
          {#if toast.type === 'success'}
            <Icon name="check" size={16} />
          {:else if toast.type === 'error'}
            <Icon name="alert-triangle" size={16} />
          {:else}
            <Icon name="info" size={16} />
          {/if}
        </span>
        <span class="toast-message">{toast.message}</span>
        <button
          class="toast-close"
          on:click={() => toasts.dismiss(toast.id)}
          aria-label="Close notification"
        >
          <Icon name="x" size={14} />
        </button>
      </div>
    {/each}
  </div>
{/if}

<style>
  .toast-container {
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    z-index: 2000;
    max-width: 380px;
    width: calc(100vw - 3rem);
    pointer-events: none;
  }

  .toast {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-radius: var(--radius-md);
    background: #1e293b;
    color: #ffffff;
    box-shadow: var(--shadow-lg);
    font-size: 0.875rem;
    pointer-events: auto;
    animation: toastSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .toast-success {
    background: #065f46;
    border: 1px solid #059669;
  }

  .toast-error {
    background: #991b1b;
    border: 1px solid #dc2626;
  }

  .toast-info {
    background: #1e293b;
    border: 1px solid #334155;
  }

  .toast-icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .toast-message {
    flex: 1;
    font-weight: 500;
  }

  .toast-close {
    color: rgba(255, 255, 255, 0.7);
    padding: 0.25rem;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .toast-close:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.15);
  }

  @keyframes toastSlideUp {
    from {
      opacity: 0;
      transform: translateY(12px) scale(0.96);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
</style>
