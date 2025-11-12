'use client';

import Image from 'next/image';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
    <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-700 to-red-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <Image
              src="/logo.png"
              alt="Ignite Strategies"
              width={64}
              height={64}
              className="mx-auto mb-4 h-16 w-16 object-contain"
              priority
            />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Client Portal Login
            </h1>
            <p className="text-gray-600">
              Sign in to view your proposals and engagement details
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <form onSubmit={handleContactLogin} className="space-y-4">
              {contactId && (
                <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 px-4 py-2 text-sm text-blue-700">
                  Invited access for Contact ID: {contactId}
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={credentials.username}
                  onChange={(e) =>
                    setCredentials({ ...credentials, username: e.target.value })
                  }
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                  placeholder="your@email.com"
                  disabled={isSigningIn}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Use the email address associated with your proposal
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={credentials.password}
                  onChange={(e) =>
                    setCredentials({ ...credentials, password: e.target.value })
                  }
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                  placeholder="••••••••"
                  disabled={isSigningIn}
                />
              </div>
              <button
                type="submit"
                disabled={isSigningIn}
                className="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSigningIn ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-gray-500">
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
      <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-700 to-red-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4" />
          <p className="text-white text-xl">Loading...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
