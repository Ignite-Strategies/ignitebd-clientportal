'use client';

import Image from 'next/image';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Handshake } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [oobCode, setOobCode] = useState('');

  useEffect(() => {
    // Get oobCode from URL query params
    const code = searchParams.get('oobCode') || searchParams.get('code');
    const mode = searchParams.get('mode');
    
    if (!code) {
      setError('Invalid reset link. Please request a new password reset link.');
      return;
    }

    if (mode !== 'resetPassword') {
      setError('Invalid reset link. This link is not for password reset.');
      return;
    }

    setOobCode(code);
  }, [searchParams]);

  const handleResetPassword = async (event) => {
    event.preventDefault();
    if (loading || !oobCode) return;

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
      const { confirmPasswordReset } = await import('firebase/auth');
      const { auth } = await import('@/lib/firebase');

      // Confirm password reset with Firebase
      await confirmPasswordReset(auth, oobCode, password);

      setSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login?passwordReset=success');
      }, 2000);
    } catch (error) {
      console.error('Password reset error:', error);
      setError(error.message || 'Failed to reset password. The link may have expired. Please request a new one.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking for oobCode
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || (!oobCode && !error)) {
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
              Your password has been set. Redirecting to login...
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
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-900/30 border border-red-700/50 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full rounded-lg bg-gray-800 border border-gray-600 text-white px-4 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 placeholder:text-gray-500"
                placeholder="••••••••"
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-400">
                Must be at least 8 characters
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full rounded-lg bg-gray-800 border border-gray-600 text-white px-4 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 placeholder:text-gray-500"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !oobCode}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-gray-400 mx-auto mb-4" />
          <p className="text-gray-300 text-xl">Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}

