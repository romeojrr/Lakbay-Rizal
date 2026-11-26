// SRS v2.3 §3.10: Filipino text over the English content, falling back string by string.
import { describe, expect, it } from 'vitest';
import { realContent, realContentV3 } from '../test/content';
import { localizeContent, localizeStopV3 } from './localize';
import type { FilContent } from './schemas.v3';
import { isDraftTranslation } from './translations';

const content = realContent();
const v3 = realContentV3();
const fil: FilContent = {
  'i18n/fil.stops': v3['i18n/fil.stops'],
  'i18n/fil.guide': v3['i18n/fil.guide'],
  'i18n/fil.gamification': v3['i18n/fil.gamification'],
};

describe('localizeContent', () => {
  const localized = localizeContent(content, fil);
  const calamba = localized.stops.find((s) => s.id === 'calamba-1861');

  it('uses the Filipino title, teaser, date, places and scene text', () => {
    expect(calamba).toMatchObject({
      title: 'Isinilang sa Calamba',
      teaser: 'Isang bahay sa tabi ng lawa, at isang inang nagtuturo',
      dateLabel: '19 Hunyo 1861',
      place: { then: 'Calamba, Laguna', today: 'Lungsod ng Calamba, Laguna' },
      scene: { time: 'Umaga' },
    });
  });

  it('keeps ids, numbers, images and sources in English', () => {
    const english = content.stops.find((s) => s.id === 'calamba-1861');
    expect(calamba?.place.lat).toBe(english?.place.lat);
    expect(calamba?.scene.image).toBe(english?.scene.image);
    expect(calamba?.sources).toEqual(english?.sources);
    expect(calamba?.order).toBe(1);
  });

  it('falls back to English for each missing string', () => {
    // fil.stops.json has no summary (`story`), so Read more stays English for now.
    const english = content.stops.find((s) => s.id === 'calamba-1861');
    expect(calamba?.story).toBe(english?.story);
    // Only some characters have a Filipino name.
    expect(localized.characters.jesuit?.name).toBe('Gurong Heswita');
    expect(localized.characters.rizal?.name).toBe('José Rizal');
  });

  it('translates regions, items and builder facts', () => {
    expect(localized.regions.find((r) => r.id === 'philippines')?.label).toBe('Pilipinas');
    expect(localized.items['moth-story']?.name).toBe('Ang kuwento ng gamugamo');
    expect(localized.items['moth-story']?.icon).toBe(content.items['moth-story']?.icon);
    expect(localized.builder.projects.school.cost).toEqual(content.builder.projects.school.cost);
    expect(localized.builder.projects.school.fact).not.toBe(content.builder.projects.school.fact);
  });

  it('treats an empty Filipino string as missing', () => {
    const blank: FilContent = JSON.parse(JSON.stringify(fil)) as FilContent;
    const stop = blank['i18n/fil.stops'].stops['calamba-1861'];
    if (stop) stop.title = '  ';
    const result = localizeContent(content, blank).stops.find((s) => s.id === 'calamba-1861');
    expect(result?.title).toBe('Born in Calamba');
  });

  it('does not change the English content', () => {
    expect(content.stops.find((s) => s.id === 'calamba-1861')?.title).toBe('Born in Calamba');
    expect(localizeContent(content, null)).toBe(content);
  });
});

describe('localizeStopV3', () => {
  const english = content.stops.find((s) => s.id === 'calamba-1861');
  if (!english) throw new Error('calamba-1861');
  const stop = localizeStopV3(english, fil['i18n/fil.stops'].stops['calamba-1861']);

  it('translates chapters, lines and facts, keeping speakers, moods and sources', () => {
    const [chapter] = stop.chapters;
    expect(chapter?.title).toBe('Isang bahay sa tabi ng lawa');
    expect(chapter?.narration).toHaveLength(2);
    expect(chapter?.lines[0]).toMatchObject({
      speaker: 'teodora',
      mood: 'happy',
      onScene: true,
      text: 'José, halika at tingnan mo. Kita mo ang buong Makiling mula rito.',
    });
    expect(chapter?.fact?.sourceId).toBe('zaide');
    expect(chapter?.fact?.text).toMatch(/^Ang ikalawa niyang pangalan/);
  });

  it('translates the quiz text but keeps ids and answers', () => {
    const [order, mcq] = stop.quiz;
    expect(order?.type).toBe('order');
    expect(order?.prompt).toMatch(/^Ayusin/);
    if (order?.type === 'order') {
      expect(order.items.map((i) => i.id)).toEqual(order.answer);
      expect(order.items[0]?.text).toBe('Isinilang sa Calamba (1861)');
    }
    if (mcq?.type === 'mcq' && english.quiz[1]?.type === 'mcq') {
      expect(mcq.answer).toBe(english.quiz[1].answer);
      expect(mcq.options.map((o) => o.id)).toEqual(english.quiz[1].options.map((o) => o.id));
    }
  });
});

describe('isDraftTranslation (§3.10)', () => {
  it('the shipped Filipino files are reviewed: no "Draft translation" badge', () => {
    expect(isDraftTranslation(fil)).toBe(false);
  });

  it('is true while any Filipino file is a draft, or before they load', () => {
    expect(isDraftTranslation(null)).toBe(true);
    const files = JSON.parse(JSON.stringify(fil)) as FilContent;
    files['i18n/fil.stops'].status = 'draft';
    files['i18n/fil.guide'].status = 'draft';
    files['i18n/fil.gamification'].status = 'draft';
    expect(isDraftTranslation(files)).toBe(true);
    files['i18n/fil.stops'].status = 'reviewed';
    files['i18n/fil.guide'].status = 'reviewed';
    expect(isDraftTranslation(files)).toBe(true);
    files['i18n/fil.gamification'].status = 'reviewed';
    expect(isDraftTranslation(files)).toBe(false);
  });
});
