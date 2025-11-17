'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { auth, onAuthStateChanged } from '@/lib/firebase';
import api from '@/lib/api';

/**
 * Welcome = Simple Loader (MVP1)
 * 
 * Shows client name and "See your project"
 * Redirects to dashboard after 1.5 seconds
 */
function WelcomeContent() {
  const router = useRouter();
  const [clientName, setClientName] = useState('');
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Use onAuthStateChanged to wait for Firebase auth to initialize
    let routed = false;
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Prevent multiple routing calls
      if (routed) return;
      
      if (!firebaseUser) {
        // If no user after a brief delay, redirect to login
        setTimeout(() => {
          if (!auth.currentUser) {
            router.replace('/login');
          }
        }, 1000);
        return;
      }

      // Mark as routed to prevent duplicate calls
      routed = true;

      /**
       * MVP1: Simple loader - hydrate contact
       */
      const hydrateContact = async () => {
        try {
          // Fetch contact by Firebase UID
          const hydrationResponse = await api.get(`/api/client/hydrate`);
          
          if (hydrationResponse.data?.success && hydrationResponse.data.data) {
            const contact = hydrationResponse.data.data.contact;
            const firebaseUid = firebaseUser.uid;
            
            // Get client name (company name or contact name)
            const name = contact.contactCompany?.companyName || 
                        contact.firstName || 
                        contact.email?.split('@')[0] || 
                        'there';
            setClientName(name);
            
            // Store in localStorage (MVP1 - simple storage)
            if (typeof window !== 'undefined') {
              localStorage.setItem('clientPortalContactId', contact.id);
              localStorage.setItem('clientPortalContactCompanyId', contact.contactCompanyId || '');
              localStorage.setItem('clientPortalContactEmail', contact.email || '');
              localStorage.setItem('firebaseId', firebaseUid);
            }
            
            setLoading(false);
            setReady(true);
          } else {
            console.error('❌ Failed to hydrate contact');
            router.replace('/login');
          }
        } catch (error) {
          console.error('❌ Welcome loader error:', error);
          router.replace('/login');
        }
      };

      hydrateContact();
    });

    return () => unsubscribe();
  }, [router]);

  const handleContinue = () => {
    router.replace('/dashboard');
  };

  // Show welcome message
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 flex items-center justify-center px-4">
      <div className="text-center">
        {loading ? (
          <>
            <div className="mb-6">
              <div className="inline-block p-4 bg-white/20 rounded-full animate-pulse">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="w-64 h-1 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full animate-[loading_1.5s_ease-in-out]"></div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="mb-6">
              <div className="inline-block p-4 bg-white/20 rounded-full">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            
            <h1 className="text-4xl font-bold text-white mb-2">
              Welcome{clientName ? `, ${clientName}` : ''}!
            </h1>
            <p className="text-xl text-white/80 mb-8">See your project...</p>
            
            {ready && (
              <button
                onClick={handleContinue}
                className="px-8 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition shadow-lg"
              >
                Continue
              </button>
            )}
          </>
        )}
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
