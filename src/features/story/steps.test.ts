import { describe, expect, it } from 'vitest';
import { cameraView, onScreen } from '../../components/SceneView/camera';
import { realContent } from '../../test/content';
import { buildSteps, chaptersReadAt, paragraphPages, PAGE_CHARS, stepText, types } from './steps';

const calamba = realContent().stops.find((s) => s.id === 'calamba-1861');
if (!calamba) throw new Error('calamba-1861');

describe('buildSteps (SRS v2.3 §3.6)', () => {
  const steps = buildSteps(calamba.chapters);

  it('title card → paragraphs (long ones as two pages) → lines → fact, chapter by chapter', () => {
    expect(steps.slice(0, 7)).toEqual([
      { kind: 'title', chapter: 0 },
      { kind: 'narration', chapter: 0, paragraph: 0, page: 0 },
      { kind: 'narration', chapter: 0, paragraph: 1, page: 0 },
      { kind: 'narration', chapter: 0, paragraph: 1, page: 1 },
      { kind: 'line', chapter: 0, line: 0 },
      { kind: 'fact', chapter: 0 },
      { kind: 'title', chapter: 1 },
    ]);
    // Chapter 4 has no fact: it ends on its last line.
    expect(steps.at(-1)).toEqual({ kind: 'line', chapter: 3, line: 1 });
    expect(steps).toHaveLength(29);
  });

  it('every stop has a story of 20 to 30 steps', () => {
    for (const story of realContent().stops) {
      const count = buildSteps(story.chapters).length;
      expect(count, story.id).toBeGreaterThanOrEqual(20);
      expect(count, story.id).toBeLessThanOrEqual(30);
    }
  });

  it('gives each step its text; only narration and lines type out', () => {
    const [title, , , , line] = steps;
    if (!title || !line) throw new Error('steps');
    expect(stepText(calamba, title)).toBe('A house by the lake');
    expect(stepText(calamba, line)).toMatch(/^José, come and look/);
    expect(types(steps[0])).toBe(false);
    expect(types(steps[1])).toBe(true);
    expect(types(steps[4])).toBe(true);
    expect(types(steps[5])).toBe(false);
  });

  it('counts a chapter as read on its last step', () => {
    expect(chaptersReadAt(steps, 0)).toBe(0);
    expect(chaptersReadAt(steps, 4)).toBe(0);
    expect(chaptersReadAt(steps, 5)).toBe(1);
    expect(chaptersReadAt(steps, steps.length - 1)).toBe(4);
  });
});

describe('paragraphPages: long narration as pages', () => {
  const paragraphs = realContent().stops.flatMap((s) => s.chapters.flatMap((c) => c.narration));

  it('keeps every word, in order: the pages joined give the paragraph back', () => {
    for (const text of paragraphs) {
      expect(paragraphPages(text).join(' ')).toBe(text.replace(/\s+/g, ' ').trim());
    }
  });

  it('leaves short paragraphs whole and splits long ones between sentences', () => {
    const short = paragraphs.find((p) => p.length <= PAGE_CHARS) ?? '';
    expect(paragraphPages(short)).toEqual([short]);
    for (const text of paragraphs.filter((p) => p.length > PAGE_CHARS)) {
      const pages = paragraphPages(text);
      expect(pages.length, text.slice(0, 40)).toBeGreaterThan(1);
      for (const page of pages.slice(0, -1)) expect(page).toMatch(/[.!?]["'\u201d\u2019)]*$/u);
    }
  });

  it('pages are about the same length and rarely over the limit', () => {
    const pages = paragraphs.flatMap((p) => paragraphPages(p));
    const over = pages.filter((p) => p.length > PAGE_CHARS + 60);
    expect(over.length).toBeLessThanOrEqual(2);
  });

  it('does not break after abbreviations or initials', () => {
    const text =
      'He met Dr. A. B. Meyer in Dresden, who showed him the museum and its rooms of birds. ' +
      'The printer was F. Meyer-Van Loo of Ghent, at No. 5 on a small street near the river. ' +
      'Mr. Basa sent money from Hong Kong, and the book came out in the autumn of that year.';
    const pages = paragraphPages(text, 120);
    expect(pages.every((p) => !/(Dr|Mr|No|[A-Z])\.$/.test(p))).toBe(true);
    expect(pages.join(' ')).toBe(text);
  });
});

describe('camera (SRS v2.3 §3.6)', () => {
  it('zoom 1 shows the whole scene', () => {
    expect(cameraView({ x: 50, y: 50, zoom: 1 })).toEqual({ tx: 0, ty: 0, zoom: 1 });
    expect(cameraView(undefined)).toEqual({ tx: 0, ty: 0, zoom: 1 });
  });

  it('centres the point, but never past the scene edges', () => {
    const view = cameraView({ x: 60.5, y: 66, zoom: 1.6 });
    expect(view.tx).toBeCloseTo(-46.8);
    expect(view.ty).toBeCloseTo(-55.6);
    // A corner: the view stops at the edge.
    expect(cameraView({ x: 100, y: 0, zoom: 1.5 })).toEqual({ tx: -50, ty: 0, zoom: 1.5 });
    // Zoom stays within 1–1.6.
    expect(cameraView({ x: 50, y: 50, zoom: 3 }).zoom).toBe(1.6);
  });

  it('frames the point higher when the text box covers the bottom', () => {
    expect(cameraView({ x: 60.5, y: 66, zoom: 1.6 }, 35).ty).toBe(-60);
    expect(cameraView({ x: 50, y: 30, zoom: 1.4 }, 35).ty).toBeCloseTo(-7);
  });

  it('maps a scene point to the screen', () => {
    const view = cameraView({ x: 60.5, y: 66, zoom: 1.6 });
    const point = onScreen(view, { x: 60.5, y: 58 });
    expect(point.x).toBeCloseTo(50);
    expect(point.y).toBeCloseTo(37.2);
  });
});
