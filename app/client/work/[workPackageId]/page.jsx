'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import api from '@/lib/api';
import PhaseCard from '@/app/components/PhaseCard';
import DeliverableItemCard from '@/app/components/DeliverableItemCard';
import StatusBadge from '@/app/components/StatusBadge';

/**
 * Client Portal Work Package View
 * Phase-first hierarchy with progressive disclosure
 */
export default function WorkPackageView() {
  const params = useParams();
  const router = useRouter();
  const workPackageId = params.workPackageId;
  
  const [workPackage, setWorkPackage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedPhaseId, setExpandedPhaseId] = useState(null);

  useEffect(() => {
    const { onAuthStateChanged } = require('firebase/auth');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.replace('/login');
        return;
      }

      if (workPackageId) {
        await loadWorkPackage();
      }
    });

    return () => unsubscribe();
  }, [workPackageId, router]);

  const loadWorkPackage = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/client/work?workPackageId=${workPackageId}`);
      
      if (response.data?.success && response.data.workPackage) {
        const wp = response.data.workPackage;
        setWorkPackage(wp);
        
        // Auto-expand first phase (current phase)
        if (wp.phases && wp.phases.length > 0) {
          setExpandedPhaseId(wp.phases[0].id);
        }
      }
    } catch (error) {
      console.error('❌ Error loading work package:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-gray-400 mx-auto mb-4" />
          <p className="text-gray-300 text-xl">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!workPackage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Project not found</h2>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const phases = workPackage.phases || [];
  const currentPhase = phases[0] || null;
  const nextPhase = phases[1] || null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            {workPackage.title || 'Project Overview'}
          </h1>
          {workPackage.description && (
            <p className="text-xl text-gray-400">{workPackage.description}</p>
          )}
          {workPackage.company?.companyName && (
            <p className="text-sm text-gray-500 mt-2">
              {workPackage.company.companyName}
            </p>
          )}
        </div>

        {/* Current Phase (Expanded) */}
        {currentPhase && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-2xl font-semibold text-white">Current Phase</h2>
              <StatusBadge status={currentPhase.items?.some(item => item.status === 'in_progress') ? 'in_progress' : 'not_started'} />
            </div>
            <PhaseCard
              phase={currentPhase}
              expanded={expandedPhaseId === currentPhase.id}
              onToggle={() => setExpandedPhaseId(expandedPhaseId === currentPhase.id ? null : currentPhase.id)}
            />
          </div>
        )}

        {/* Next Phase (Collapsed Preview) */}
        {nextPhase && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-white">Up Next</h2>
            </div>
            <PhaseCard
              phase={nextPhase}
              expanded={expandedPhaseId === nextPhase.id}
              onToggle={() => setExpandedPhaseId(expandedPhaseId === nextPhase.id ? null : nextPhase.id)}
            />
          </div>
        )}

        {/* See Full Overview CTA */}
        {phases.length > 2 && (
          <div className="mb-8 text-center">
            <button
              onClick={() => router.push(`/client/work/${workPackageId}/overview`)}
              className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition shadow-lg"
            >
              See Full Project Overview
            </button>
            <p className="text-sm text-gray-400 mt-2">
              View all {phases.length} phases
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

