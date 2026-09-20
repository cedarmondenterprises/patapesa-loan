export function Mark({ className = '' }: { className?: string }) {
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
export default function Brand() {
  return (
    <div className="brand">
      <Mark />
      <span>
        <strong>PataPesa</strong>
        <small>Credit operations</small>
      </span>
    </div>
  );
}
