'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import logoImg from '@/logo.png';

export function Logo() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Standardized skeleton size to fix hydration mismatch
    return <div className="h-20 w-20 bg-muted/5 rounded-full animate-pulse" />;
  }

  return (
    <Link href="/" className="flex items-center transition-opacity hover:opacity-90 h-full relative z-20">
      <div className="relative h-24 w-24 md:h-28 md:w-28 -mt-1">
        <Image 
          src={logoImg} 
          alt="Almoftah Logo" 
          fill
          className="object-contain"
          priority
        />
      </div>
    </Link>
  );
}
