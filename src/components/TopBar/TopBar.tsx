import { Link } from 'react-router-dom';
import type { Region, RegionId } from '../../content/schemas';
import { t } from '../../i18n/t';
import { asset } from '../../lib/asset';
import LanguageSwitch from '../LanguageSwitch/LanguageSwitch';
import RegionTabs from '../RegionTabs/RegionTabs';
import SaveIndicator from '../SaveIndicator/SaveIndicator';
import XpBar from '../XpBar/XpBar';
import { PassportIcon } from '../BottomNav/navIcons';
import styles from './TopBar.module.css';

interface TopBarProps {
  regions: readonly Pick<Region, 'id' | 'label'>[];
  nextRegion?: RegionId;
  earned: number;
  total: number;
}

/**
 * Slim top bar (SRS v2.3 §5.5): 56 px on desktop, 48 px on phones. Region tabs, Scenes and
 * Passport move to the map screen and the bottom navigation on phones.
 */
export default function TopBar({ regions, nextRegion, earned, total }: TopBarProps) {
  return (
    <header className={styles.bar}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoSprite} aria-hidden="true">
            <img className="pix" src={asset('assets/sprites/rizal_adult_suit.png')} alt="" />
          </span>
          <span className={styles.logoText}>{t('app.logo')}</span>
        </Link>
        <div className={styles.tabs}>
          <RegionTabs regions={regions} nextRegion={nextRegion} />
        </div>
        <Link to="/scenes" className={styles.link}>
          {t('nav.scenes')}
        </Link>
        <XpBar />
        <SaveIndicator />
        <LanguageSwitch />
        <Link to="/passport" className={styles.passport} data-guide="passport-button">
          <PassportIcon />
          {t('nav.passport', { done: earned, total })}
        </Link>
      </div>
    </header>
  );
}
