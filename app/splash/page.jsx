'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SplashPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let unsubscribe;
    const timer = setTimeout(async () => {
      try {
        // Dynamically import Firebase to avoid SSR issues
        const { onAuthStateChanged } = await import('firebase/auth');
        const { auth } = await import('@/lib/firebase');
        
        if (auth) {
          unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
              router.replace('/welcome');
            } else {
              router.replace('/login');
            }
          });
        } else {
          // No auth available, go to login
          router.replace('/login');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // On error, just go to login
        router.replace('/login');
      } finally {
        setChecking(false);
      }
    }, 2000);

    return () => {
      clearTimeout(timer);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center relative">
      {/* Powered by badge - top right */}
      <div className="absolute top-6 right-6">
        <p className="text-sm text-gray-400">
          powered by <span className="font-semibold text-gray-300">IgniteStrategies</span>
        </p>
      </div>

      <div className="text-center">
        <Image
          src="/logo.png"
          alt="Ignite Strategies"
          width={128}
          height={128}
          className="mx-auto mb-8 h-32 w-32 object-contain"
          priority
        />
        <h1 className="text-4xl font-bold text-white mb-2">
          Welcome to Client Portal
        </h1>
        <p className="text-xl text-gray-400 mb-4">
          by Ignite Strategies
        </p>
        <p className="text-lg text-gray-500">
          Your engagement hub
        </p>
      </div>
    </div>
  );
}
