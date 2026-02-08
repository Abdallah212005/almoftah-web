'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export function Logo() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-10 w-48 bg-muted/10 rounded animate-pulse" />;
  }

  return (
    <div className="flex items-center gap-2 group transition-opacity hover:opacity-90">
      <div className="flex items-center justify-center h-10 w-10 bg-primary rounded-xl shadow-lg transform group-hover:rotate-12 transition-transform duration-300">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6 text-primary-foreground"
        >
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <path d="M9 22V12h6v10" />
        </svg>
      </div>
      <div className="flex flex-col -space-y-1">
        <span className="text-xl font-bold font-headline tracking-tighter text-foreground">
          ALMOFTAH
        </span>
        <span className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase">
          Real Estate
        </span>
      </div>
    </div>
  );
}
