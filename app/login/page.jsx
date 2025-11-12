'use client';

import Image from 'next/image';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Handshake } from 'lucide-react';
import api from '@/lib/api';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [contactId, setContactId] = useState('');

  // Get contactId from URL if present
  useEffect(() => {
    const urlContactId = searchParams.get('contactId');
    if (urlContactId) {
      setContactId(urlContactId);
    }
  }, [searchParams]);

  const handleContactLogin = async (event) => {
    event.preventDefault();
    if (isSigningIn) return;

    setIsSigningIn(true);
    setError('');

    try {
      // Use Firebase Auth - email is the username
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const { auth } = await import('@/lib/firebase');
      
      const result = await signInWithEmailAndPassword(
        auth,
        credentials.username, // Email
        credentials.password
      );

      // Get contact by email
      const contactResponse = await api.get(`/api/contacts/by-email?email=${encodeURIComponent(credentials.username)}`);
      
      if (contactResponse.data?.success && contactResponse.data.contact) {
        const contact = contactResponse.data.contact;
        
        // Store contact session
        localStorage.setItem('clientPortalContactId', contact.id);
        localStorage.setItem('clientPortalCompanyHQId', contact.crmId);
        localStorage.setItem('clientPortalContactEmail', contact.email || '');
        
        // Store Firebase token
        const idToken = await result.user.getIdToken();
        localStorage.setItem('firebaseToken', idToken);
        localStorage.setItem('firebaseId', result.user.uid);
        
        // Redirect to welcome/dashboard
        router.push('/welcome');
      } else {
        setError('Contact not found for this email');
      }
    } catch (error) {
      console.error('Contact login failed:', error);
      setError(error.message || 'Sign-in failed. Please check your credentials.');
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 flex items-center justify-center p-4 relative">
      {/* Ignite logo - top right corner */}
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
        <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="mb-6 flex justify-center">
              <Handshake className="h-16 w-16 text-gray-300" strokeWidth={2} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Client Portal Login
            </h1>
            <p className="text-gray-400">
              Sign in to view your proposals and engagement details
            </p>
            {searchParams.get('passwordReset') === 'success' && (
              <div className="mt-4 rounded-lg bg-green-900/30 border border-green-700/50 px-4 py-2 text-sm text-green-300">
                Password set successfully! You can now sign in.
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-900/30 border border-red-700/50 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <form onSubmit={handleContactLogin} className="space-y-4">
              {contactId && (
                <div className="mb-4 rounded-lg bg-blue-900/30 border border-blue-700/50 px-4 py-2 text-sm text-blue-300">
                  Invited access for Contact ID: {contactId}
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={credentials.username}
                  onChange={(e) =>
                    setCredentials({ ...credentials, username: e.target.value })
                  }
                  required
                  className="w-full rounded-lg bg-gray-800 border border-gray-600 text-white px-4 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 placeholder:text-gray-500"
                  placeholder="your@email.com"
                  disabled={isSigningIn}
                />
                <p className="mt-1 text-xs text-gray-400">
                  Use the email address associated with your proposal
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={credentials.password}
                  onChange={(e) =>
                    setCredentials({ ...credentials, password: e.target.value })
                  }
                  required
                  className="w-full rounded-lg bg-gray-800 border border-gray-600 text-white px-4 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 placeholder:text-gray-500"
                  placeholder="••••••••"
                  disabled={isSigningIn}
                />
              </div>
              <button
                type="submit"
                disabled={isSigningIn}
                className="w-full rounded-lg bg-gray-700 hover:bg-gray-600 border border-gray-500 px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSigningIn ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            Need access? Contact your Ignite Strategies representative.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-gray-400 mx-auto mb-4" />
          <p className="text-gray-300 text-xl">Loading...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
