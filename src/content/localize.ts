// Puts the Filipino text over the English content (SRS v2.3 §3.10). Pure functions: the
// English content is never changed. Any Filipino string that is missing or empty keeps the
// English one, string by string. Ids, numbers, images and sources always stay English.
import type { Content, Question, Stop } from './schemas';
import type {
  FilContent,
  FilGamification,
  FilGuide,
  FilStop,
  Gamification,
  Guide,
} from './schemas.v3';

/** The Filipino string, or the English one when there is none. */
const pick = (fil: string | undefined, en: string): string =>
  fil !== undefined && fil.trim() !== '' ? fil : en;

/** Fields shared by v2 and v3 stops: title, teaser, date, places, scene text. */
function localizeStopBase<T extends Stop>(stop: T, fil: FilStop | undefined): T {
  if (!fil) return stop;
  return {
    ...stop,
    title: pick(fil.title, stop.title),
    teaser: pick(fil.teaser, stop.teaser),
    story: pick(fil.story, stop.story),
    dateLabel: pick(fil.dateLabel, stop.dateLabel),
    place: {
      ...stop.place,
      then: pick(fil.place?.then, stop.place.then),
      today: pick(fil.place?.today, stop.place.today),
    },
    scene: {
      ...stop.scene,
      alt: pick(fil.scene?.alt, stop.scene.alt),
      ...(stop.scene.time !== null ? { time: pick(fil.scene?.time, stop.scene.time) } : {}),
      ...(stop.scene.places
        ? {
            places: Object.fromEntries(
              Object.entries(stop.scene.places).map(([id, place]) => [
                id,
                {
                  ...place,
                  label: pick(fil.scene?.places?.[id]?.label, place.label),
                  alt: pick(fil.scene?.places?.[id]?.alt, place.alt),
                },
              ]),
            ),
          }
        : {}),
    },
  };
}

/** The content in Filipino: stops (with chapters and quiz), names, regions, items, facts. */
export function localizeContent(content: Content, fil: FilContent | null): Content {
  if (!fil) return content;
  const translated = fil['i18n/fil.stops'];
  return {
    ...content,
    stops: content.stops.map((stop) => localizeStopV3(stop, translated.stops[stop.id])),
    regions: content.regions.map((region) => ({
      ...region,
      label: pick(translated.regions?.[region.id], region.label),
    })),
    characters: Object.fromEntries(
      Object.entries(content.characters).map(([id, character]) => [
        id,
        { ...character, name: pick(translated.characters?.[id], character.name) },
      ]),
    ),
    items: Object.fromEntries(
      Object.entries(content.items).map(([id, item]) => [
        id,
        {
          ...item,
          name: pick(translated.items?.[id]?.name, item.name),
          desc: pick(translated.items?.[id]?.desc, item.desc),
        },
      ]),
    ),
    builder: {
      ...content.builder,
      projects: {
        school: localizeProject(content.builder.projects.school, translated.builder?.school),
        clinic: localizeProject(content.builder.projects.clinic, translated.builder?.clinic),
        water: localizeProject(content.builder.projects.water, translated.builder?.water),
      },
    },
  };
}

function localizeProject<T extends { fact: string }>(project: T, fact: string | undefined): T {
  return { ...project, fact: pick(fact, project.fact) };
}

/** A v3 stop in Filipino: the shared fields plus chapters, lines, facts and quiz text. */
export function localizeStopV3(stop: Stop, fil: FilStop | undefined): Stop {
  if (!fil) return stop;
  const base = localizeStopBase(stop, fil);
  return {
    ...base,
    chapters: stop.chapters.map((chapter, ci) => {
      const t = fil.chapters?.[ci];
      if (!t) return chapter;
      return {
        ...chapter,
        title: pick(t.title, chapter.title),
        narration: chapter.narration.map((p, i) => pick(t.narration?.[i], p)),
        lines: chapter.lines.map((line, i) => ({ ...line, text: pick(t.lines?.[i], line.text) })),
        ...(chapter.fact
          ? { fact: { ...chapter.fact, text: pick(t.fact, chapter.fact.text) } }
          : {}),
      };
    }),
    quiz: stop.quiz.map((question, qi) => localizeQuestion(question, fil.quiz?.[qi])),
  };
}

type FilQuestion = NonNullable<FilStop['quiz']>[number];

const choices = <C extends { text: string }>(list: C[], fil: string[] | undefined): C[] =>
  list.map((choice, i) => ({ ...choice, text: pick(fil?.[i], choice.text) }));

function localizeQuestion(question: Question, fil: FilQuestion | undefined): Question {
  if (!fil) return question;
  const common = {
    prompt: pick(fil.prompt, question.prompt),
    explain: pick(fil.explain, question.explain),
    hint: pick(fil.hint, question.hint),
  };
  switch (question.type) {
    case 'mcq':
    case 'multi':
      return { ...question, ...common, options: choices(question.options, fil.options) };
    case 'order':
      return { ...question, ...common, items: choices(question.items, fil.items) };
    case 'match':
      return {
        ...question,
        ...common,
        left: choices(question.left, fil.left),
        right: choices(question.right, fil.right),
      };
    case 'error':
      return {
        ...question,
        ...common,
        segments: choices(question.segments, fil.segments),
        correction: pick(fil.correction, question.correction),
      };
  }
}

/** Rizal's guide lines in Filipino (§3.7); moods, targets and routes stay. */
export function localizeGuide(guide: Guide, fil: FilGuide | undefined): Guide {
  if (!fil) return guide;
  const reactions = { ...guide.reactions };
  for (const kind of Object.keys(reactions) as (keyof Guide['reactions'])[]) {
    reactions[kind] = guide.reactions[kind].map((line, i) => ({
      ...line,
      text: pick(fil.reactions?.[kind]?.[i], line.text),
    }));
  }
  return {
    ...guide,
    tour: guide.tour.map((step) => ({ ...step, text: pick(fil.tour?.[step.id], step.text) })),
    tips: Object.fromEntries(
      Object.entries(guide.tips).map(([id, tip]) => [
        id,
        { ...tip, text: pick(fil.tips?.[id], tip.text) },
      ]),
    ),
    reactions,
  };
}

/** Achievement titles and descriptions and rank meanings in Filipino (§3.8). */
export function localizeGamification(
  gamification: Gamification,
  fil: FilGamification | undefined,
): Gamification {
  if (!fil) return gamification;
  return {
    ...gamification,
    ranks: gamification.ranks.map((rank) => ({
      ...rank,
      meaning: pick(fil.ranks?.[rank.id], rank.meaning),
    })),
    achievements: gamification.achievements.map((a) => ({
      ...a,
      title: pick(fil.achievements?.[a.id]?.title, a.title),
      desc: pick(fil.achievements?.[a.id]?.desc, a.desc),
    })),
  };
}
