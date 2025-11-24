'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth } from 'firebase/auth';
import api from '@/lib/api';

export default function PortalReviewCLEPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [presentation, setPresentation] = useState(null);
  const [saving, setSaving] = useState({});
  const [saved, setSaved] = useState({});
  const [comments, setComments] = useState({});

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      try {
        const firebaseUser = getAuth().currentUser;
        if (!firebaseUser) {
          router.replace('/login');
          return;
        }

        const token = await firebaseUser.getIdToken();
        if (!token) {
          router.replace('/login');
          return;
        }

        setAuthenticated(true);

        // Fetch presentation
        const response = await api.get('/api/portal/review/presentation');

        if (response.data?.success && response.data.presentation) {
          setPresentation(response.data.presentation);
          // Initialize comments from existing feedback
          const initialComments = {};
          if (response.data.presentation.feedback) {
            Object.keys(response.data.presentation.feedback).forEach((key) => {
              initialComments[parseInt(key)] = response.data.presentation.feedback[key];
            });
          }
          setComments(initialComments);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading presentation:', error);
        setLoading(false);
      }
    };

    checkAuthAndLoad();
  }, [router]);

  const handleSaveFeedback = async (sectionIndex, comment) => {
    if (!presentation) return;

    setSaving({ ...saving, [sectionIndex]: true });
    setSaved({ ...saved, [sectionIndex]: false });

    try {
      const response = await api.post('/api/portal/review/cle/feedback', {
        presentationId: presentation.id,
        sectionIndex,
        comment,
      });

      if (response.data?.success) {
        // Update local state
        const updatedFeedback = {
          ...(presentation.feedback || {}),
          [sectionIndex.toString()]: comment,
        };
        setPresentation({
          ...presentation,
          feedback: updatedFeedback,
        });
        setComments({ ...comments, [sectionIndex]: comment });
        setSaved({ ...saved, [sectionIndex]: true });
        setTimeout(() => {
          setSaved((prev) => ({ ...prev, [sectionIndex]: false }));
        }, 2000);
      }
    } catch (error) {
      console.error('Error saving feedback:', error);
      alert('Failed to save feedback. Please try again.');
    } finally {
      setSaving({ ...saving, [sectionIndex]: false });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4" />
          <p className="text-white text-xl">Loading presentation...</p>
        </div>
      </div>
    );
  }

  if (!authenticated || !presentation) {
    return null;
  }

  const sections = presentation.slides?.sections || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            BusinessPoint Law – CLE Presentation Draft
          </h1>
          <p className="text-gray-300 text-lg">
            This is your outline. Add comments to any section.
          </p>
        </div>

        <div className="space-y-6">
          {sections.map((section, sectionIndex) => {
            const comment = comments[sectionIndex] || '';

            return (
              <div
                key={sectionIndex}
                className="bg-gray-800 border border-gray-700 rounded-xl shadow-md p-6"
              >
                <h2 className="text-xl font-bold text-white mb-4">
                  {section.title}
                </h2>

                {section.bullets && section.bullets.length > 0 && (
                  <ul className="list-disc list-inside mb-6 space-y-2 text-gray-300">
                    {section.bullets.map((bullet, bulletIndex) => (
                      <li key={bulletIndex}>{bullet}</li>
                    ))}
                  </ul>
                )}

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Your Feedback
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => {
                      setComments({ ...comments, [sectionIndex]: e.target.value });
                    }}
                    rows={4}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 outline-none resize-none placeholder:text-gray-500"
                    placeholder="Add your comments or feedback for this section..."
                  />
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={() => handleSaveFeedback(sectionIndex, comment)}
                    disabled={saving[sectionIndex]}
                    className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving[sectionIndex] ? 'Saving...' : 'Save Feedback'}
                  </button>
                  {saved[sectionIndex] && (
                    <span className="text-green-400 font-medium">Saved!</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

