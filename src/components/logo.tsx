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
    return <div className="h-48 w-48 bg-muted/5 rounded-full animate-pulse" />;
  }

  return (
    <Link href="/" className="flex items-center transition-opacity hover:opacity-90">
      <div className="relative h-48 w-48">
        <Image 
          src={logoImg} 
          alt="Almoftah Logo" 
          width={192} 
          height={192} 
          className="object-contain"
          priority
        />
      </div>
    </Link>
  );
}
