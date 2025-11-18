'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import api from '@/lib/api';
import StatusBadge from '@/app/components/StatusBadge';

/**
 * WorkArtifact Detail View
 * Displays a single artifact with its content
 */
export default function ArtifactView() {
  const params = useParams();
  const router = useRouter();
  const artifactId = params.artifactId;
  
  const [artifact, setArtifact] = useState(null);
  const [workPackageItem, setWorkPackageItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { onAuthStateChanged } = require('firebase/auth');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.replace('/login');
        return;
      }

      if (artifactId) {
        await loadArtifact();
      }
    });

    return () => unsubscribe();
  }, [artifactId, router]);

  const loadArtifact = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/client/work/artifacts/${artifactId}`);
      
      if (response.data?.success && response.data.artifact) {
        setArtifact(response.data.artifact);
        setWorkPackageItem(response.data.workPackageItem);
      }
    } catch (error) {
      console.error('❌ Error loading artifact:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-gray-400 mx-auto mb-4" />
          <p className="text-gray-300 text-xl">Loading artifact...</p>
        </div>
      </div>
    );
  }

  if (!artifact) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Artifact not found</h2>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Artifact Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-4xl font-bold text-white">
              {artifact.title || `Artifact`}
            </h1>
            <StatusBadge status={artifact.status || 'not_started'} />
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
            <span className="px-3 py-1 rounded-full bg-gray-700 text-gray-300">
              {artifact.type}
            </span>
            {workPackageItem && (
              <span className="text-gray-500">
                From: {workPackageItem.deliverableLabel || 'Deliverable'}
              </span>
            )}
          </div>

          {workPackageItem?.deliverableDescription && (
            <p className="text-lg text-gray-400">{workPackageItem.deliverableDescription}</p>
          )}
        </div>

        {/* Artifact Content */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
          {artifact.contentJson ? (
            <div className="prose prose-invert max-w-none">
              <pre className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-sm text-gray-300 overflow-auto">
                {JSON.stringify(artifact.contentJson, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-400">Content coming soon</p>
            </div>
          )}
        </div>

        {/* Review Status */}
        {(artifact.reviewRequestedAt || artifact.reviewCompletedAt) && (
          <div className="mt-6 bg-gray-900 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Review Status</h3>
            <div className="space-y-2 text-sm text-gray-400">
              {artifact.reviewRequestedAt && (
                <p>
                  Review requested: {new Date(artifact.reviewRequestedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              )}
              {artifact.reviewCompletedAt && (
                <p>
                  Review completed: {new Date(artifact.reviewCompletedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

