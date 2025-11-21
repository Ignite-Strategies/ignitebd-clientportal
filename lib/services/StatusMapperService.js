/**
 * StatusMapperService
 * Mirrors IgniteBD-execution statusConfig.js exactly
 * Single source of truth for mapping WorkPackageItem status
 * Everything reads from database - no derivation
 */

// Re-export from statusConfig for backward compatibility
export {
  STATUS_VALUES,
  STATUS_LABELS,
  STATUS_LABELS_CLIENT,
  STATUS_COLORS,
  STATUS_ORDER,
  getStatusConfig,
  getStatusOptions,
  isValidStatus,
  getStatusLabel,
  getStatusColor,
  mapItemStatus,
} from '@/app/components/statusConfig';

// Legacy exports for backward compatibility
export const STATUS_MAP = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "Needs Review",
  CHANGES_NEEDED: "Changes Requested",
  CHANGES_IN_PROGRESS: "Changes Being Made",
  APPROVED: "Completed"
};

