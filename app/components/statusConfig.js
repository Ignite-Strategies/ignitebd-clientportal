/**
 * Status Configuration for Client Portal
 * Client-friendly status labels and styling
 */
export const WORK_STATUS_CONFIG = {
  not_started: {
    label: "Not Started",
    color: "bg-gray-700 text-gray-300 border border-gray-600"
  },
  in_progress: {
    label: "In Progress",
    color: "bg-blue-600/20 text-blue-400 border border-blue-500/50"
  },
  completed: {
    label: "Completed",
    color: "bg-green-600/20 text-green-400 border border-green-500/50"
  },
  waiting_client: {
    label: "Waiting on Client",
    color: "bg-yellow-600/20 text-yellow-400 border border-yellow-500/50"
  },
  blocked: {
    label: "Blocked",
    color: "bg-red-600/20 text-red-400 border border-red-500/50"
  }
};

/**
 * Get status config for a status string
 * Normalizes status to match config keys
 */
export function getStatusConfig(status) {
  if (!status) return WORK_STATUS_CONFIG.not_started;
  
  // Normalize status: lowercase, replace spaces with underscores
  const normalized = status.toLowerCase().replace(/\s+/g, '_');
  
  return WORK_STATUS_CONFIG[normalized] || WORK_STATUS_CONFIG.not_started;
}

