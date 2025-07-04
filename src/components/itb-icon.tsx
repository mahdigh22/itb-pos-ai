import React from 'react';
import { cn } from '@/lib/utils';

export default function ItbIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 52 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-8 w-8", className)}
      aria-hidden="true"
    >
      <path d="M4 12V8C4 5.79086 5.79086 4 8 4H12" stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round" />
      <path d="M4 40V44C4 46.2091 5.79086 48 8 48H12" stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round" />
      <path d="M40 4H44C46.2091 4 48 5.79086 48 8V12" stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round" />
      <path d="M48 40V44C48 46.2091 46.2091 48 44 48H40" stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round" />
      <path d="M26 4V4" stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round" />
      <path d="M26 48V48" stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round" />
      <path d="M4 26H4" stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round" />
      <path d="M48 26H48" stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round" />
      <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontFamily="Poppins, sans-serif" fontSize="20" fontWeight="bold" fill="hsl(var(--accent))">
        ITB
      </text>
    </svg>
  );
}
