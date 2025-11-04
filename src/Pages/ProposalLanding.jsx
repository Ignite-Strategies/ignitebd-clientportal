import React from 'react';
import { useNavigate } from 'react-router-dom';
import { proposalData } from '../data/mockData';

const ProposalLanding = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Logo */}
        <div className="mb-6">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🔥</span>
            <span className="text-xl font-bold text-gray-900">Ignite</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 md:p-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Ignite × {proposalData.client.company} — Foundation & Growth Proposal
            </h1>
            <p className="text-lg text-gray-600 mb-4">
              {proposalData.proposal.duration} Program · ${proposalData.proposal.total.toLocaleString()} Total · {proposalData.payments.length} Payments of ${proposalData.payments[0].amount.toLocaleString()}
            </p>
            <p className="text-base text-gray-700">
              Bringing {proposalData.client.company}'s business-development stack online through strategy, integrations, and enrichment.
            </p>
          </div>

          {/* Body Copy */}
          <div className="mb-12">
            <p className="text-gray-700 text-lg leading-relaxed mb-4">
              It's our pleasure to collaborate with you on this engagement.
            </p>
            <p className="text-gray-700 text-lg leading-relaxed">
              This interactive proposal outlines our shared roadmap — what we'll build, how we'll execute, and how we'll keep everything transparent from start to finish.
            </p>
          </div>

          {/* Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Foundation & Content Plan */}
            <div className="bg-rose-50 rounded-lg p-6 hover:shadow-md transition-shadow border border-rose-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Foundation & Content Plan</h3>
              <p className="text-gray-700 mb-4">
                Strategy, CLE deck, and deliverables
              </p>
              <button
                onClick={() => navigate('/proposal')}
                className="text-[#f97316] font-medium hover:bg-gradient-to-r hover:from-rose-500 hover:to-amber-400 hover:bg-clip-text hover:text-transparent inline-flex items-center transition-all"
              >
                View Foundation →
              </button>
            </div>

            {/* Timeline & Milestones */}
            <div className="bg-amber-50 rounded-lg p-6 hover:shadow-md transition-shadow border border-amber-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Timeline & Milestones</h3>
              <p className="text-gray-700 mb-4">
                Key phases, {proposalData.proposal.duration.toLowerCase()} milestones, and payments
              </p>
              <button
                onClick={() => navigate('/timeline')}
                className="text-[#f97316] font-medium hover:bg-gradient-to-r hover:from-rose-500 hover:to-amber-400 hover:bg-clip-text hover:text-transparent inline-flex items-center transition-all"
              >
                View Timeline →
              </button>
            </div>

            {/* Integrations & Collaboration */}
            <div className="bg-violet-50 rounded-lg p-6 hover:shadow-md transition-shadow border border-violet-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Integrations & Collaboration</h3>
              <p className="text-gray-700 mb-4">
                Microsoft 365, Teams, and enrichment setup
              </p>
              <button
                onClick={() => navigate('/how-we-work')}
                className="text-[#f97316] font-medium hover:bg-gradient-to-r hover:from-rose-500 hover:to-amber-400 hover:bg-clip-text hover:text-transparent inline-flex items-center transition-all"
              >
                View Integrations →
              </button>
            </div>
          </div>

          {/* Reassurance line */}
          <p className="text-sm text-gray-600 text-center italic">
            Every section above links directly into your live engagement plan. Click any module to explore details.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProposalLanding;
