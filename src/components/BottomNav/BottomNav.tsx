import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { RegionId } from '../../content/schemas';
import { t } from '../../i18n/t';
import { cx } from '../../lib/cx';
import Dialog from '../Dialog/Dialog';
import styles from './BottomNav.module.css';
import { JournalIcon, MapIcon, MoreIcon, PassportIcon, TimelineIcon } from './navIcons';

interface BottomNavProps {
  /** Region the Map item opens: the last one viewed, else the next stop's. */
  mapRegion: RegionId;
  earned: number;
  total: number;
}

interface ItemProps {
  to: string;
  icon: ReactNode;
  label: string;
  current: boolean;
  state?: unknown;
  name?: string;
  guide?: string;
}

function Item({ to, icon, label, current, state, name, guide }: ItemProps) {
  return (
    <li>
      <Link
        to={to}
        state={state}
        className={cx(styles.item, current && styles.current)}
        aria-current={current ? 'page' : undefined}
        aria-label={name}
        data-guide={guide}
      >
        {icon}
        <span className={styles.label}>{label}</span>
      </Link>
    </li>
  );
}

/** Phone navigation bar (≤ 640 px): Map · Timeline · Passport · Journal · More (SRS v2.3 §5.5). */
export default function BottomNav({ mapRegion, earned, total }: BottomNavProps) {
  const { pathname } = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const map = `/region/${mapRegion}`;
  const close = () => setMoreOpen(false);

  return (
    <>
      <nav className={styles.nav} aria-label={t('nav.main')}>
        <ul className={styles.list}>
          <Item
            to={map}
            icon={<MapIcon />}
            label={t('nav.map')}
            current={pathname.startsWith('/region')}
          />
          {/* The /timeline page arrives in U7; until then this opens the map's timeline. */}
          <Item
            to={map}
            state={{ openTimeline: true }}
            icon={<TimelineIcon />}
            label={t('nav.timeline')}
            current={false}
          />
          <Item
            to="/passport"
            icon={<PassportIcon />}
            label={t('nav.passportShort')}
            name={t('nav.passportCount', { label: t('nav.passport'), done: earned, total })}
            current={pathname === '/passport'}
            guide="passport-button"
          />
          <Item
            to="/journal"
            icon={<JournalIcon />}
            label={t('nav.journal')}
            current={pathname === '/journal'}
          />
          <li>
            <button
              type="button"
              className={styles.item}
              aria-haspopup="dialog"
              onClick={() => setMoreOpen(true)}
            >
              <MoreIcon />
              <span className={styles.label}>{t('nav.more')}</span>
            </button>
          </li>
        </ul>
      </nav>
      <Dialog open={moreOpen} onClose={close} title={t('nav.more')}>
        <ul className={styles.more}>
          <li>
            <Link to="/scenes" onClick={close}>
              {t('nav.scenes')}
            </Link>
          </li>
          <li>
            <Link to="/settings" onClick={close}>
              {t('footer.settings')}
            </Link>
          </li>
          <li>
            <Link to="/credits" onClick={close}>
              {t('footer.credits')}
            </Link>
          </li>
        </ul>
      </Dialog>
    </>
  );
}
