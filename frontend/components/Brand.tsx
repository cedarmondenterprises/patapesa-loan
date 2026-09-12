import Link from 'next/link';

export function LogoMark({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <rect width="48" height="48" rx="11" fill="currentColor" />
      <path
        d="M14 35V13h11.4c6.2 0 10.2 3.3 10.2 8.7 0 5.5-4 8.9-10.2 8.9h-4.7V35H14Zm6.7-10h4.2c2.6 0 4.1-1.2 4.1-3.3 0-2-1.5-3.2-4.1-3.2h-4.2V25Z"
        fill="#fffdf7"
      />
      <path d="M30 33.5h6V39h-6z" fill="#c88952" />
    </svg>
  );
}

export default function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2.5 text-pata-900"
      aria-label="PataPesa home"
    >
      <LogoMark />
      {!compact && (
        <span className="text-[1.35rem] font-extrabold tracking-[-0.035em]">PataPesa</span>
      )}
    </Link>
  );
}
