import React from 'react';

const HeroHeader = ({ companyName }) => {
  if (!companyName) {
    return null;
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          Proposal for {companyName}
        </h1>
      </div>
    </header>
  );
};

export default HeroHeader;
