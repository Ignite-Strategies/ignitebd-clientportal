import React from 'react';
import { proposalData } from '../data/mockData';

const Proposal = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Proposal for {proposalData.client.company}</h1>
          <p className="text-gray-600">Issued {proposalData.proposal.dateIssued} • {proposalData.proposal.duration}</p>
        </div>

        {/* Purpose Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Purpose</h2>
          <p className="text-gray-700">
            <strong>To successfully onboard {proposalData.purpose.headline}</strong>,{' '}
            {proposalData.purpose.description}
          </p>
        </div>

        {/* Phases */}
        <div className="space-y-6 mb-6">
          {proposalData.phases.map((phase) => (
            <div key={phase.id} className="bg-white rounded-lg shadow p-6">
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
              <h3 className="text-lg font-semibold mb-2">{phase.goal}</h3>
              <div className="mb-4">
                <h4 className="font-medium mb-2">Deliverables:</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {phase.deliverables.map((deliverable, idx) => (
                    <li key={idx}>{deliverable}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <p className="text-sm text-gray-700"><strong>Outcome:</strong> {phase.outcome}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Compensation */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Compensation</h2>
          <p className="text-2xl font-bold text-red-600 mb-4">
            ${proposalData.proposal.total.toLocaleString()}
          </p>
          <div className="space-y-3">
            {proposalData.payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between border-b pb-3">
                <div>
                  <p className="font-medium">${payment.amount.toLocaleString()} - Week {payment.week}</p>
                  <p className="text-sm text-gray-600">{payment.trigger}: {payment.description}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  payment.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {payment.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Timeline</h2>
          <div className="space-y-4">
            {proposalData.timeline.map((milestone, idx) => (
              <div key={idx} className="flex items-start gap-4 border-l-2 border-gray-200 pl-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm ${
                  milestone.phaseColor === 'red' ? 'bg-red-600' :
                  milestone.phaseColor === 'yellow' ? 'bg-yellow-600' :
                  'bg-purple-600'
                }`}>
                  {milestone.week}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{milestone.milestone}</p>
                  <p className="text-sm text-gray-600">{milestone.deliverable}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Proposal;
