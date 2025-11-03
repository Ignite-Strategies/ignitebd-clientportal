import React from 'react';
import Navigation from '../Components/Navigation';
import { mockWorkingPrinciples, mockTeamData } from '../data/mockData';

const HowWeWork = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Navigation />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How We'll Work Together
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Direct, transparent, and fast. This is how we stay aligned and deliver results.
          </p>
        </div>

        {/* Main Copy */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
            <p className="text-lg leading-relaxed">
              <strong>You'll have access to this portal at all times.</strong> Everything about 
              your engagement—proposals, timelines, deliverables, and progress—is visible here. 
              No need to email back and forth for updates.
            </p>
            <p className="text-lg leading-relaxed">
              <strong>If you want something modified, you can comment or edit directly in here.</strong> 
              We've built this portal to be collaborative. Need changes? Have questions? It all 
              happens transparently in this space.
            </p>
            <p className="text-lg leading-relaxed font-semibold text-ignite-primary">
              We move fast and transparently—this is how we stay aligned.
            </p>
          </div>
        </div>

        {/* Working Principles */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Working Principles</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {mockWorkingPrinciples.map((principle, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-gray-50 to-blue-50 p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {principle.title}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {principle.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Meet Your Team */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Meet Your Team</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {mockTeamData.teamMembers.map((member) => (
              <div
                key={member.id}
                className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-xl border border-purple-200 text-center hover:shadow-md transition-shadow"
              >
                <div className="text-5xl mb-4">{member.avatar}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {member.name}
                </h3>
                <p className="text-sm font-medium text-ignite-primary mb-3">
                  {member.role}
                </p>
                <p className="text-sm text-gray-600">
                  {member.bio}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Portal Access Note */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl shadow-lg p-6 mt-8 border border-blue-200">
          <div className="flex items-start">
            <div className="text-2xl mr-4">💡</div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Portal Access
              </h3>
              <p className="text-gray-700 text-sm">
                This portal is your single source of truth. Bookmark it, check it anytime, 
                and use it to stay aligned with your engagement. All updates, documents, 
                and communications will be centralized here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowWeWork;

