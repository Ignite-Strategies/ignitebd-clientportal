'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, onAuthStateChanged } from '@/lib/firebase';
import Image from 'next/image';
import api from '@/lib/api';
import { useClientPortalSession } from '@/lib/hooks/useClientPortalSession';

function WelcomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setContactSession } = useClientPortalSession();
  const [loading, setLoading] = useState(true);
  const [contact, setContact] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Use onAuthStateChanged to wait for Firebase auth to initialize
    let hasChecked = false;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Give Firebase a moment to propagate auth state after login
      if (!firebaseUser && !hasChecked) {
        // Wait a bit before redirecting - might be auth state propagation delay
        setTimeout(() => {
          if (!auth.currentUser && !hasChecked) {
            router.replace('/login');
          }
        }, 500);
        return;
      }
      
      hasChecked = true;
      
      if (!firebaseUser) {
        router.replace('/login');
        return;
      }

      /**
       * Step 1: Contact Lookup/Retrieval (First Hydration)
       * - User is authenticated via Firebase
       * - Call client hydration endpoint
       * - Store contact info for Step 2
       */
      const hydrateContact = async () => {
        try {
          // Step 1: Call client hydration endpoint (hydrates contact + company + proposals)
          const hydrationResponse = await api.get(`/api/client/hydrate`);
          
          if (hydrationResponse.data?.success && hydrationResponse.data.data) {
            const hydrationData = hydrationResponse.data.data;
            const contactData = hydrationData.contact;
            
            setContact({
              ...contactData,
              contactCompany: hydrationData.company,
            });
            
            // Store contact session using hook (foundation for everything else)
            setContactSession({
              contactId: contactData.id,
              contactEmail: contactData.email || '',
              firebaseId: firebaseUser.uid,
              contactCompanyId: contactData.contactCompanyId || null,
              companyName: hydrationData.company?.companyName || null,
              companyHQId: contactData.crmId || null,
            });
            
            console.log('✅ Contact hydrated:', {
              contactId: contactData.id,
              companyName: hydrationData.company?.companyName,
              proposalsCount: hydrationData.proposals?.length || 0,
            });
            
            setLoading(false);
          } else {
            setError('Contact not found. Please ensure your account is activated.');
            setLoading(false);
          }
        } catch (error) {
          console.error('❌ Step 1: Contact hydration error:', error);
          setError(error.response?.data?.error || 'Failed to load contact information.');
          setLoading(false);
        }
      };

      hydrateContact();
    });

    return () => unsubscribe();
  }, [router, setContactSession]);

  const handleContinue = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 flex items-center justify-center relative">
        <div className="absolute top-6 right-6 flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Ignite"
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
            priority
          />
          <span className="text-sm font-semibold text-gray-300">Ignite</span>
        </div>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-gray-400 mx-auto mb-4" />
          <p className="text-gray-300 text-xl">Loading your portal...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 flex items-center justify-center p-4 relative">
        <div className="absolute top-6 right-6 flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Ignite"
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
            priority
          />
          <span className="text-sm font-semibold text-gray-300">Ignite</span>
        </div>
        <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Error</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="rounded-lg bg-gray-700 hover:bg-gray-600 border border-gray-500 px-6 py-2 text-white font-semibold transition"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 flex items-center justify-center p-4 relative">
      <div className="absolute top-6 left-6 flex items-center gap-2">
        <Image
          src="/logo.png"
          alt="Ignite"
          width={32}
          height={32}
          className="h-8 w-8 object-contain"
          priority
        />
        <span className="text-sm font-semibold text-gray-300">Ignite</span>
      </div>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-8 max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <svg
            className="h-16 w-16 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 12h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 14"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 18h1a2 2 0 0 0 0-4H5c-.6 0-1.1.2-1.4.6L3 14"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 12h2a2 2 0 1 1 0-4h-3c-.6 0-1.1.2-1.4.6L21 10"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 18h1a2 2 0 0 1 0-4h-3c-.6 0-1.1.2-1.4.6L21 10"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 14l4-4"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 10l-4 4"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 12l-2 2"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 12l2 2"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome{contact?.firstName ? `, ${contact.firstName}` : ''}!
        </h1>
        {contact?.contactCompany?.companyName && (
          <p className="text-gray-400 mb-2">
            <span className="font-semibold text-gray-300">{contact.contactCompany.companyName}</span>
          </p>
        )}
        <p className="text-gray-400 mb-8">
          Step 1 Complete: Contact loaded. Ready to view your proposals and deliverables.
        </p>
        <button
          onClick={handleContinue}
          className="w-full rounded-lg bg-gray-700 hover:bg-gray-600 border border-gray-500 px-6 py-3 text-white font-semibold transition shadow-lg"
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
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-gray-400 mx-auto mb-4" />
          <p className="text-gray-300 text-xl">Loading...</p>
        </div>
      </div>
    }>
      <WelcomeContent />
    </Suspense>
  );
}
