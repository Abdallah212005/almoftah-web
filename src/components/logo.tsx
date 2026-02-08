'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import logoImg from '@/logo.png';

export function Logo() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-12 w-[180px]" />;
  }

  return (
    <div 
      className="flex items-center justify-center h-12 w-auto" 
      title="Almoftah Real Estate Services"
    >
      <div className="h-12 w-[180px] relative">
        <Image 
          src={logoImg}
          alt="Almoftah Real Estate Services" 
          className="h-full w-auto object-contain"
          width={180}
          height={48}
          priority
          unoptimized
        />
      </div>
    </div>
  );
}
