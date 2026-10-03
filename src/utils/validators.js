/**
 * Form validation helper for Add/Edit Hackathon
 */
export function validateHackathonForm(formData) {
  const errors = {};

  // Title validation
  if (!formData.title || !formData.title.trim()) {
    errors.title = "Hackathon name is required";
  } else if (formData.title.trim().length < 3) {
    errors.title = "Hackathon name must be at least 3 characters";
  }

  // Organizer validation
  if (!formData.organizer || !formData.organizer.trim()) {
    errors.organizer = "Organizer is required";
  }

  // Category validation
  if (!formData.category || formData.category === "All") {
    errors.category = "Please select a valid category";
  }

  // Mode validation
  if (!formData.mode || formData.mode === "All") {
    errors.mode = "Please select a mode (Online, Offline, Hybrid)";
  }

  // Registration deadline validation
  if (!formData.registrationDeadline) {
    errors.registrationDeadline = "Registration deadline is required";
  } else {
    const d = new Date(formData.registrationDeadline);
    if (isNaN(d.getTime())) {
      errors.registrationDeadline = "Please provide a valid deadline date";
    }
  }

  // Registration URL validation (optional, but if provided must be valid)
  if (formData.registrationUrl && formData.registrationUrl.trim()) {
    const url = formData.registrationUrl.trim();
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?(\?.*)?$/i;
    if (!urlPattern.test(url) && !url.startsWith("http://") && !url.startsWith("https://")) {
      errors.registrationUrl = "Please enter a valid URL (e.g. https://example.com)";
    }
  }

  // Date ordering validation
  if (formData.eventStartDate && formData.eventEndDate) {
    if (formData.eventStartDate > formData.eventEndDate) {
      errors.eventEndDate = "Event end date cannot be earlier than start date";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
