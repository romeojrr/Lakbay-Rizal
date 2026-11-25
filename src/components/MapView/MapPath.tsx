import type { TravelPath } from '../../features/map/mapModel';
import type { MapPoint } from '../../lib/projection';

const toPoints = (points: readonly MapPoint[]) =>
  points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');

interface MapPathProps {
  path: TravelPath;
  /** Extra dotted line, e.g. the 1888 rail route across America. */
  route?: MapPoint[];
}

/** Travel path (FR-14): orange through completed stops, faint dashes to the stops ahead. */
export default function MapPath({ path, route }: MapPathProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 }}
    >
      {route && route.length > 1 && (
        <polyline
          points={toPoints(route)}
          fill="none"
          stroke="var(--ink)"
          strokeWidth="3"
          strokeDasharray="2 4"
          vectorEffect="non-scaling-stroke"
        />
      )}
      {path.ahead.length > 1 && (
        <polyline
          points={toPoints(path.ahead)}
          fill="none"
          stroke="var(--ink)"
          strokeWidth="2.5"
          strokeDasharray="4 6"
          opacity="0.45"
          vectorEffect="non-scaling-stroke"
        />
      )}
      {path.travelled.length > 1 && (
        <>
          <polyline
            points={toPoints(path.travelled)}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="7"
            vectorEffect="non-scaling-stroke"
          />
          <polyline
            points={toPoints(path.travelled)}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="3.5"
            strokeDasharray="10 5"
            vectorEffect="non-scaling-stroke"
          />
        </>
      )}
    </svg>
  );
}
