'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Handshake } from 'lucide-react';

export default function SplashPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    // Smooth fade in animation
    const fadeTimer = setTimeout(() => setFadeIn(true), 50);

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
    }, 2500); // 2500ms delay - smoother transition

    return () => {
      clearTimeout(timer);
      clearTimeout(fadeTimer);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [router]);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 flex items-center justify-center relative transition-all duration-1000 ease-in-out ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
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

      {/* Handshake icon centered */}
      <div className="text-center">
        <div className="mb-8 flex justify-center">
          <Handshake className="h-24 w-24 text-gray-300" strokeWidth={2} />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">
          Client Portal
        </h1>
        <p className="text-lg text-gray-400">
          Your engagement hub
        </p>
      </div>
    </div>
  );
}
