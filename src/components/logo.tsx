import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 80"
      className={cn("text-primary", className)}
      aria-label="Growth Academy Logo"
    >
      <defs>
        <linearGradient id="bookGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#002D62' }} />
          <stop offset="100%" style={{ stopColor: '#0053A0' }} />
        </linearGradient>
        <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#34A853' }} />
          <stop offset="100%" style={{ stopColor: '#81C784' }} />
        </linearGradient>
      </defs>
      
      {/* Book */}
      <path 
        d="M95 70 C 95 72.76 92.76 75 90 75 H 10 C 7.24 75 5 72.76 5 70 L 5 25 C 15 20, 35 15, 50 15 C 65 15, 85 20, 95 25 Z" 
        fill="url(#bookGradient)"
      />
      <path 
        d="M50 18 C 35 18, 15 23, 5 28 L 5 70 C 5 72.76, 7.24 75, 10 75 L 50 75 L 50 18 Z" 
        fill="#002D62"
      />
       <path 
        d="M50 18 C 65 18, 85 23, 95 28 L 95 70 C 95 72.76, 92.76 75, 90 75 L 50 75 L 50 18 Z" 
        fill="#004080"
      />
      <path
        d="M50 75 C 45 75, 42 72, 42 72 C 40 70, 50 68, 50 68 C 50 68, 60 70, 58 72 C 58 72, 55 75, 50 75 Z"
        fill="#FFFFFF"
        opacity="0.2"
      />

      {/* Pages coming out */}
      <path d="M50 15 L 65 60 L 35 60 Z" fill="#34A853" />
      <path d="M50 20 L 60 55 L 40 55 Z" fill="#FFFFFF" />

      {/* Arrow */}
      <path d="M50 5 L 65 25 L 55 25 L 55 50 L 45 50 L 45 25 L 35 25 Z" fill="url(#arrowGradient)" />
    </svg>
  );
}
