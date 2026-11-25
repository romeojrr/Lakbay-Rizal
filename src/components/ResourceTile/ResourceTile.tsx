import type { Material } from '../../content/schemas';
import { t } from '../../i18n/t';
import styles from './ResourceTile.module.css';

// Pixel icons on a 10 × 10 grid, from Dapitan.dc.html (SRS §7.7).
const ICONS: Record<Material, JSX.Element> = {
  bamboo: (
    <>
      <rect x="1" y="0" width="2" height="10" fill="#5BAA3C" />
      <rect x="4" y="1" width="2" height="9" fill="#6DC048" />
      <rect x="7" y="0" width="2" height="10" fill="#4E9A34" />
      <rect x="1" y="3" width="2" height="1" fill="#2F6E22" />
      <rect x="4" y="5" width="2" height="1" fill="#2F6E22" />
      <rect x="7" y="2" width="2" height="1" fill="#2F6E22" />
      <rect x="7" y="7" width="2" height="1" fill="#2F6E22" />
    </>
  ),
  stone: (
    <>
      <rect x="1" y="4" width="8" height="5" fill="#9C9384" />
      <rect x="2" y="2" width="5" height="3" fill="#B9B1A2" />
      <rect x="6" y="5" width="3" height="4" fill="#7A7266" />
      <rect x="3" y="3" width="2" height="1" fill="#D5D0C5" />
    </>
  ),
  tools: (
    <>
      <rect x="1" y="1" width="6" height="3" fill="#7D8792" />
      <rect x="1" y="1" width="6" height="1" fill="#B9C1CA" />
      <rect x="4" y="4" width="2" height="6" fill="#A2744E" />
      <rect x="5" y="4" width="1" height="6" fill="#7A5230" />
    </>
  ),
};

export default function ResourceTile({ material, amount }: { material: Material; amount: number }) {
  return (
    <li className={styles.tile}>
      <svg
        width="30"
        height="30"
        viewBox="0 0 10 10"
        shapeRendering="crispEdges"
        aria-hidden="true"
        focusable="false"
      >
        {ICONS[material]}
      </svg>
      <span className={styles.amount}>{amount}</span>
      <span className={styles.name}>{t(`materials.${material}`)}</span>
    </li>
  );
}
