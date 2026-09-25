const PETAL_COUNT = 18;

const petals = Array.from({ length: PETAL_COUNT }, (_, i) => {
  const angle = (i / PETAL_COUNT) * 2 * Math.PI;
  return {
    cx: 60 + 44 * Math.cos(angle),
    cy: 60 + 44 * Math.sin(angle),
  };
});

/** Scalloped "authentic warranty" seal — a strong, tamper-proof visual mark, not a real certification. */
export function WarrantySeal({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 150" className={className} aria-hidden="true">
      <path d="M46 96 L37 147 L60 130 Z" className="fill-brand-primary/60" />
      <path d="M74 96 L83 147 L60 130 Z" className="fill-brand-primary/60" />
      <g className="fill-brand-primary">
        {petals.map((p, i) => (
          <circle key={i} cx={p.cx} cy={p.cy} r="13" />
        ))}
        <circle cx="60" cy="60" r="38" />
      </g>
      <path d="M60 32 L83 41 V60 C83 77 73 88 60 94 C47 88 37 77 37 60 V41 Z" className="fill-white" />
      <path
        d="M49 60 L56 68 L72 50"
        className="stroke-brand-primary"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
