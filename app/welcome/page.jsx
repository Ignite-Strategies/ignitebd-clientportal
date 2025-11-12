'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebase';
import Image from 'next/image';
import api from '@/lib/api';

function WelcomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [proposal, setProposal] = useState(null);

  useEffect(() => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      router.replace('/login');
      return;
    }

    const checkAccess = async () => {
      try {
        // Get contactId from localStorage (set during login)
        const contactId = localStorage.getItem('clientPortalContactId');
        
        if (!contactId) {
          router.replace('/login');
          return;
        }

        // Get proposalId from URL or find proposals for this contact
        const proposalId = searchParams.get('proposalId') || localStorage.getItem('clientPortalProposalId');
        
        if (proposalId) {
          localStorage.setItem('clientPortalProposalId', proposalId);
          
          // Fetch proposal to verify access
          try {
            const response = await api.get(`/api/proposals/${proposalId}/portal`);
            if (response.data?.success) {
              setProposal(response.data.portalData);
              setHasAccess(true);
            }
          } catch (err) {
            console.error('Error fetching proposal:', err);
            // Still allow access - we'll verify on dashboard
            setHasAccess(true);
          }
        } else {
          // No proposal ID - find proposals for this contact
          try {
            const response = await api.get(`/api/contacts/${contactId}/proposals`);
            if (response.data?.success && response.data.proposals?.length > 0) {
              const firstProposal = response.data.proposals[0];
              localStorage.setItem('clientPortalProposalId', firstProposal.id);
              setHasAccess(true);
            } else {
              setHasAccess(true); // Allow access, show empty state
            }
          } catch (err) {
            console.error('Error fetching proposals:', err);
            setHasAccess(true); // Allow access
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error checking access:', error);
        setLoading(false);
      }
    };

    checkAccess();
  }, [router, searchParams]);

  const handleContinue = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-700 to-red-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4" />
          <p className="text-white text-xl">Loading your portal...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-700 to-red-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Required</h1>
          <p className="text-gray-600 mb-6">
            You need a valid proposal link to access the client portal.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="rounded-lg bg-red-600 px-6 py-2 text-white font-semibold hover:bg-red-700"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-700 to-red-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center">
        <Image
          src="/logo.png"
          alt="Ignite Strategies"
          width={80}
          height={80}
          className="mx-auto mb-6 h-20 w-20 object-contain"
          priority
        />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to Your Client Portal
        </h1>
        {proposal && (
          <p className="text-gray-600 mb-2">
            Engagement: <span className="font-semibold">{proposal.client?.company}</span>
          </p>
        )}
        <p className="text-gray-600 mb-8">
          View your proposals, track deliverables, and manage your engagement with Ignite Strategies.
        </p>
        <button
          onClick={handleContinue}
          className="w-full rounded-lg bg-red-600 px-6 py-3 text-white font-semibold hover:bg-red-700 transition shadow-lg"
        >
          Continue to Dashboard →
        </button>
      </div>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-700 to-red-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4" />
          <p className="text-white text-xl">Loading...</p>
        </div>
      </div>
    }>
      <WelcomeContent />
    </Suspense>
  );
}
