<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { hackathons } from '../stores/hackathons.js';
  import { toasts } from '../stores/toast.js';
  import { FORM_CATEGORIES, FORM_MODES, FORM_STATUSES } from '../data/sampleHackathons.js';
  import { validateHackathonForm } from '../utils/validators.js';
  import Icon from './Icon.svelte';

  export let hackathonToEdit = null;

  const dispatch = createEventDispatcher();

  let isEditMode = false;
  let formId = '';

  let formData = {
    title: '',
    type: 'hackathon', // 'hackathon' or 'tech-event'
    organizer: '',
    category: 'AI/ML',
    mode: 'Online',
    location: '',
    city: '',
    country: '',
    prizePool: '',
    registrationDeadline: '',
    eventStartDate: '',
    eventEndDate: '',
    registrationUrl: '',
    description: '',
    status: 'Not Registered'
  };

  let errors = {};
  let submitted = false;

  onMount(() => {
    if (hackathonToEdit) {
      isEditMode = true;
      formId = hackathonToEdit.id;
      formData = {
        title: hackathonToEdit.title || '',
        type: hackathonToEdit.type || 'hackathon',
        organizer: hackathonToEdit.organizer || '',
        category: hackathonToEdit.category || 'AI/ML',
        mode: hackathonToEdit.mode || 'Online',
        location: hackathonToEdit.location || '',
        city: hackathonToEdit.city || '',
        country: hackathonToEdit.country || '',
        prizePool: hackathonToEdit.prizePool || '',
        registrationDeadline: hackathonToEdit.registrationDeadline || '',
        eventStartDate: hackathonToEdit.eventStartDate || '',
        eventEndDate: hackathonToEdit.eventEndDate || '',
        registrationUrl: hackathonToEdit.registrationUrl || '',
        description: hackathonToEdit.description || '',
        status: hackathonToEdit.status || 'Not Registered'
      };
    }
  });

  function handleSubmit() {
    submitted = true;
    const validation = validateHackathonForm(formData);
    errors = validation.errors;

    if (!validation.isValid) {
      toasts.error('Please fix the errors in the form before saving.');
      return;
    }

    if (isEditMode) {
      hackathons.updateHackathon(formId, { ...formData });
      toasts.success(`Updated "${formData.title}"`);
    } else {
      hackathons.addHackathon({ ...formData });
      toasts.success(`Added "${formData.title}"`);
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

<!-- Modal Backdrop -->
<div
  class="modal-backdrop"
  on:click|self={() => dispatch('close')}
  on:keydown={handleKeydown}
  role="presentation"
>
  <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="form-modal-title">
    <!-- Header -->
    <div class="modal-header">
      <div class="modal-title-wrap">
        <div class="modal-icon-badge">
          <Icon name={isEditMode ? 'edit' : 'plus'} size={20} />
        </div>
        <h2 id="form-modal-title" class="modal-title">
          {isEditMode ? 'Edit Opportunity' : 'Add New Event or Hackathon'}
        </h2>
      </div>
      <button class="btn-ghost" on:click={() => dispatch('close')} aria-label="Close dialog">
        <Icon name="x" size={18} />
      </button>
    </div>

    <!-- Form Content -->
    <form on:submit|preventDefault={handleSubmit} class="form-body">
      <!-- Event Type (Hackathon vs Tech Event) -->
      <div class="form-group">
        <label for="form-type-btn-hack" class="form-label">Opportunity Type</label>
        <div class="type-toggle-group">
          <button
            id="form-type-btn-hack"
            type="button"
            class="type-toggle-btn"
            class:selected={formData.type === 'hackathon'}
            on:click={() => formData.type = 'hackathon'}
          >
            🏆 Hackathon / Coding Challenge
          </button>
          <button
            type="button"
            class="type-toggle-btn"
            class:selected={formData.type === 'tech-event'}
            on:click={() => formData.type = 'tech-event'}
          >
            🎪 Tech Event / Conference / Summit
          </button>
        </div>
      </div>

      <!-- Title -->
      <div class="form-group">
        <label for="form-title" class="form-label">
          {formData.type === 'hackathon' ? 'Hackathon Name' : 'Event / Summit Name'} <span class="required">*</span>
        </label>
        <input
          id="form-title"
          type="text"
          placeholder="e.g. Global AI & Agents Hackathon 2026"
          bind:value={formData.title}
          class:input-error={errors.title}
        />
        {#if errors.title}
          <p class="error-text">{errors.title}</p>
        {/if}
      </div>

      <!-- Organizer & Prize Pool (2 columns) -->
      <div class="form-grid-2">
        <div class="form-group">
          <label for="form-organizer" class="form-label">
            Organizer / Host <span class="required">*</span>
          </label>
          <input
            id="form-organizer"
            type="text"
            placeholder="e.g. DeepTech Alliance, MIT, MLH"
            bind:value={formData.organizer}
            class:input-error={errors.organizer}
          />
          {#if errors.organizer}
            <p class="error-text">{errors.organizer}</p>
          {/if}
        </div>

        <div class="form-group">
          <label for="form-prize" class="form-label">
            {formData.type === 'hackathon' ? 'Prize Pool' : 'Event Type / Passes'}
            <span class="label-hint">(Optional)</span>
          </label>
          <input
            id="form-prize"
            type="text"
            placeholder={formData.type === 'hackathon' ? 'e.g. $50,000 or Swag' : 'e.g. Free Pass, Keynotes'}
            bind:value={formData.prizePool}
          />
        </div>
      </div>

      <!-- Category & Mode (2 columns) -->
      <div class="form-grid-2">
        <div class="form-group">
          <label for="form-category" class="form-label">
            Category <span class="required">*</span>
          </label>
          <select
            id="form-category"
            bind:value={formData.category}
            class:input-error={errors.category}
          >
            {#each FORM_CATEGORIES as cat}
              <option value={cat}>{cat}</option>
            {/each}
          </select>
          {#if errors.category}
            <p class="error-text">{errors.category}</p>
          {/if}
        </div>

        <div class="form-group">
          <label for="form-mode" class="form-label">
            Mode <span class="required">*</span>
          </label>
          <select id="form-mode" bind:value={formData.mode} class:input-error={errors.mode}>
            {#each FORM_MODES as mode}
              <option value={mode}>{mode}</option>
            {/each}
          </select>
          {#if errors.mode}
            <p class="error-text">{errors.mode}</p>
          {/if}
        </div>
      </div>

      <!-- Location (Full Address / City / Venue) -->
      <div class="form-group">
        <label for="form-location" class="form-label">
          Location & City
          <span class="label-hint">(e.g. "San Francisco, USA", "Bengaluru, India", or "Online")</span>
        </label>
        <input
          id="form-location"
          type="text"
          placeholder="Online, or city/venue"
          bind:value={formData.location}
        />
      </div>

      <!-- Registration Deadline & Status -->
      <div class="form-grid-2">
        <div class="form-group">
          <label for="form-deadline" class="form-label">
            Registration Deadline <span class="required">*</span>
          </label>
          <input
            id="form-deadline"
            type="date"
            bind:value={formData.registrationDeadline}
            class:input-error={errors.registrationDeadline}
          />
          {#if errors.registrationDeadline}
            <p class="error-text">{errors.registrationDeadline}</p>
          {/if}
        </div>

        <div class="form-group">
          <label for="form-status" class="form-label">My Registration Status</label>
          <select id="form-status" bind:value={formData.status}>
            {#each FORM_STATUSES as st}
              <option value={st}>{st}</option>
            {/each}
          </select>
        </div>
      </div>

      <!-- Event Dates (Start & End) -->
      <div class="form-grid-2">
        <div class="form-group">
          <label for="form-start-date" class="form-label">Event Start Date</label>
          <input
            id="form-start-date"
            type="date"
            bind:value={formData.eventStartDate}
          />
        </div>

        <div class="form-group">
          <label for="form-end-date" class="form-label">Event End Date</label>
          <input
            id="form-end-date"
            type="date"
            bind:value={formData.eventEndDate}
            class:input-error={errors.eventEndDate}
          />
          {#if errors.eventEndDate}
            <p class="error-text">{errors.eventEndDate}</p>
          {/if}
        </div>
      </div>

      <!-- Registration URL -->
      <div class="form-group">
        <label for="form-url" class="form-label">Registration / Official Website URL</label>
        <input
          id="form-url"
          type="url"
          placeholder="https://example.com/event-registration"
          bind:value={formData.registrationUrl}
          class:input-error={errors.registrationUrl}
        />
        {#if errors.registrationUrl}
          <p class="error-text">{errors.registrationUrl}</p>
        {/if}
      </div>

      <!-- Description -->
      <div class="form-group">
        <label for="form-description" class="form-label">Description & Tracks</label>
        <textarea
          id="form-description"
          rows="3"
          placeholder="Enter problem statements, tracks, prizes, submission requirements, or speaker details..."
          bind:value={formData.description}
        ></textarea>
      </div>

      <!-- Footer Buttons -->
      <div class="modal-footer">
        <button type="button" class="btn-secondary" on:click={() => dispatch('close')}>
          Cancel
        </button>
        <button type="submit" class="btn-primary">
          <Icon name={isEditMode ? 'check' : 'plus'} size={16} />
          <span>{isEditMode ? 'Save Changes' : 'Add Opportunity'}</span>
        </button>
      </div>
    </form>
  </div>
</div>

<style>
  .modal-header {
    padding: 1.25rem 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--border-subtle);
  }

  .modal-title-wrap {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .modal-icon-badge {
    width: 36px;
    height: 36px;
    border-radius: var(--radius-md);
    background: var(--primary-50);
    color: var(--primary-600);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .modal-title {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .form-body {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.125rem;
  }

  .type-toggle-group {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }

  .type-toggle-btn {
    padding: 0.5rem;
    font-size: 0.8125rem;
    font-weight: 600;
    border-radius: var(--radius-md);
    border: 1px solid var(--border-medium);
    background-color: var(--bg-surface);
    color: var(--text-secondary);
    text-align: center;
    transition: all var(--transition-fast);
  }

  .type-toggle-btn:hover {
    border-color: var(--primary-500);
    color: var(--text-primary);
  }

  .type-toggle-btn.selected {
    background-color: var(--primary-50);
    color: var(--primary-600);
    border-color: var(--primary-600);
    font-weight: 700;
  }

  .form-group {
    display: flex;
    flex-direction: column;
  }

  .form-label {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.375rem;
  }

  .required {
    color: #ef4444;
  }

  .label-hint {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 400;
    margin-left: 0.25rem;
  }

  .form-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .modal-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 0.5rem;
    padding-top: 1.25rem;
    border-top: 1px solid var(--border-subtle);
  }

  @media (max-width: 600px) {
    .type-toggle-group,
    .form-grid-2 {
      grid-template-columns: 1fr;
    }
  }
</style>
