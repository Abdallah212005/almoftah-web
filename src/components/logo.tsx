'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

export function Logo() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-12 w-[180px] bg-muted/10 rounded animate-pulse" />;
  }

  return (
    <div 
      className="flex items-center justify-center h-12 w-auto" 
      title="Almoftah Real Estate Services"
    >
      <div className="h-12 w-[180px] relative">
        <Image 
          src="/logo.png"
          alt="Almoftah Real Estate Services" 
          className="h-full w-auto object-contain"
          width={180}
          height={48}
          priority
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      </div>
    </div>
  );
}