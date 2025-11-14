'use client';

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { auth, onAuthStateChanged } from '@/lib/firebase';
import Image from 'next/image';
import api from '@/lib/api';
import { useClientPortalSession } from '@/lib/hooks/useClientPortalSession';

/**
 * Welcome Router
 * 
 * This page acts as a smart router - it checks user state and routes accordingly.
 * No UI needed - just fast routing based on:
 * - Work has begun (approved proposals + deliverables) → Dashboard
 * - Has draft proposals → Proposal view
 * - No proposals → Onboarding
 */
function WelcomeContent() {
  const router = useRouter();
  const { setContactSession } = useClientPortalSession();

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
       * Welcome Router Logic:
       * 1. Hydrate contact
       * 2. Check state (proposals + deliverables)
       * 3. Route based on state
       */
      const routeUser = async () => {
        try {
          // Step 1: Get client state (includes contact hydration + state check)
          const stateResponse = await api.get(`/api/client/state`);
          
          if (stateResponse.data?.success && stateResponse.data.state) {
            const state = stateResponse.data.state;
            const contact = state.contact;
            
            // Store contact session (foundation for everything else)
            setContactSession({
              contactId: contact.id,
              contactEmail: contact.email || '',
              firebaseId: firebaseUser.uid,
              contactCompanyId: contact.contactCompanyId || null,
              companyName: contact.companyName || null,
              companyHQId: null, // Not needed for client portal
            });
            
            console.log('✅ Contact hydrated and state checked:', {
              contactId: contact.id,
              companyName: contact.companyName,
              workHasBegun: state.workHasBegun,
              route: state.routing.route,
            });
            
            // Step 2: Route based on state
            // Use replace to avoid adding to history
            router.replace(state.routing.route);
          } else {
            // Error - redirect to login
            console.error('❌ Failed to get client state');
            router.replace('/login');
          }
        } catch (error) {
          console.error('❌ Welcome router error:', error);
          // On error, try to at least hydrate contact and go to onboarding
          try {
            const hydrationResponse = await api.get(`/api/client/hydrate`);
            if (hydrationResponse.data?.success && hydrationResponse.data.data) {
              const contactData = hydrationResponse.data.data.contact;
              setContactSession({
                contactId: contactData.id,
                contactEmail: contactData.email || '',
                firebaseId: firebaseUser.uid,
                contactCompanyId: contactData.contactCompanyId || null,
                companyName: hydrationResponse.data.data.company?.companyName || null,
                companyHQId: null,
              });
              router.replace('/onboarding');
            } else {
              router.replace('/login');
            }
          } catch (hydrationError) {
            console.error('❌ Failed to hydrate contact:', hydrationError);
            router.replace('/login');
          }
        }
      };

      routeUser();
    });

    return () => unsubscribe();
  }, [router, setContactSession]);

  // Show minimal loading state while routing
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
