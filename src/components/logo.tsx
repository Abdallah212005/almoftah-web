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
    return <div className="h-16 w-16 bg-muted/5 rounded-full animate-pulse" />;
  }

  return (
    <Link href="/" className="flex items-center transition-opacity hover:opacity-90 h-full relative z-10">
      <div className="relative h-28 w-28 md:h-36 md:w-36 -mt-2">
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
