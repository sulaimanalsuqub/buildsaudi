import type { SVGProps } from 'react';

export type CategoryIconProps = SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number | string };

function base({ size = 24, strokeWidth = 1.5, ...props }: CategoryIconProps) {
  return { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, ...props };
}

/** Tap over a basin — sanitaryware. */
export function SanitarywareIcon(props: CategoryIconProps) {
  return <svg {...base(props)}>
    <path d="M8 19V10C8 7 10 6 13 6C16 6 17 8 17 11V14" />
    <line x1="8" y1="9" x2="4" y2="7" />
    <path d="M3 19Q12 22 21 19" />
  </svg>;
}

/** Bulb with filament — electrical & lighting. */
export function ElectricalIcon(props: CategoryIconProps) {
  return <svg {...base(props)}>
    <circle cx="12" cy="9" r="6" />
    <path d="M9.5 15h5M10 17.5h4M11 19.5h2" />
    <path d="M10 9l2-2 2 2-2 2-2-2z" />
  </svg>;
}

/** Gate valve on a pipe run — plumbing & piping. */
export function PlumbingIcon(props: CategoryIconProps) {
  return <svg {...base(props)}>
    <line x1="3" y1="14" x2="21" y2="14" />
    <path d="M6 10 12 14 6 18ZM18 10 12 14 18 18Z" />
    <line x1="12" y1="14" x2="12" y2="8" />
    <circle cx="12" cy="6" r="2" />
  </svg>;
}

/** Wall unit blowing airflow — HVAC. */
export function HvacIcon(props: CategoryIconProps) {
  return <svg {...base(props)}>
    <rect x="3" y="5" width="18" height="6" rx="2" />
    <line x1="6" y1="8" x2="18" y2="8" />
    <path d="M5 14q1.5 2 3 0t3 0 3 0 3 0 3 0M5 19q1.5 2 3 0t3 0 3 0 3 0 3 0" />
  </svg>;
}

/** Offset tile run — flooring. */
export function FlooringIcon(props: CategoryIconProps) {
  return <svg {...base(props)}>
    <rect x="3" y="4" width="18" height="16" rx="1" />
    <path d="M3 9h18M3 15h18M12 4v5M8 9v6M16 9v6M12 15v5" />
  </svg>;
}

/** Panelled wall section — wall finishes. */
export function WallsIcon(props: CategoryIconProps) {
  return <svg {...base(props)}>
    <rect x="4" y="3" width="16" height="18" rx="1" />
    <path d="M9 3v18M14 3v18M19 3v18" />
  </svg>;
}

/** Paint roller — paints & coatings. */
export function PaintsIcon(props: CategoryIconProps) {
  return <svg {...base(props)}>
    <rect x="4" y="4" width="14" height="5" rx="1" />
    <path d="M8 9v2h6v-2" />
    <line x1="11" y1="11" x2="18" y2="20" />
  </svg>;
}

/** Notched trowel — adhesives & sealants. */
export function AdhesivesIcon(props: CategoryIconProps) {
  return <svg {...base(props)}>
    <path d="M8 4h8l-1 9H9z" />
    <path d="M9 13l1.5 2 1.5-2 1.5 2 1.5-2" />
    <line x1="12" y1="2" x2="12" y2="4" />
  </svg>;
}

export const categoryIcons = [SanitarywareIcon, ElectricalIcon, PlumbingIcon, HvacIcon, FlooringIcon, WallsIcon, PaintsIcon, AdhesivesIcon];
