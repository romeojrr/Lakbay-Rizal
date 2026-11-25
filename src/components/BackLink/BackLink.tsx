import type { MouseEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styles from './BackLink.module.css';

interface BackLinkProps {
  /** Where to go when there is no earlier page in this visit (e.g. a shared link). */
  fallback: string;
  label: string;
}

/** Returns to the page the player came from (FR-3), or to `fallback`. */
export default function BackLink({ fallback, label }: BackLinkProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const hasHistory = location.key !== 'default';

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!hasHistory || event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    navigate(-1);
  };

  return (
    <Link to={fallback} className={styles.back} onClick={onClick}>
      {label}
    </Link>
  );
}
