/**
 * Status Configuration for Client Portal
 * Matches IgniteBD execution exactly - 5 canonical statuses
 * Client-friendly status labels and styling
 * 
 * Canonical Status Values:
 * - NOT_STARTED
 * - IN_PROGRESS
 * - NEEDS_REVIEW
 * - CHANGES_IN_PROGRESS
 * - APPROVED
 */

export const STATUS_VALUES = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  NEEDS_REVIEW: 'NEEDS_REVIEW',
  CHANGES_IN_PROGRESS: 'CHANGES_IN_PROGRESS',
  APPROVED: 'APPROVED',
};

export const STATUS_LABELS = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  NEEDS_REVIEW: 'Needs Review',
  CHANGES_IN_PROGRESS: 'Changes In Progress',
  APPROVED: 'Approved',
};

export const STATUS_LABELS_CLIENT = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  NEEDS_REVIEW: 'Needs Review',
  CHANGES_IN_PROGRESS: 'Changes Being Made',
  APPROVED: 'Completed',
};

export const STATUS_COLORS = {
  NOT_STARTED: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  NEEDS_REVIEW: 'bg-yellow-100 text-yellow-800',
  CHANGES_IN_PROGRESS: 'bg-purple-100 text-purple-800',
  APPROVED: 'bg-green-100 text-green-800',
};

export const STATUS_ORDER = [
  STATUS_VALUES.NOT_STARTED,
  STATUS_VALUES.IN_PROGRESS,
  STATUS_VALUES.NEEDS_REVIEW,
  STATUS_VALUES.CHANGES_IN_PROGRESS,
  STATUS_VALUES.APPROVED,
];

/**
 * Legacy config object (for backward compatibility with StatusBadge)
 */
export const WORK_STATUS_CONFIG = {
  NOT_STARTED: {
    label: STATUS_LABELS_CLIENT.NOT_STARTED,
    color: STATUS_COLORS.NOT_STARTED,
  },
  IN_PROGRESS: {
    label: STATUS_LABELS_CLIENT.IN_PROGRESS,
    color: STATUS_COLORS.IN_PROGRESS,
  },
  NEEDS_REVIEW: {
    label: STATUS_LABELS_CLIENT.NEEDS_REVIEW,
    color: STATUS_COLORS.NEEDS_REVIEW,
  },
  CHANGES_IN_PROGRESS: {
    label: STATUS_LABELS_CLIENT.CHANGES_IN_PROGRESS,
    color: STATUS_COLORS.CHANGES_IN_PROGRESS,
  },
  APPROVED: {
    label: STATUS_LABELS_CLIENT.APPROVED,
    color: STATUS_COLORS.APPROVED,
  },
};

/**
 * Get status config for a status string
 * Normalizes status to match config keys
 * Maps old statuses to new canonical statuses
 */
export function getStatusConfig(status, clientView = true) {
  if (!status) return WORK_STATUS_CONFIG.NOT_STARTED;
  
  // Normalize status: uppercase and trim
  const normalized = String(status).toUpperCase().trim();
  
  // Map old statuses to new canonical statuses
  const statusMap = {
    'DRAFT': STATUS_VALUES.NOT_STARTED,
    'COMPLETED': STATUS_VALUES.APPROVED,
    'IN_REVIEW': STATUS_VALUES.NEEDS_REVIEW,
    'CHANGES_NEEDED': STATUS_VALUES.CHANGES_IN_PROGRESS,
    'NEEDS_REVIEW': STATUS_VALUES.NEEDS_REVIEW,
    'CHANGES_IN_PROGRESS': STATUS_VALUES.CHANGES_IN_PROGRESS,
    'NOT_STARTED': STATUS_VALUES.NOT_STARTED,
    'IN_PROGRESS': STATUS_VALUES.IN_PROGRESS,
    'APPROVED': STATUS_VALUES.APPROVED,
  };
  
  // Get canonical status
  const canonicalStatus = statusMap[normalized] || STATUS_VALUES.NOT_STARTED;
  
  return WORK_STATUS_CONFIG[canonicalStatus] || WORK_STATUS_CONFIG.NOT_STARTED;
}

/**
 * Get status label only
 */
export function getStatusLabel(status, clientView = true) {
  const config = getStatusConfig(status, clientView);
  return config.label;
}

/**
 * Get status color only
 */
export function getStatusColor(status) {
  const config = getStatusConfig(status);
  return config.color;
}

/**
 * Validate if a status is valid
 */
export function isValidStatus(status) {
  if (!status) return false;
  return Object.values(STATUS_VALUES).includes(String(status).toUpperCase());
}

/**
 * Get all statuses as array for dropdown options
 */
export function getStatusOptions(clientView = true) {
  const labels = clientView ? STATUS_LABELS_CLIENT : STATUS_LABELS;
  
  return STATUS_ORDER.map((value) => ({
    value,
    label: labels[value],
  }));
}

/**
 * Maps a WorkPackageItem to its current status
 * Uses item.status directly from database (owner updates manually in execution hub)
 * Everything reads from DB - no derivation
 * Normalizes to canonical 5-status system
 * 
 * @param {Object} item - WorkPackageItem object (must have status field)
 * @param {Array} workCollateral - Array of WorkCollateral objects (for future use)
 * @returns {"NOT_STARTED" | "IN_PROGRESS" | "NEEDS_REVIEW" | "CHANGES_IN_PROGRESS" | "APPROVED"}
 */
export function mapItemStatus(item, workCollateral = []) {
  // Use item.status directly from database (owner manually updates via execution hub)
  // Everything reads from DB - no derivation
  if (!item || !item.status) {
    return STATUS_VALUES.NOT_STARTED;
  }
  
  // Normalize enum value (Prisma returns enum as string)
  const rawStatus = String(item.status).toUpperCase().trim();
  
  // Map database enum values to canonical values
  const statusMap = {
    // Old enum values → canonical
    'DRAFT': STATUS_VALUES.NOT_STARTED,
    'COMPLETED': STATUS_VALUES.APPROVED,
    'IN_REVIEW': STATUS_VALUES.NEEDS_REVIEW,
    'CHANGES_NEEDED': STATUS_VALUES.CHANGES_IN_PROGRESS,
    // Canonical values (pass through)
    'NEEDS_REVIEW': STATUS_VALUES.NEEDS_REVIEW,
    'CHANGES_IN_PROGRESS': STATUS_VALUES.CHANGES_IN_PROGRESS,
    'NOT_STARTED': STATUS_VALUES.NOT_STARTED,
    'IN_PROGRESS': STATUS_VALUES.IN_PROGRESS,
    'APPROVED': STATUS_VALUES.APPROVED,
  };
  
  // Return mapped status or default to NOT_STARTED
  return statusMap[rawStatus] || STATUS_VALUES.NOT_STARTED;
}
