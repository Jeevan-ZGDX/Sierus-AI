/**
 * Format a date string (YYYY-MM-DD) into readable text (e.g. "15 Oct 2026")
 */
export function formatDisplayDate(dateStr) {
  if (!dateStr) return "N/A";
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric"
        });
      }
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  } catch (e) {
    return dateStr;
  }
}

/**
 * Format date range (e.g. "20 Oct - 22 Oct 2026")
 */
export function formatDateRange(startDateStr, endDateStr) {
  if (!startDateStr && !endDateStr) return "Dates to be announced";
  if (startDateStr && !endDateStr) return `From ${formatDisplayDate(startDateStr)}`;
  if (!startDateStr && endDateStr) return `Until ${formatDisplayDate(endDateStr)}`;
  
  const startFormatted = formatDisplayDate(startDateStr);
  const endFormatted = formatDisplayDate(endDateStr);

  if (startFormatted === endFormatted) return startFormatted;
  return `${startFormatted} – ${endFormatted}`;
}

/**
 * Calculate registration deadline status and countdown
 */
export function getDeadlineStatus(deadlineStr) {
  if (!deadlineStr) {
    return {
      isClosed: false,
      isUrgent: false,
      daysRemaining: null,
      label: "No deadline specified",
      statusClass: "badge-neutral"
    };
  }

  const parts = deadlineStr.split('-');
  let deadlineDate;
  if (parts.length === 3) {
    deadlineDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 23, 59, 59);
  } else {
    deadlineDate = new Date(deadlineStr);
    deadlineDate.setHours(23, 59, 59, 999);
  }

  const now = new Date();
  // Strip time for exact date comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(deadlineDate.getFullYear(), deadlineDate.getMonth(), deadlineDate.getDate());

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      isClosed: true,
      isUrgent: false,
      daysRemaining: diffDays,
      label: "🔴 Registration Closed",
      shortLabel: "Closed",
      statusClass: "badge-closed"
    };
  } else if (diffDays === 0) {
    return {
      isClosed: false,
      isUrgent: true,
      daysRemaining: 0,
      label: "⏳ Closes Today!",
      shortLabel: "Closes Today",
      statusClass: "badge-urgent"
    };
  } else if (diffDays === 1) {
    return {
      isClosed: false,
      isUrgent: true,
      daysRemaining: 1,
      label: "⏳ 1 day remaining",
      shortLabel: "1 day left",
      statusClass: "badge-urgent"
    };
  } else if (diffDays <= 5) {
    return {
      isClosed: false,
      isUrgent: true,
      daysRemaining: diffDays,
      label: `⏳ ${diffDays} days remaining`,
      shortLabel: `${diffDays} days left`,
      statusClass: "badge-warning"
    };
  } else {
    return {
      isClosed: false,
      isUrgent: false,
      daysRemaining: diffDays,
      label: `⏳ ${diffDays} days remaining`,
      shortLabel: `${diffDays} days left`,
      statusClass: "badge-open"
    };
  }
}

/**
 * Return current ISO date string (YYYY-MM-DD)
 */
export function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
