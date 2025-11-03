import React from 'react';
import Navigation from '../Components/Navigation';
import { mockTimelineData } from '../data/mockData';

const Timeline = () => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Upcoming':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Navigation />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Timeline & Execution
          </h1>
          <p className="text-lg text-gray-600">
            Total project duration: <span className="font-semibold">{mockTimelineData.totalDuration}</span>
          </p>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300"></div>

            {/* Milestones */}
            <div className="space-y-8">
              {mockTimelineData.milestones.map((milestone, index) => (
                <div key={milestone.id} className="relative flex items-start">
                  {/* Timeline Dot */}
                  <div className="relative z-10 flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-ignite-primary text-white flex items-center justify-center font-bold text-lg shadow-lg">
                      {index + 1}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="ml-6 flex-1">
                    <div className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:shadow-md transition-shadow">
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-2 sm:mb-0">
                          {milestone.title}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(milestone.status)}`}>
                          {milestone.status}
                        </span>
                      </div>

                      {/* Date & Duration */}
                      <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <span className="font-semibold mr-2">Target Date:</span>
                          <span>{formatDate(milestone.targetDate)}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-semibold mr-2">Duration:</span>
                          <span>{milestone.duration}</span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-gray-700 leading-relaxed">
                        {milestone.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl shadow-lg p-8 mt-8 border border-blue-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Summary</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Milestones</p>
              <p className="text-2xl font-bold text-ignite-primary">
                {mockTimelineData.milestones.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Project Duration</p>
              <p className="text-2xl font-bold text-ignite-primary">
                {mockTimelineData.totalDuration}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Start Date</p>
              <p className="text-2xl font-bold text-ignite-primary">
                {formatDate(mockTimelineData.milestones[0].targetDate)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;

