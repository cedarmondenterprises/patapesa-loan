import Link from 'next/link';

export function LogoMark({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path
        d="M7 8h17.5C35.3 8 42 13.6 42 23S35.3 38 24.5 38H16"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
      />
      <path
        d="M7 8v32M8 24h17.5c3.8 0 6.5-1.7 6.5-5s-2.7-5-6.5-5H15"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
      />
      <path d="M35 38h8" stroke="#df4f2f" strokeWidth="5" />
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
      {!compact && <span className="text-[1.28rem] font-black tracking-[-0.045em]">PataPesa</span>}
    </Link>
  );
}
