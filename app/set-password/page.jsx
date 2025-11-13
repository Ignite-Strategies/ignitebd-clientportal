'use client';

import Image from 'next/image';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Handshake, Eye, EyeOff } from 'lucide-react';

function SetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const uid = searchParams.get('uid');
  const email = searchParams.get('email');
  const contactId = searchParams.get('contactId');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !uid) {
      setError('Invalid activation link. Missing user ID.');
    }
  }, [mounted, uid]);

  const handleSetPassword = async (event) => {
    event.preventDefault();
    if (loading || !uid) return;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // CLIENT PORTAL: Calls its own API route
      const response = await fetch('/api/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, password, contactId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const data = await response.json();

      if (data?.success) {
        setSuccess(true);
        
        // Auto-sign in with Firebase after password is set
        try {
          const { signInWithEmailAndPassword } = await import('firebase/auth');
          const { auth } = await import('@/lib/firebase');
          
          // Sign in with the email and password they just set
          await signInWithEmailAndPassword(auth, email || '', password);
          
          // Redirect to welcome (will auto-hydrate contact)
          setTimeout(() => {
            router.push('/welcome');
          }, 1500);
        } catch (signInError) {
          console.error('Auto-sign in failed:', signInError);
          // Fallback: redirect to login if auto-sign in fails
          setTimeout(() => {
            router.push('/login?activated=true');
          }, 2000);
        }
      } else {
        setError(data?.error || 'Failed to set password');
      }
    } catch (error) {
      console.error('Password set error:', error);
      setError(error.message || 'Failed to set password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-gray-400 mx-auto mb-4" />
          <p className="text-gray-300 text-xl">Loading...</p>
        </div>
      </div>
    );
  }

  if (success) {
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
              <div className="h-16 w-16 rounded-full bg-green-900/30 border border-green-700/50 flex items-center justify-center">
                <svg className="h-8 w-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Password Set Successfully!
            </h1>
            <p className="text-gray-400 mb-6">
              Your account is now activated. Redirecting to login...
            </p>
          </div>
        </div>
      </div>
    );
  }

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
              Set Your Password
            </h1>
            <p className="text-gray-400">
              Create a secure password for your client portal account
            </p>
            {email && (
              <p className="text-sm text-gray-500 mt-2">{email}</p>
            )}
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-900/30 border border-red-700/50 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {!uid && (
            <div className="mb-4 rounded-lg bg-red-900/30 border border-red-700/50 px-4 py-3 text-sm text-red-300">
              Invalid activation link. Please request a new invite.
            </div>
          )}

          <form onSubmit={handleSetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full rounded-lg bg-gray-800 border border-gray-600 text-white px-4 py-2 pr-10 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 placeholder:text-gray-500"
                  placeholder="••••••••"
                  disabled={loading || !uid}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Must be at least 8 characters
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full rounded-lg bg-gray-800 border border-gray-600 text-white px-4 py-2 pr-10 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 placeholder:text-gray-500"
                  placeholder="••••••••"
                  disabled={loading || !uid}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !uid}
              className="w-full rounded-lg bg-gray-700 hover:bg-gray-600 border border-gray-500 px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Setting Password...' : 'Set Password'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-400">
            Need help? Contact your Ignite Strategies representative.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-gray-400 mx-auto mb-4" />
          <p className="text-gray-300 text-xl">Loading...</p>
        </div>
      </div>
    }>
      <SetPasswordContent />
    </Suspense>
  );
}

