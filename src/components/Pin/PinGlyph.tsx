// The pixel map pin from the mockup: a 10 × 12 grid drawn with crisp rectangles.
interface PinGlyphProps {
  color: string;
  dot: string;
  big?: boolean;
}

export const PIN_SIZE = { small: { w: 24, h: 29 }, big: { w: 34, h: 41 } } as const;

export default function PinGlyph({ color, dot, big = false }: PinGlyphProps) {
  const { w, h } = big ? PIN_SIZE.big : PIN_SIZE.small;
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 10 12"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
      style={{
        filter:
          'drop-shadow(2px 0 0 var(--ink)) drop-shadow(-2px 0 0 var(--ink)) drop-shadow(0 2px 0 var(--ink)) drop-shadow(0 -2px 0 var(--ink)) drop-shadow(3px 3px 0 rgba(31, 26, 36, 0.35))',
      }}
    >
      <rect x="3" y="0" width="4" height="1" fill={color} />
      <rect x="2" y="1" width="6" height="1" fill={color} />
      <rect x="1" y="2" width="8" height="5" fill={color} />
      <rect x="2" y="7" width="6" height="1" fill={color} />
      <rect x="3" y="8" width="4" height="1" fill={color} />
      <rect x="4" y="9" width="2" height="3" fill={color} />
      <rect x="2" y="2" width="2" height="1" fill="#FFFFFF" opacity="0.55" />
      <rect x="4" y="3" width="2" height="2" fill={dot} />
    </svg>
  );
}
