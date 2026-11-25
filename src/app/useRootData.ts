import { useRouteLoaderData } from 'react-router-dom';
import { localizeContent, localizeGamification, localizeGuide } from '../content/localize';
import type { FilContent } from '../content/schemas.v3';
import { getTranslations } from '../content/translations';
import { useLanguage } from '../i18n/useLanguage';
import type { RootData } from './routes';

// Localized once per (content, translation) pair, not once per component.
let cache: { data: RootData; translations: FilContent; result: RootData } | null = null;

function localize(data: RootData, translations: FilContent): RootData {
  if (cache?.data === data && cache.translations === translations) return cache.result;
  const content = localizeContent(data.content, translations);
  const byId = new Map(content.stops.map((stop) => [stop.id, stop]));
  const result = {
    content,
    stops: data.stops.map((stop) => byId.get(stop.id) ?? stop),
    guide: localizeGuide(data.guide, translations['i18n/fil.guide']),
    gamification: localizeGamification(data.gamification, translations['i18n/fil.gamification']),
  };
  cache = { data, translations, result };
  return result;
}

/**
 * The loaded content and visible stops, available on every page, in the player's language
 * (SRS v2.3 §3.10: Filipino where it exists, English for any string it lacks).
 */
export function useRootData(): RootData {
  const data = useRouteLoaderData('root') as RootData | undefined;
  if (!data) throw new Error('useRootData must be used inside the root route');
  const translations = useLanguage() === 'fil' ? getTranslations() : null;
  return translations ? localize(data, translations) : data;
}
