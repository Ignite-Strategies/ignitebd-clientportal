import React, { useState } from 'react';

const HowWeWork = () => {
  const [feedback, setFeedback] = useState({
    persona1: '',
    persona2: '',
    persona3: ''
  });

  const handleSubmit = (id) => {
    console.log(`Submitting feedback for ${id}:`, feedback[id]);
    // TODO: Implement actual submission logic
    alert(`Feedback submitted for ${id}!`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Integrations & Collaboration</h1>
          <p className="text-lg text-gray-600">Access deliverables and provide feedback in this portal</p>
        </div>

        {/* Workflow Description */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">How You'll See It</h2>
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">📋</div>
              <p className="font-semibold text-gray-900">Deliverable</p>
            </div>
            <div className="text-2xl text-gray-400">→</div>
            <div className="bg-amber-50 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">✅</div>
              <p className="font-semibold text-gray-900">Ignite Completes</p>
            </div>
            <div className="text-2xl text-gray-400">→</div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">✓</div>
              <p className="font-semibold text-gray-900">Submit for Approval</p>
            </div>
          </div>
          <p className="text-gray-700 text-center">
            Review each deliverable, provide feedback, and submit for approval when ready.
          </p>
        </div>

        {/* Workbench Example */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-6">Workbench Example</h2>
          
          {/* Item Header */}
          <div className="mb-6 pb-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Item: Personas</h3>
            <p className="text-sm text-gray-600 mt-1">3 target personas for BusinessPoint Law</p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Card 1 */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">Persona 1</h4>
                <div className="bg-white rounded p-3 min-h-[100px] border border-gray-200">
                  <p className="text-sm text-gray-600">Persona details will appear here...</p>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback
                </label>
                <textarea
                  value={feedback.persona1}
                  onChange={(e) => setFeedback({...feedback, persona1: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows="3"
                  placeholder="Leave your feedback here..."
                />
              </div>
              <button
                onClick={() => handleSubmit('persona1')}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
              >
                Submit
              </button>
            </div>

            {/* Card 2 */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">Persona 2</h4>
                <div className="bg-white rounded p-3 min-h-[100px] border border-gray-200">
                  <p className="text-sm text-gray-600">Persona details will appear here...</p>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback
                </label>
                <textarea
                  value={feedback.persona2}
                  onChange={(e) => setFeedback({...feedback, persona2: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows="3"
                  placeholder="Leave your feedback here..."
                />
              </div>
              <button
                onClick={() => handleSubmit('persona2')}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
              >
                Submit
              </button>
            </div>

            {/* Card 3 */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">Persona 3</h4>
                <div className="bg-white rounded p-3 min-h-[100px] border border-gray-200">
                  <p className="text-sm text-gray-600">Persona details will appear here...</p>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback
                </label>
                <textarea
                  value={feedback.persona3}
                  onChange={(e) => setFeedback({...feedback, persona3: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows="3"
                  placeholder="Leave your feedback here..."
                />
              </div>
              <button
                onClick={() => handleSubmit('persona3')}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
              >
                Submit
              </button>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">About This Workbench</h2>
          <p className="text-gray-700 mb-4">
            As we complete deliverables, they'll appear in this workbench. You can review each item, 
            provide feedback directly in the feedback box, and submit when you're ready to approve.
          </p>
          <p className="text-gray-700">
            All feedback is tracked and visible to the team in real-time, keeping everything transparent 
            and collaborative throughout the engagement.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HowWeWork;

