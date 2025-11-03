import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../Components/Navigation';
import { mockClientData } from '../data/mockData';

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          {/* Welcome Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Welcome, {mockClientData.clientName}
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Thanks for taking the time to review your Ignite proposal.
            </p>
          </div>

          {/* Intro Copy */}
          <div className="prose prose-lg max-w-none mb-8 text-gray-700">
            <p className="text-lg leading-relaxed mb-6">
              We're excited to partner with you on this engagement. This portal gives you full 
              transparency into the proposal, timeline, and how we'll work together.
            </p>
            <p className="text-lg leading-relaxed">
              Everything you need is here—no surprises, no hidden details. You can review the 
              proposal, understand the execution plan, and see exactly how we'll collaborate 
              throughout the engagement.
            </p>
          </div>

          {/* Navigation Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Proposal Overview</h3>
              <p className="text-sm text-gray-600 mb-4">
                Review project details, scope, deliverables, and pricing
              </p>
              <button
                onClick={() => navigate('/proposal')}
                className="text-sm font-medium text-ignite-primary hover:text-ignite-secondary"
              >
                View Proposal →
              </button>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Timeline & Execution</h3>
              <p className="text-sm text-gray-600 mb-4">
                See key milestones, dates, and project phases
              </p>
              <button
                onClick={() => navigate('/timeline')}
                className="text-sm font-medium text-ignite-primary hover:text-ignite-secondary"
              >
                View Timeline →
              </button>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How We'll Work Together</h3>
              <p className="text-sm text-gray-600 mb-4">
                Understand our working principles and collaboration approach
              </p>
              <button
                onClick={() => navigate('/how-we-work')}
                className="text-sm font-medium text-ignite-primary hover:text-ignite-secondary"
              >
                Learn More →
              </button>
            </div>
          </div>

          {/* CTA Button */}
          <div className="text-center">
            <button
              onClick={() => navigate('/proposal')}
              className="bg-ignite-primary hover:bg-ignite-secondary text-white font-semibold px-8 py-4 rounded-lg text-lg transition-colors shadow-lg hover:shadow-xl"
            >
              View Proposal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;

