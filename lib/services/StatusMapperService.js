/**
 * StatusMapperService
 * Single source of truth for mapping WorkPackageItem status based on item and workCollateral
 */

/**
 * Maps a WorkPackageItem to its current status based on item status and workCollateral
 * Priority: NEEDS_REVIEW > COMPLETED > IN_PROGRESS > NOT_STARTED
 * 
 * @param {Object} item - WorkPackageItem object
 * @param {Array} workCollateral - Array of WorkCollateral objects
 * @returns {"NOT_STARTED" | "IN_PROGRESS" | "NEEDS_REVIEW" | "COMPLETED"}
 */
export function mapItemStatus(item, workCollateral = []) {
  // Needs Review takes priority - check if any workCollateral is in review
  if (workCollateral && workCollateral.length > 0) {
    const hasReviewRequested = workCollateral.some(
      (c) => c.status === "IN_REVIEW" || c.reviewRequestedAt != null
    );
    if (hasReviewRequested) {
      return "NEEDS_REVIEW";
    }
  }

  // Completed item
  const itemStatus = (item.status || "").toLowerCase();
  if (itemStatus === "completed" || itemStatus === "complete") {
    return "COMPLETED";
  }

  // In progress if any workCollateral exist (work has started)
  if (workCollateral && workCollateral.length > 0) {
    return "IN_PROGRESS";
  }

  // Default to not started
  return "NOT_STARTED";
}

