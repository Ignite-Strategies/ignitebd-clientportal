import React from 'react';

const HeroHeader = ({ companyName, dateIssued, duration, status, purposeHeadline }) => {
  const scrollToContent = () => {
    window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
  };

  return (
    <div className="relative bg-gradient-to-r from-red-600 via-orange-600 to-red-600 rounded-t-2xl overflow-hidden">
      <div className="bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-3xl">🔥</span>
              <h1 className="text-4xl md:text-5xl font-bold text-white">Proposal</h1>
            </div>
            
            {/* Ignite × Company */}
            <div className="text-sm font-semibold uppercase tracking-wider mb-2 text-white/90">
              Ignite × {companyName}
            </div>
            
            {/* Official Statement */}
            <p className="text-lg text-white/90 mb-6 max-w-2xl mx-auto">
              Proposal created for {companyName}
            </p>

            {/* Purpose Statement */}
            <p className="text-base text-white/80 mb-8 max-w-3xl mx-auto">
              The following is provided for {companyName} to {purposeHeadline}.
            </p>

            {/* Navigation Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
              <button
                onClick={() => {
                  scrollToContent();
                  setTimeout(() => {
                    document.getElementById('scope-of-work')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 100);
                }}
                className="px-6 py-3 bg-white text-red-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
              >
                Scope of Work
              </button>
              <button
                onClick={() => {
                  scrollToContent();
                  setTimeout(() => {
                    document.getElementById('compensation')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 100);
                }}
                className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-lg hover:bg-white/30 transition-colors border border-white/30"
              >
                Compensation
              </button>
              <button
                onClick={() => {
                  scrollToContent();
                  setTimeout(() => {
                    document.getElementById('timeline')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 100);
                }}
                className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-lg hover:bg-white/30 transition-colors border border-white/30"
              >
                Timeline
              </button>
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-white/80">
              <span>Issued: {dateIssued}</span>
              <span>·</span>
              <span>Duration: {duration}</span>
              <span>·</span>
              <span className="flex items-center gap-2">
                Status: 
                <span className={`px-3 py-1 rounded-full font-semibold text-xs ${
                  status === 'Active' ? 'bg-blue-100 text-blue-700' :
                  status === 'Approved' ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {status}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroHeader;
