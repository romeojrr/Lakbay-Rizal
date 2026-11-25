import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { t, type MessageKey } from '../../i18n/t';
import styles from './PassportPage.module.css';

export type TabId = 'stamps' | 'achievements' | 'rank';

const TABS: { id: TabId; label: MessageKey }[] = [
  { id: 'stamps', label: 'passport.tabStamps' },
  { id: 'achievements', label: 'passport.tabAchievements' },
  { id: 'rank', label: 'passport.tabRank' },
];

/**
 * SRS v2.3 §3.8: the stamp page has three tabs: Stamps · Achievements · Rank. ARIA tabs:
 * arrow keys move between them, Home/End jump to the ends.
 */
export default function PassportTabs({ panels }: { panels: Record<TabId, ReactNode> }) {
  const [active, setActive] = useState<TabId>('stamps');
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const onKey = (event: KeyboardEvent, index: number) => {
    const last = TABS.length - 1;
    const to =
      event.key === 'ArrowRight'
        ? (index + 1) % TABS.length
        : event.key === 'ArrowLeft'
          ? (index - 1 + TABS.length) % TABS.length
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : -1;
    const tab = TABS[to];
    if (!tab) return;
    event.preventDefault();
    setActive(tab.id);
    refs.current[tab.id]?.focus();
  };

  return (
    <>
      <div className={styles.tabs} role="tablist" aria-label={t('passport.tabs')}>
        {TABS.map((tab, index) => (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[tab.id] = el;
            }}
            id={`tab-${tab.id}`}
            type="button"
            role="tab"
            className={styles.tab}
            aria-selected={active === tab.id}
            aria-controls={`panel-${tab.id}`}
            tabIndex={active === tab.id ? 0 : -1}
            onClick={() => setActive(tab.id)}
            onKeyDown={(event) => onKey(event, index)}
          >
            {t(tab.label)}
          </button>
        ))}
      </div>
      {TABS.map((tab) => (
        <div
          key={tab.id}
          id={`panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${tab.id}`}
          hidden={active !== tab.id}
          className={styles.tabPanel}
        >
          {active === tab.id && panels[tab.id]}
        </div>
      ))}
    </>
  );
}
