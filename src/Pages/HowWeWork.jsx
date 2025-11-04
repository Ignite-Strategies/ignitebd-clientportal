import React, { useState } from 'react';

const personaExamples = [
  {
    id: 'persona1',
    name: 'General Counsel at Mid-Size Tech Company',
    title: 'Persona 1',
    description: 'In-house legal leader responsible for contract management and compliance. Needs efficient NDA processes and contract templates.',
    demographics: '35-50 years old, 5-15 years legal experience',
    painPoints: 'High volume of contracts, need for speed and standardization',
    goals: 'Streamline contract workflows, reduce legal review time'
  },
  {
    id: 'persona2',
    name: 'VP of Operations at Growing Startup',
    title: 'Persona 2',
    description: 'Operations executive handling vendor relationships and partnership agreements. Values legal protection without slowing down business velocity.',
    demographics: '28-45 years old, business-focused with legal awareness',
    painPoints: 'Complex legal language, need for business-friendly solutions',
    goals: 'Fast, understandable legal agreements that protect the business'
  },
  {
    id: 'persona3',
    name: 'Founder/CEO of Series A Company',
    title: 'Persona 3',
    description: 'Entrepreneur focused on growth and fundraising. Needs clean legal processes that don\'t distract from core business operations.',
    demographics: '30-50 years old, technical or business background',
    painPoints: 'Legal complexity slowing down deals, cost concerns',
    goals: 'Efficient legal operations that support fundraising and growth'
  }
];

const HowWeWork = () => {
  const [feedback, setFeedback] = useState({
    persona1: '',
    persona2: '',
    persona3: ''
  });

  const handleAction = (personaId, action) => {
    const persona = personaExamples.find(p => p.id === personaId);
    console.log(`Action for ${persona?.title}:`, action);
    console.log(`Feedback:`, feedback[personaId]);
    // TODO: Implement actual submission logic
    alert(`${action} for ${persona?.title}!\n\nFeedback: ${feedback[personaId] || 'No feedback provided'}`);
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
              <p className="font-semibold text-gray-900">Send Back to Ignite</p>
            </div>
          </div>
          <p className="text-gray-700 text-center">
            Review each deliverable, provide feedback, and send back to Ignite with your decision.
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
            {personaExamples.map((persona) => (
              <div key={persona.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">{persona.title}</h4>
                  <div className="bg-white rounded p-3 min-h-[200px] border border-gray-200">
                    <p className="text-sm font-semibold text-gray-900 mb-2">{persona.name}</p>
                    <p className="text-xs text-gray-700 mb-3">{persona.description}</p>
                    <div className="space-y-1 text-xs text-gray-600">
                      <p><strong>Demographics:</strong> {persona.demographics}</p>
                      <p><strong>Pain Points:</strong> {persona.painPoints}</p>
                      <p><strong>Goals:</strong> {persona.goals}</p>
                    </div>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Feedback
                  </label>
                  <textarea
                    value={feedback[persona.id]}
                    onChange={(e) => setFeedback({...feedback, [persona.id]: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    rows="3"
                    placeholder="Leave your feedback here..."
                  />
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => handleAction(persona.id, 'Looks Good - Approved')}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
                  >
                    Looks Good - Approved
                  </button>
                  <button
                    onClick={() => handleAction(persona.id, 'Make Changes and Then Good')}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
                  >
                    Make Changes and Then Good
                  </button>
                  <button
                    onClick={() => handleAction(persona.id, 'I Want to See One More Time')}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
                  >
                    I Want to See One More Time
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">About This Workbench</h2>
          <p className="text-gray-700 mb-4">
            As we complete deliverables, they'll appear in this workbench. You can review each item, 
            provide feedback directly in the feedback box, and send it back to Ignite with one of three actions:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li><strong>Looks Good - Approved:</strong> Approve the deliverable as-is</li>
            <li><strong>Make Changes and Then Good:</strong> Request changes before approval</li>
            <li><strong>I Want to See One More Time:</strong> Request a revision to review again</li>
          </ul>
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

