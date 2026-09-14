export function Mark({ className = '' }: { className?: string }) {
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
