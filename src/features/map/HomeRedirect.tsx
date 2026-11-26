import { Navigate } from 'react-router-dom';
import { useRootData } from '../../app/useRootData';
import { getNextStop } from '../../content/selectors';
import { useProgress } from '../../store/progress';
import { useUi } from '../../store/ui';

/** `/map` opens the map on the last region viewed, else the region of the next stop (FR-2). */
export default function HomeRedirect() {
  const { content, stops } = useRootData();
  const completed = useProgress((s) => s.completed);
  const lastRegion = useUi((s) => s.lastRegion);
  const region =
    lastRegion ??
    getNextStop(stops, { completed })?.region ??
    content.regions[0]?.id ??
    'philippines';
  return <Navigate to={`/region/${region}`} replace />;
}
