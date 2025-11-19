/**
 * WorkPackageDashboardService
 * Dashboard brain - computes stats, phases, review items, and CTAs
 */

import { mapItemStatus } from "./StatusMapperService";

/**
 * Compute dashboard statistics from work package items
 * 
 * @param {Object} workPackage - WorkPackage object with items array
 * @returns {Object} Dashboard stats
 */
export function computeDashboardStats(workPackage) {
  const items = workPackage.items || [];

  const totals = {
    total: items.length,
    completed: 0,
    inProgress: 0,
    notStarted: 0,
    needsReview: 0,
  };

  items.forEach((item) => {
    const status = mapItemStatus(item, item.workCollateral || []);
    
    if (status === "COMPLETED") {
      totals.completed++;
    } else if (status === "IN_PROGRESS") {
      totals.inProgress++;
    } else if (status === "NEEDS_REVIEW") {
      totals.needsReview++;
    } else {
      totals.notStarted++;
    }
  });

  return totals;
}

/**
 * Get items that need client review
 * 
 * @param {Object} workPackage - WorkPackage object with items array
 * @returns {Array} Items that need review
 */
export function getNeedsReviewItems(workPackage) {
  return (workPackage.items || []).filter((item) => {
    const status = mapItemStatus(item, item.workCollateral || []);
    return status === "NEEDS_REVIEW";
  });
}

/**
 * Determine if a phase is complete
 * 
 * @param {Object} phase - WorkPackagePhase object with items array
 * @returns {boolean} Whether phase is complete
 */
function isPhaseComplete(phase) {
  if (!phase.items || phase.items.length === 0) return false;
  return phase.items.every((item) => {
    const status = mapItemStatus(item, item.workCollateral || []);
    return status === "COMPLETED";
  });
}

/**
 * Get current phase index based on completion logic
 * 
 * @param {Array} phases - Array of WorkPackagePhase objects
 * @returns {number} Current phase index
 */
function getCurrentPhaseIndex(phases) {
  if (!phases || phases.length === 0) return 0;

  for (let i = 0; i < phases.length; i++) {
    if (!isPhaseComplete(phases[i])) {
      return i;
    }
  }

  // All phases complete, return last phase
  return phases.length - 1;
}

/**
 * Get phase data (current phase, next phase, current phase items)
 * 
 * @param {Object} workPackage - WorkPackage object with phases and items
 * @returns {Object} Phase data with currentPhase, nextPhase, currentPhaseItems
 */
export function getPhaseData(workPackage) {
  const phases = workPackage.phases || [];
  const items = workPackage.items || [];

  if (phases.length === 0) {
    return {
      currentPhase: null,
      nextPhase: null,
      currentPhaseItems: [],
    };
  }

  const currentPhaseIndex = getCurrentPhaseIndex(phases);
  const currentPhase = phases[currentPhaseIndex] || null;
  const nextPhaseIndex = currentPhaseIndex + 1;
  const nextPhase = phases[nextPhaseIndex] || null;

  // Get items for current phase
  const currentPhaseItems =
    currentPhase && currentPhase.id
      ? items.filter((item) => item.workPackagePhaseId === currentPhase.id)
      : [];

  return {
    currentPhase,
    nextPhase,
    currentPhaseItems,
  };
}

/**
 * Compute dashboard CTA text based on project state
 * 
 * @param {Object} totals - Dashboard stats object
 * @returns {string} CTA text
 */
export function computeDashboardCTA(totals) {
  if (totals.needsReview > 0) {
    return "You Have Work to Review";
  }
  if (totals.inProgress > 0) {
    return "Continue Your Work";
  }
  return "Start Next Deliverable";
}

