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
    <div className="flex items-center gap-3 group transition-opacity hover:opacity-90">
      <div className="flex items-center justify-center h-12 w-12 bg-[#2E3192] rounded-2xl shadow-sm overflow-hidden">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-7 w-7"
        >
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </div>
      <div className="flex flex-col">
        <span className="text-2xl font-black tracking-tight text-[#1A1A1A] leading-none">
          ALMOFTAH
        </span>
        <span className="text-[11px] font-bold tracking-[0.25em] text-[#2E3192] uppercase mt-1">
          REAL ESTATE
        </span>
      </div>
    </div>
  );
}
