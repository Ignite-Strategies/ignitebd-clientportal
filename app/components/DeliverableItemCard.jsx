'use client';

import { useRouter } from 'next/navigation';
import StatusBadge from './StatusBadge';

/**
 * DeliverableItemCard - Individual deliverable item card
 */
export default function DeliverableItemCard({ item }) {
  const router = useRouter();
  
  // Get first artifact if available
  const firstArtifact = item.artifacts && item.artifacts.length > 0 
    ? item.artifacts[0] 
    : null;
  const hasArtifacts = item.artifacts && item.artifacts.length > 0;
  const artifactCount = item.artifacts?.length || 0;

  const handleView = () => {
    if (hasArtifacts && firstArtifact) {
      router.push(`/client/work/artifacts/${firstArtifact.id}`);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border border-gray-700 rounded-lg bg-gray-800 hover:bg-gray-750 transition">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <h4 className="font-semibold text-white">{item.deliverableName || item.deliverableLabel || 'Deliverable'}</h4>
          <StatusBadge status={item.status || 'not_started'} />
        </div>
        {item.deliverableDescription && (
          <p className="text-sm text-gray-400 mt-1">{item.deliverableDescription}</p>
        )}
        {hasArtifacts && (
          <p className="text-xs text-gray-500 mt-1">
            {artifactCount} {artifactCount === 1 ? 'artifact' : 'artifacts'} available
          </p>
        )}
      </div>
      <div>
        {hasArtifacts ? (
          <button
            onClick={handleView}
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            View
          </button>
        ) : (
          <span className="px-4 py-2 text-gray-400 font-semibold">
            Not Started
          </span>
        )}
      </div>
    </div>
  );
}

