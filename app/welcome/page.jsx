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
          console.log('🔄 [Welcome] Starting contact hydration...');
          console.log('👤 [Welcome] Firebase UID:', firebaseUser.uid);
          
          // Fetch contact by Firebase UID
          console.log('🌐 [Welcome] Calling /api/client...');
          const hydrationResponse = await api.get(`/api/client`);
          
          console.log('📥 [Welcome] API Response:', {
            success: hydrationResponse.data?.success,
            hasData: !!hydrationResponse.data?.data,
            response: hydrationResponse.data,
          });
          
          if (hydrationResponse.data?.success) {
            const contact = hydrationResponse.data.contact;
            const company = hydrationResponse.data.company;
            const workPackageId = hydrationResponse.data.workPackageId;
            const firebaseUid = firebaseUser.uid;
            
            console.log('✅ [Welcome] Contact hydrated:', {
              contactId: contact.id,
              contactCompanyId: contact.contactCompanyId,
              email: contact.email,
              companyName: company?.companyName,
              workPackageId: workPackageId || 'null',
            });
            
            // Get client name (company name or contact name)
            const name = company?.companyName || 
                        contact.firstName || 
                        contact.email?.split('@')[0] || 
                        'there';
            setClientName(name);
            
            // Store in localStorage - SINGLE SOURCE OF TRUTH
            // workPackageId is written ONCE here, never overwritten
            if (typeof window !== 'undefined') {
              console.log('💾 [Welcome] Storing to localStorage...');
              localStorage.setItem('clientPortalContactId', contact.id);
              localStorage.setItem('clientPortalContactCompanyId', contact.contactCompanyId || '');
              localStorage.setItem('clientPortalContactEmail', contact.email || '');
              localStorage.setItem('firebaseId', firebaseUid);
              
              // ALWAYS store workPackageId (even if null) - single source of truth
              if (workPackageId) {
                console.log('💾 [Welcome] Storing workPackageId:', workPackageId);
                localStorage.setItem('clientPortalWorkPackageId', workPackageId);
              } else {
                console.log('⚠️ [Welcome] No workPackageId to store');
                localStorage.removeItem('clientPortalWorkPackageId'); // Clear if null
              }
              
              console.log('✅ [Welcome] localStorage updated:', {
                contactId: localStorage.getItem('clientPortalContactId'),
                contactCompanyId: localStorage.getItem('clientPortalContactCompanyId'),
                email: localStorage.getItem('clientPortalContactEmail'),
                workPackageId: localStorage.getItem('clientPortalWorkPackageId'),
              });
            }
            
            setLoading(false);
            setReady(true);
            console.log('✅ [Welcome] Contact hydration complete!');
          } else {
            console.error('❌ [Welcome] Failed to hydrate contact - invalid response');
            router.replace('/login');
          }
        } catch (error) {
          console.error('❌ [Welcome] Contact hydration error:', error);
          console.error('❌ [Welcome] Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            stack: error.stack,
          });
          router.replace('/login');
        }
      };

      hydrateContact();
    });

    return () => unsubscribe();
  }, [router]);

  const handleContinue = () => {
    // Redirect to review page instead of dashboard
    router.replace('/portal/review');
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
