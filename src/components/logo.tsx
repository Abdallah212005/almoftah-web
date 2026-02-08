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
    return <div className="h-12 w-48 bg-muted/10 rounded animate-pulse" />;
  }

  return (
    <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
      <div className="relative h-12 w-12 flex items-center justify-center">
        <Image 
          src={logoImg} 
          alt="Almoftah Logo" 
          width={48} 
          height={48} 
          className="object-contain"
          priority
        />
      </div>
      <div className="flex flex-col text-left">
        <span className="text-2xl font-black tracking-tight text-[#1A1A1A] leading-none">
          ALMOFTAH
        </span>
        <span className="text-[11px] font-bold tracking-[0.25em] text-[#2E3192] uppercase mt-1">
          REAL ESTATE
        </span>
      </div>
    </Link>
  );
}
