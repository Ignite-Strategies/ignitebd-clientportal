import React from 'react';
import Navigation from '../Components/Navigation';
import { mockProposalData } from '../data/mockData';

const Proposal = () => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-800';
      case 'Submitted':
        return 'bg-blue-100 text-blue-800';
      case 'Approved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const handleApprove = () => {
    // Placeholder for future backend integration
    alert('Approval functionality will be connected to backend in future integration.');
  };

  const handleRequestChanges = () => {
    // Placeholder for future backend integration
    alert('Request changes functionality will be connected to backend in future integration.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Navigation />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                {mockProposalData.projectName}
              </h1>
              <p className="text-gray-600">Engagement Proposal</p>
            </div>
            <div className="mt-4 md:mt-0">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(mockProposalData.status)}`}>
                {mockProposalData.status}
              </span>
            </div>
          </div>

          {/* Progress Stepper */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-ignite-primary text-white flex items-center justify-center font-semibold">
                  1
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700">Proposal</span>
              </div>
              <div className="flex-1 h-0.5 bg-gray-300 mx-4"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-semibold">
                  2
                </div>
                <span className="ml-2 text-sm font-medium text-gray-500">Contract</span>
              </div>
              <div className="flex-1 h-0.5 bg-gray-300 mx-4"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-semibold">
                  3
                </div>
                <span className="ml-2 text-sm font-medium text-gray-500">Work Plan</span>
              </div>
            </div>
          </div>
        </div>

        {/* Proposal Details */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Project Details</h2>
          
          <div className="space-y-6">
            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700 leading-relaxed">{mockProposalData.description}</p>
            </div>

            {/* Scope Summary */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Scope Summary</h3>
              <p className="text-gray-700 leading-relaxed">{mockProposalData.scopeSummary}</p>
            </div>

            {/* Deliverables */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Deliverables</h3>
              <ul className="space-y-2">
                {mockProposalData.deliverables.map((deliverable, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-ignite-primary mr-2">✓</span>
                    <span className="text-gray-700">{deliverable}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Price */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Investment</h3>
                  <p className="text-sm text-gray-600">Total project cost</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-ignite-primary">
                    {formatCurrency(mockProposalData.price, mockProposalData.currency)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleApprove}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors shadow-md hover:shadow-lg"
            >
              Approve Proposal
            </button>
            <button
              onClick={handleRequestChanges}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              Request Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Proposal;

