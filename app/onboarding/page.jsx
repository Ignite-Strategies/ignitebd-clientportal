'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, onAuthStateChanged } from '@/lib/firebase';
import { Handshake } from 'lucide-react';
import Image from 'next/image';
import { useClientPortalSession } from '@/lib/hooks/useClientPortalSession';

/**
 * Onboarding Page
 * 
 * Shown when user has no proposals yet.
 * Welcome message and "get started" messaging.
 */
export default function OnboardingPage() {
  const router = useRouter();
  const { contactSession } = useClientPortalSession();

  useEffect(() => {
    // Ensure user is authenticated
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        router.replace('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

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
        {contactSession?.companyName && (
          <span className="text-sm text-gray-400 ml-4">
            {contactSession.companyName}
          </span>
        )}
      </div>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-8 max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <Handshake className="h-16 w-16 text-gray-300" strokeWidth={2} />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome{contactSession?.contactEmail ? `, ${contactSession.contactEmail.split('@')[0]}` : ''}!
        </h1>
        {contactSession?.companyName && (
          <p className="text-gray-400 mb-2">
            <span className="font-semibold text-gray-300">{contactSession.companyName}</span>
          </p>
        )}
        <p className="text-gray-400 mb-8">
          Your account is ready. We're preparing your proposals and will notify you when they're available.
        </p>
        <p className="text-sm text-gray-500">
          If you have questions, please contact your Ignite Strategies representative.
        </p>
      </div>
    </div>
  );
}

