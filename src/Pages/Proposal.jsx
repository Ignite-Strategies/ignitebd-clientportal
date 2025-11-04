import React, { useState } from 'react';
import { proposalData } from '../data/mockData';
import HeroHeader from '../Components/HeroHeader';
import PurposeSection from '../Components/PurposeSection';
import PhaseCard from '../Components/PhaseCard';
import PaymentBar from '../Components/PaymentBar';
import InteractiveTimeline from '../Components/InteractiveTimeline';
import CLESpotlight from '../Components/CLESpotlight';
import FeedbackBox from '../Components/FeedbackBox';
import ApprovalFooter from '../Components/ApprovalFooter';
import ScrollToTop from '../Components/ScrollToTop';

const Proposal = () => {
  const [hoveredWeek, setHoveredWeek] = useState(null);
  const [isApproved, setIsApproved] = useState(false);

  const handleApprove = () => {
    setIsApproved(true);
    // Future: Lock page into read-only approved mode
  };

  return (
    <div className={`min-h-screen ${isApproved ? 'opacity-75' : ''}`}>
      {/* Hero / Header Layer */}
      <HeroHeader
        companyName={proposalData.client.company}
        dateIssued={proposalData.proposal.dateIssued}
        duration={proposalData.proposal.duration}
        status={proposalData.proposal.status}
        purposeHeadline={proposalData.purpose.headline}
      />

      {/* Purpose Section */}
      <PurposeSection purpose={proposalData.purpose} />

      {/* Scope of Work - Phase Cards */}
      <section id="scope-of-work" className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">
            Scope of Work
          </h2>
          <div className="space-y-6">
            {proposalData.phases.map((phase) => (
              <PhaseCard key={phase.id} phase={phase} />
            ))}
          </div>
        </div>
      </section>

      {/* Compensation Section */}
      <section id="compensation" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Compensation
              </h2>
              <p className="text-lg text-gray-700 mb-4">
                Payment structure aligned with project milestones to ensure smooth progress and mutual accountability.
              </p>
            </div>
            <PaymentBar
              payments={proposalData.payments}
              total={proposalData.proposal.total}
              currency={proposalData.proposal.currency}
              hoveredWeek={hoveredWeek}
            />
          </div>
        </div>
      </section>

      {/* Interactive Timeline */}
      <div id="timeline">
        <InteractiveTimeline
          timeline={proposalData.timeline}
          onMilestoneHover={setHoveredWeek}
          hoveredWeek={hoveredWeek}
        />
      </div>

      {/* CLE Spotlight Section */}
      <CLESpotlight cleData={proposalData.cleInitiative} />

      {/* Feedback & Collaboration Zone */}
      <FeedbackBox />

      {/* Approval Footer */}
      <ApprovalFooter onApprove={handleApprove} />

      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  );
};

export default Proposal;
