// Pixel icons on an 8 × 8 grid (SRS §7.7). Decorative: the links carry the text.
const svgProps = {
  width: 20,
  height: 20,
  viewBox: '0 0 8 8',
  shapeRendering: 'crispEdges',
  'aria-hidden': true,
  focusable: false,
} as const;

export function MapIcon() {
  return (
    <svg {...svgProps}>
      <rect x="0" y="1" width="8" height="6" fill="currentColor" />
      <rect x="2" y="1" width="1" height="6" fill="var(--ink)" opacity="0.4" />
      <rect x="5" y="1" width="1" height="6" fill="var(--ink)" opacity="0.4" />
    </svg>
  );
}

export function TimelineIcon() {
  return (
    <svg {...svgProps}>
      <rect x="1" y="0" width="6" height="1" fill="currentColor" />
      <rect x="1" y="7" width="6" height="1" fill="currentColor" />
      <rect x="2" y="1" width="4" height="2" fill="currentColor" />
      <rect x="3" y="3" width="2" height="2" fill="currentColor" />
      <rect x="2" y="5" width="4" height="2" fill="currentColor" />
    </svg>
  );
}

export function PassportIcon() {
  return (
    <svg {...svgProps}>
      <rect x="1" y="0" width="6" height="8" fill="var(--ink)" />
      <rect x="3" y="2" width="2" height="2" fill="var(--gold)" />
      <rect x="2" y="5" width="4" height="1" fill="var(--gold)" />
    </svg>
  );
}

export function JournalIcon() {
  return (
    <svg {...svgProps}>
      <rect x="1" y="0" width="6" height="8" fill="currentColor" />
      <rect x="2" y="2" width="4" height="1" fill="var(--ink)" opacity="0.5" />
      <rect x="2" y="4" width="4" height="1" fill="var(--ink)" opacity="0.5" />
    </svg>
  );
}

export function MoreIcon() {
  return (
    <svg {...svgProps}>
      <rect x="0" y="3" width="2" height="2" fill="currentColor" />
      <rect x="3" y="3" width="2" height="2" fill="currentColor" />
      <rect x="6" y="3" width="2" height="2" fill="currentColor" />
    </svg>
  );
}
