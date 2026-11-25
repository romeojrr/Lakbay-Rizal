// The pixel map pin from the mockup: a 10 × 12 grid drawn with crisp rectangles.
// The 2 px ink outline and the hard shadow are drawn as copies of the shape inside the SVG
// (overflow visible), not with CSS drop-shadow filters, which are slow to paint (NFR-1).
interface PinGlyphProps {
  color: string;
  dot: string;
  big?: boolean;
}

export const PIN_SIZE = { small: { w: 24, h: 29 }, big: { w: 34, h: 41 } } as const;

const SHAPE: [number, number, number, number][] = [
  [3, 0, 4, 1],
  [2, 1, 6, 1],
  [1, 2, 8, 5],
  [2, 7, 6, 1],
  [3, 8, 4, 1],
  [4, 9, 2, 3],
];

const OUTLINE_PX = 2;
const SHADOW_PX = 3;

function Shape({ dx = 0, dy = 0, fill }: { dx?: number; dy?: number; fill?: string }) {
  return (
    <g transform={`translate(${dx} ${dy})`} fill={fill}>
      {SHAPE.map(([x, y, w, h]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} />
      ))}
    </g>
  );
}

export default function PinGlyph({ color, dot, big = false }: PinGlyphProps) {
  const { w, h } = big ? PIN_SIZE.big : PIN_SIZE.small;
  const unit = w / 10; // px per grid cell
  const o = OUTLINE_PX / unit;
  const s = SHADOW_PX / unit;
  const outline: [number, number][] = [
    [o, 0],
    [-o, 0],
    [0, o],
    [0, -o],
  ];
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 10 12"
      shapeRendering="crispEdges"
      overflow="visible"
      aria-hidden="true"
      focusable="false"
    >
      {/* Hard shadow of the outlined pin, drawn once at 35 % so overlaps do not darken. */}
      <g opacity="0.35" fill="var(--ink)">
        <Shape dx={s} dy={s} />
        {outline.map(([dx, dy]) => (
          <Shape key={`s${dx}${dy}`} dx={dx + s} dy={dy + s} />
        ))}
      </g>
      <g fill="var(--ink)">
        {outline.map(([dx, dy]) => (
          <Shape key={`o${dx}${dy}`} dx={dx} dy={dy} />
        ))}
      </g>
      <Shape fill={color} />
      <rect x="2" y="2" width="2" height="1" fill="#FFFFFF" opacity="0.55" />
      <rect x="4" y="3" width="2" height="2" fill={dot} />
    </svg>
  );
}
