'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth } from '@/lib/firebase';
import Image from 'next/image';
import api from '@/lib/api';

/**
 * Work Artifact View (MVP1)
 * 
 * Fetches WorkArtifact and displays minimal content
 * Title + JSON dump for now
 */
export default function WorkArtifactPage() {
  const router = useRouter();
  const params = useParams();
  const artifactId = params?.artifactId;
  const [loading, setLoading] = useState(true);
  const [artifact, setArtifact] = useState(null);

  useEffect(() => {
    const { onAuthStateChanged } = require('firebase/auth');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.replace('/login');
        return;
      }

      // Try to get artifact from localStorage first (from engagement data)
      if (typeof window !== 'undefined' && artifactId) {
        try {
          // Check if we have engagement data cached
          const cachedEngagement = localStorage.getItem('clientPortalEngagement');
          if (cachedEngagement) {
            const engagement = JSON.parse(cachedEngagement);
            // Find artifact in workPackage items
            if (engagement.workPackage?.items) {
              for (const item of engagement.workPackage.items) {
                if (item.artifacts) {
                  const foundArtifact = item.artifacts.find(a => a.id === artifactId);
                  if (foundArtifact) {
                    setArtifact(foundArtifact);
                    setLoading(false);
                    return; // Found in cache, skip API call
                  }
                }
              }
            }
          }
        } catch (cacheError) {
          console.warn('Failed to read from cache:', cacheError);
        }
      }

      // Fallback: Fetch from API if not in cache
      try {
        const artifactResponse = await api.get(`/api/client/work/${artifactId}`);
        if (artifactResponse.data?.success) {
          setArtifact(artifactResponse.data.artifact);
        }
      } catch (error) {
        console.error('❌ Error loading artifact:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router, artifactId]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm font-medium text-gray-300 hover:text-white"
            >
              ← Back to Dashboard
            </button>
            <div className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Ignite"
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
              <span className="text-sm font-semibold text-gray-300">Ignite</span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-8">
          {artifact ? (
            <>
              <h1 className="text-2xl font-bold text-white mb-4">
                {artifact.title || `Artifact ${artifactId}`}
              </h1>
              <div className="mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-700 text-gray-300">
                  {artifact.type}
                </span>
                <span className="ml-2 px-3 py-1 rounded-full text-xs font-semibold bg-gray-700 text-gray-300">
                  {artifact.status}
                </span>
              </div>
              {artifact.contentJson && (
                <div className="mt-6">
                  <h2 className="text-lg font-semibold text-white mb-2">Content</h2>
                  <pre className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-sm text-gray-300 overflow-auto">
                    {JSON.stringify(artifact.contentJson, null, 2)}
                  </pre>
                </div>
              )}
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-white mb-4">Artifact View</h1>
              <p className="text-gray-400">
                Artifact ID: {artifactId}
              </p>
              <p className="text-gray-400 mt-4">
                Artifact not found or could not be loaded.
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

