'use client';

import Image from 'next/image';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    // Simple redirect after 2 seconds - no auth check
    const timer = setTimeout(() => {
      router.replace('/login');
    }, 2000);

    return () => clearTimeout(timer);
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
