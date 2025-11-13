'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import Image from 'next/image';
import api from '@/lib/api';

export default function ClientPortalDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [portalData, setPortalData] = useState(null);
  const [contactRole, setContactRole] = useState(null);
  const [promoting, setPromoting] = useState(false);

  useEffect(() => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      router.replace('/login');
      return;
    }

    const loadDashboard = async () => {
      try {
        const contactId = localStorage.getItem('clientPortalContactId');
        if (!contactId) {
          router.replace('/login');
          return;
        }

        // Get contact role to check if they're already an owner
        try {
          const contactResponse = await api.get(`/api/contacts/by-firebase-uid`);
          if (contactResponse.data?.success && contactResponse.data.contact) {
            setContactRole(contactResponse.data.contact.role || 'contact');
          }
        } catch (err) {
          console.warn('Could not fetch contact role:', err);
        }

        // Get proposalId or find proposals for this contact
        let proposalId = localStorage.getItem('clientPortalProposalId');
        
        if (!proposalId) {
          // Find proposals for this contact
          const proposalsResponse = await api.get(`/api/contacts/${contactId}/proposals`);
          if (proposalsResponse.data?.success && proposalsResponse.data.proposals?.length > 0) {
            proposalId = proposalsResponse.data.proposals[0].id;
            localStorage.setItem('clientPortalProposalId', proposalId);
          }
        }

        if (proposalId) {
          const response = await api.get(`/api/proposals/${proposalId}/portal`);
          if (response.data?.success) {
            setPortalData(response.data.portalData);
          }
        }
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [router]);

  const handlePromoteToOwner = async () => {
    if (!window.confirm('Are you ready to get your own IgniteBD stack? This will create your own workspace where you can manage your business development.')) {
      return;
    }

    setPromoting(true);
    try {
      const response = await api.post('/api/promote-to-owner');
      if (response.data?.success) {
        alert('Congratulations! You now have your own IgniteBD workspace. Redirecting...');
        // Redirect to their new stack (would need to implement this route)
        window.location.href = '/stack';
      } else {
        alert(response.data?.error || 'Failed to promote to owner');
      }
    } catch (error) {
      console.error('Error promoting to owner:', error);
      alert(error.response?.data?.error || 'Failed to promote to owner. Please try again.');
    } finally {
      setPromoting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-gray-400 mx-auto mb-4" />
          <p className="text-gray-300 text-xl">Loading dashboard...</p>
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
            <h1 className="text-xl font-bold text-white">Client Portal</h1>
            <div className="flex items-center gap-4">
            <nav className="flex gap-4">
              <button className="text-sm font-medium text-gray-300 hover:text-white">
                Foundational Work
              </button>
              <button className="text-sm font-medium text-gray-300 hover:text-white">
                Proposals
              </button>
              <button className="text-sm font-medium text-gray-300 hover:text-white">
                Timeline
              </button>
              <button 
                onClick={() => router.push('/settings')}
                className="text-sm font-medium text-gray-300 hover:text-white"
              >
                Settings
              </button>
            </nav>
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
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {portalData && (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">
                Welcome, {portalData.client.name}
              </h2>
              <p className="text-gray-400">{portalData.client.company}</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
                <p className="text-sm text-gray-400 mb-1">Total Deliverables</p>
                <p className="text-3xl font-bold text-white">
                  {portalData.status.totalDeliverables}
                </p>
              </div>
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
                <p className="text-sm text-gray-400 mb-1">Completed</p>
                <p className="text-3xl font-bold text-gray-300">
                  {portalData.status.completedDeliverables}
                </p>
              </div>
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
                <p className="text-sm text-gray-400 mb-1">Status</p>
                <p className="text-3xl font-bold text-gray-300 capitalize">
                  {portalData.status.overall}
                </p>
              </div>
            </div>

            {/* Elevation CTA - Only show if contact is not already an owner */}
            {contactRole !== 'owner' && (
              <div className="mb-8 bg-gradient-to-r from-red-600 to-amber-500 border border-red-500 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      Ready for Your Own Stack?
                    </h3>
                    <p className="text-white/90">
                      Get your own IgniteBD workspace to manage your business development.
                    </p>
                  </div>
                  <button
                    onClick={handlePromoteToOwner}
                    disabled={promoting}
                    className="px-6 py-3 bg-white text-red-600 font-semibold rounded-lg hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {promoting ? 'Setting Up...' : "I'm Ready For My Stack"}
                  </button>
                </div>
              </div>
            )}

            {/* Deliverables List */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg">
              <div className="p-6 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white">Foundational Work</h3>
                <p className="text-sm text-gray-400">What we're delivering for you</p>
              </div>
              <div className="p-6">
                {portalData.deliverables.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No deliverables yet</p>
                ) : (
                  <div className="space-y-4">
                    {portalData.deliverables.map((deliverable) => (
                      <div
                        key={deliverable.id}
                        className="flex items-center justify-between p-4 border border-gray-700 rounded-lg bg-gray-800"
                      >
                        <div>
                          <h4 className="font-semibold text-white">{deliverable.title}</h4>
                          {deliverable.category && (
                            <p className="text-sm text-gray-400">{deliverable.category}</p>
                          )}
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            deliverable.status === 'completed'
                              ? 'bg-gray-700 text-gray-300'
                              : deliverable.status === 'in-progress'
                                ? 'bg-gray-700 text-gray-300'
                                : 'bg-gray-700 text-gray-400'
                          }`}
                        >
                          {deliverable.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

