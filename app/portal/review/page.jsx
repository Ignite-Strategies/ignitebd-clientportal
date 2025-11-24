'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth } from 'firebase/auth';
import api from '@/lib/api';

export default function PortalReviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [presentation, setPresentation] = useState(null);
  const [saving, setSaving] = useState({});
  const [saved, setSaved] = useState({});
  const [comments, setComments] = useState({});
  const [editingSections, setEditingSections] = useState({});

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

        // Fetch presentation directly - hardcode the presentation ID if needed
        // Using the duplicated presentation ID: cmicl19x00001nwwkryddib2k
        try {
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
            // Initialize editing sections state
            const initialEditing = {};
            if (response.data.presentation.slides?.sections) {
              response.data.presentation.slides.sections.forEach((section, idx) => {
                initialEditing[idx] = {
                  title: section.title,
                  bullets: [...(section.bullets || [])],
                };
              });
            }
            setEditingSections(initialEditing);
          }
        } catch (error) {
          console.error('Error loading presentation:', error);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Auth check error:', error);
        router.replace('/login');
      }
    };

    checkAuthAndLoad();
  }, [router]);

  const handleSaveFeedback = async (sectionIndex, comment) => {
    if (!presentation) return;

    setSaving({ ...saving, [`feedback-${sectionIndex}`]: true });
    setSaved({ ...saved, [`feedback-${sectionIndex}`]: false });

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
        setSaved({ ...saved, [`feedback-${sectionIndex}`]: true });
        setTimeout(() => {
          setSaved((prev) => ({ ...prev, [`feedback-${sectionIndex}`]: false }));
        }, 2000);
      }
    } catch (error) {
      console.error('Error saving feedback:', error);
      alert('Failed to save feedback. Please try again.');
    } finally {
      setSaving({ ...saving, [`feedback-${sectionIndex}`]: false });
    }
  };

  const handleSaveSlides = async () => {
    if (!presentation || !editingSections) return;

    setSaving({ ...saving, slides: true });
    setSaved({ ...saved, slides: false });

    try {
      // Build updated slides structure
      const updatedSections = Object.keys(editingSections).map((key) => {
        const idx = parseInt(key);
        const editing = editingSections[idx];
        return {
          title: editing.title,
          bullets: editing.bullets.filter(b => b.trim() !== ''), // Remove empty bullets
        };
      });

      const updatedSlides = {
        sections: updatedSections,
      };

      const response = await api.post('/api/portal/review/cle/slides', {
        presentationId: presentation.id,
        slides: updatedSlides,
      });

      if (response.data?.success) {
        // Update local state
        setPresentation({
          ...presentation,
          slides: updatedSlides,
        });
        setSaved({ ...saved, slides: true });
        setTimeout(() => {
          setSaved((prev) => ({ ...prev, slides: false }));
        }, 2000);
      }
    } catch (error) {
      console.error('Error saving slides:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setSaving({ ...saving, slides: false });
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

        <div className="mb-6 flex justify-end">
          <button
            onClick={handleSaveSlides}
            disabled={saving.slides}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving.slides ? 'Saving Changes...' : 'Save All Changes'}
          </button>
          {saved.slides && (
            <span className="ml-3 text-green-400 font-medium flex items-center">Saved!</span>
          )}
        </div>

        <div className="space-y-6">
          {sections.map((section, sectionIndex) => {
            const comment = comments[sectionIndex] || '';
            const editing = editingSections[sectionIndex] || { title: section.title, bullets: [...(section.bullets || [])] };

            return (
              <div
                key={sectionIndex}
                className="bg-gray-800 border border-gray-700 rounded-xl shadow-md p-6"
              >
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Section Title
                  </label>
                  <input
                    type="text"
                    value={editing.title}
                    onChange={(e) => {
                      setEditingSections({
                        ...editingSections,
                        [sectionIndex]: {
                          ...editing,
                          title: e.target.value,
                        },
                      });
                    }}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 outline-none"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Bullet Points
                  </label>
                  <div className="space-y-2">
                    {editing.bullets.map((bullet, bulletIndex) => (
                      <div key={bulletIndex} className="flex items-center gap-2">
                        <span className="text-gray-400">•</span>
                        <input
                          type="text"
                          value={bullet}
                          onChange={(e) => {
                            const updatedBullets = [...editing.bullets];
                            updatedBullets[bulletIndex] = e.target.value;
                            setEditingSections({
                              ...editingSections,
                              [sectionIndex]: {
                                ...editing,
                                bullets: updatedBullets,
                              },
                            });
                          }}
                          className="flex-1 px-4 py-2 bg-gray-900 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 outline-none"
                        />
                        <button
                          onClick={() => {
                            const updatedBullets = editing.bullets.filter((_, idx) => idx !== bulletIndex);
                            setEditingSections({
                              ...editingSections,
                              [sectionIndex]: {
                                ...editing,
                                bullets: updatedBullets,
                              },
                            });
                          }}
                          className="px-3 py-1 text-red-400 hover:text-red-300 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        setEditingSections({
                          ...editingSections,
                          [sectionIndex]: {
                            ...editing,
                            bullets: [...editing.bullets, ''],
                          },
                        });
                      }}
                      className="text-sm text-gray-400 hover:text-gray-300 mt-2"
                    >
                      + Add Bullet
                    </button>
                  </div>
                </div>

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
                    disabled={saving[`feedback-${sectionIndex}`]}
                    className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving[`feedback-${sectionIndex}`] ? 'Saving...' : 'Save Feedback'}
                  </button>
                  {saved[`feedback-${sectionIndex}`] && (
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

