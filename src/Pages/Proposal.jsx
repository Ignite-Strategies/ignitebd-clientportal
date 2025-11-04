import React from 'react';
import { proposalData } from '../data/mockData';

const Proposal = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm p-8 md:p-12">
          {/* Title */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Proposal</h1>
          <p className="text-lg text-gray-600 mb-8">Proposal created for {proposalData.client.company}</p>

          {/* Welcome Message */}
          <div className="mb-12">
            <p className="text-gray-700 text-lg leading-relaxed mb-4">
              It's our pleasure to serve you on this engagement. This portal provides full transparency into the proposal, timeline, and how we'll work together.
            </p>
            <p className="text-gray-700 text-lg leading-relaxed">
              Everything you need is here—no surprises, no hidden details. You can review the proposal, understand the execution plan, and see exactly how we'll collaborate throughout the engagement.
            </p>
          </div>

          {/* Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Proposal Overview Card */}
            <div className="bg-blue-50 rounded-lg p-6 hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Proposal Overview</h3>
              <p className="text-gray-700 mb-4">
                Review project details, scope, deliverables, and pricing
              </p>
              <a href="#proposal-overview" className="text-red-600 font-medium hover:text-red-700 inline-flex items-center">
                View Proposal →
              </a>
            </div>

            {/* Timeline & Execution Card */}
            <div className="bg-purple-50 rounded-lg p-6 hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Timeline & Execution</h3>
              <p className="text-gray-700 mb-4">
                See key milestones, dates, and project phases
              </p>
              <a href="#timeline" className="text-red-600 font-medium hover:text-red-700 inline-flex items-center">
                View Timeline →
              </a>
            </div>

            {/* How We'll Work Together Card */}
            <div className="bg-green-50 rounded-lg p-6 hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">How We'll Work Together</h3>
              <p className="text-gray-700 mb-4">
                Understand our working principles and collaboration approach
              </p>
              <a href="#how-we-work" className="text-red-600 font-medium hover:text-red-700 inline-flex items-center">
                Learn More →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Proposal;
