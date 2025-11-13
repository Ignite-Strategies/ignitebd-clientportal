'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Handshake, Loader2 } from 'lucide-react';
import Image from 'next/image';

function ActivateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uid, setUid] = useState(null);

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setError('Invalid activation link. No token provided.');
      setLoading(false);
      return;
    }

    // Validate token and get firebaseUid
    // CLIENT PORTAL: Calls its own API route
    const activate = async () => {
      try {
        // Call client portal's own API route
        const response = await fetch('/api/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data?.success) {
          setUid(data.uid);
          // Redirect to set-password with uid
          router.push(`/set-password?uid=${data.uid}&email=${encodeURIComponent(data.email || '')}&contactId=${data.contactId || ''}`);
        } else {
          setError(data?.error || 'Invalid or expired activation link');
        }
      } catch (err) {
        console.error('Activation error:', err);
        setError(err.message || 'Failed to activate. The link may be invalid or expired.');
      } finally {
        setLoading(false);
      }
    };

    activate();
  }, [searchParams, router]);

  if (loading) {
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

        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-300 text-xl">Activating your account...</p>
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

        <div className="w-full max-w-md">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-8 text-center">
            <div className="mb-6 flex justify-center">
              <div className="h-16 w-16 rounded-full bg-red-900/30 border border-red-700/50 flex items-center justify-center">
                <svg className="h-8 w-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Activation Failed
            </h1>
            <p className="text-gray-400 mb-6">{error}</p>
            <button
              onClick={() => router.push('/login')}
              className="rounded-lg bg-gray-700 hover:bg-gray-600 border border-gray-500 px-4 py-2 text-sm font-semibold text-white transition"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null; // Will redirect
}

export default function ActivatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-300 text-xl">Loading...</p>
        </div>
      </div>
    }>
      <ActivateContent />
    </Suspense>
  );
}

