'use client';

import DeliverableItemCard from './DeliverableItemCard';

/**
 * PhaseCard - Phase card with items
 * @param {Object} phase - Phase object with items
 * @param {boolean} expanded - Whether phase is expanded
 * @param {function} onToggle - Toggle expand/collapse
 */
export default function PhaseCard({ phase, expanded = false, onToggle }) {
  const itemCount = phase.items?.length || 0;
  const completedCount = phase.items?.filter(item => (item.status || '').toLowerCase() === 'completed').length || 0;
  const progress = itemCount > 0 ? Math.round((completedCount / itemCount) * 100) : 0;

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
      {/* Phase Header */}
      <div 
        className="p-6 border-b border-gray-700 cursor-pointer hover:bg-gray-800 transition"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-white">{phase.name}</h3>
              {phase.position && (
                <span className="px-2 py-1 rounded-full bg-gray-700 text-gray-300 text-xs font-medium">
                  Phase {phase.position}
                </span>
              )}
            </div>
            {phase.description && (
              <p className="text-sm text-gray-400 mt-1">{phase.description}</p>
            )}
            {phase.totalEstimatedHours && (
              <p className="text-xs text-gray-500 mt-2">
                Estimated: {phase.totalEstimatedHours} hours
              </p>
            )}
            {itemCount > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                  <span>Progress</span>
                  <span>{completedCount} of {itemCount} completed</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="ml-4">
            <svg 
              className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Phase Items (when expanded) */}
      {expanded && phase.items && phase.items.length > 0 && (
        <div className="p-6 space-y-3">
          {phase.items.map((item) => (
            <DeliverableItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

