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
    // Standardized skeleton size (h-24 w-24) to match the final desktop size and prevent hydration mismatch
    return <div className="h-20 w-20 md:h-24 md:w-24 bg-muted/5 rounded-full animate-pulse" />;
  }

  return (
    <Link href="/" className="flex items-center transition-opacity hover:opacity-90 h-full relative z-20">
      <div className="relative h-20 w-20 md:h-24 md:w-24 -mt-1">
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
