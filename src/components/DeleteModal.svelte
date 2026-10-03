<script>
  import { createEventDispatcher } from 'svelte';
  import { hackathons } from '../stores/hackathons.js';
  import { toasts } from '../stores/toast.js';
  import Icon from './Icon.svelte';

  export let hackathon;

  const dispatch = createEventDispatcher();

  function handleConfirmDelete() {
    if (hackathon) {
      hackathons.deleteHackathon(hackathon.id);
      toasts.success(`Deleted "${hackathon.title}"`);
    }
    dispatch('close');
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') {
      dispatch('close');
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if hackathon}
  <div
    class="modal-backdrop"
    on:click|self={() => dispatch('close')}
    on:keydown={handleKeydown}
    role="presentation"
  >
    <div class="modal-content delete-modal-box" role="alertdialog" aria-modal="true" aria-labelledby="delete-title">
      <div class="delete-icon-wrap">
        <Icon name="alert-triangle" size={28} />
      </div>

      <div class="delete-content">
        <h3 id="delete-title" class="delete-title">Delete Hackathon?</h3>
        <p class="delete-message">
          Are you sure you want to delete <strong>"{hackathon.title}"</strong>?
          This action cannot be undone.
        </p>
      </div>

      <div class="delete-actions">
        <button type="button" class="btn-secondary" on:click={() => dispatch('close')}>
          Cancel
        </button>
        <button type="button" class="btn-danger" on:click={handleConfirmDelete}>
          <Icon name="trash" size={16} />
          <span>Delete</span>
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .delete-modal-box {
    max-width: 440px;
    padding: 1.75rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.25rem;
  }

  .delete-icon-wrap {
    width: 56px;
    height: 56px;
    border-radius: var(--radius-full);
    background-color: #fee2e2;
    color: #dc2626;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .delete-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .delete-title {
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--text-primary);
  }

  .delete-message {
    font-size: 0.9375rem;
    color: var(--text-secondary);
    line-height: 1.5;
  }

  .delete-message strong {
    color: var(--text-primary);
  }

  .delete-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    width: 100%;
    margin-top: 0.5rem;
  }

  .delete-actions button {
    flex: 1;
  }
</style>
