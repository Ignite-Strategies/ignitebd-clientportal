'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import api from '@/lib/api';
import PhaseCard from '@/app/components/PhaseCard';

/**
 * Full Project Overview
 * Shows all phases with their deliverables
 */
export default function WorkPackageOverview() {
  const params = useParams();
  const router = useRouter();
  const workPackageId = params.workPackageId;
  
  const [workPackage, setWorkPackage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedPhases, setExpandedPhases] = useState(new Set());

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
        
        // Auto-expand first phase
        if (wp.phases && wp.phases.length > 0) {
          setExpandedPhases(new Set([wp.phases[0].id]));
        }
      }
    } catch (error) {
      console.error('❌ Error loading work package:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePhase = (phaseId) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId);
    } else {
      newExpanded.add(phaseId);
    }
    setExpandedPhases(newExpanded);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-gray-400 mx-auto mb-4" />
          <p className="text-gray-300 text-xl">Loading overview...</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push(`/client/work/${workPackageId}`)}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Project</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Full Project Overview
          </h1>
          <p className="text-xl text-gray-400">
            {workPackage.title || 'Project Overview'}
          </p>
        </div>

        {/* All Phases */}
        {phases.length > 0 ? (
          <div className="space-y-6">
            {phases.map((phase) => (
              <PhaseCard
                key={phase.id}
                phase={phase}
                expanded={expandedPhases.has(phase.id)}
                onToggle={() => togglePhase(phase.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-400 text-xl">No phases yet</p>
          </div>
        )}
      </main>
    </div>
  );
}

