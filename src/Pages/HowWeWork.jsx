import React from 'react';
import { proposalData } from '../data/mockData';

const HowWeWork = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Integrations & Collaboration</h1>
          <p className="text-lg text-gray-600">Access deliverables and provide feedback in this portal</p>
        </div>

        {/* Workbench Description */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Deliverables Workbench</h2>
          <p className="text-gray-700 mb-4">
            This portal is your central hub for accessing all deliverables throughout the engagement. 
            You'll have real-time access to documents, assets, and work in progress.
          </p>
          <p className="text-gray-700">
            Provide feedback directly on deliverables using the comment and feedback tools below. 
            All changes and updates are tracked transparently in this space.
          </p>
        </div>

        {/* Deliverables Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Deliverables by Phase</h2>
          <div className="space-y-4">
            {proposalData.phases.map((phase) => (
              <div key={phase.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    phase.color === 'red' ? 'bg-red-100 text-red-800' :
                    phase.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    Phase {phase.id}: {phase.name}
                  </span>
                  <span className="text-sm text-gray-600">Weeks {phase.weeks}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {phase.deliverables.map((deliverable, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <span className="text-gray-400">📄</span>
                      <span className="text-gray-700">{deliverable}</span>
                      <span className="ml-auto text-sm text-gray-500">View →</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feedback Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Provide Feedback</h2>
          <p className="text-gray-700 mb-4">
            Use this portal to review deliverables and provide feedback. Your comments and suggestions 
            will be visible to the team in real-time, keeping everything transparent and collaborative.
          </p>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">
              💡 <strong>Tip:</strong> Click on any deliverable above to access it and leave feedback directly on the document or asset.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowWeWork;

