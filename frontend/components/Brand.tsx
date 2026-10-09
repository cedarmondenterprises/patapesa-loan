import Link from 'next/link';

export function LogoMark({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <rect width="48" height="48" rx="11" fill="#16332f" />
      <path
        d="M14 35V13h10.4c6.2 0 10.1 3.4 10.1 8.7 0 5.5-4 8.9-10.3 8.9h-4.1V35H14Zm6.1-10h4c2.7 0 4.3-1.2 4.3-3.3 0-2-1.5-3.1-4.3-3.1h-4V25Z"
        fill="white"
      />
      <path d="M27.5 35h8" stroke="#9cceaf" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export default function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className="brand-wordmark inline-flex items-center gap-2.5 text-pata-900"
      aria-label="PataPesa home"
    >
      <LogoMark />
      {!compact && (
        <span className="brand-name">
          Pata<span>Pesa</span>
        </span>
      )}
    </Link>
  );
}
