import { describe, expect, it } from 'vitest';
import { cameraView, onScreen } from '../../components/SceneView/camera';
import { realStories } from '../../test/content';
import { buildSteps, chaptersReadAt, stepText, types } from './steps';

const calamba = realStories().find((s) => s.id === 'calamba-1861');
if (!calamba) throw new Error('calamba-1861');

describe('buildSteps (SRS v2.3 §3.6)', () => {
  const steps = buildSteps(calamba.chapters);

  it('title card → paragraphs → lines → fact, chapter by chapter', () => {
    expect(steps.slice(0, 6)).toEqual([
      { kind: 'title', chapter: 0 },
      { kind: 'narration', chapter: 0, paragraph: 0 },
      { kind: 'narration', chapter: 0, paragraph: 1 },
      { kind: 'line', chapter: 0, line: 0 },
      { kind: 'fact', chapter: 0 },
      { kind: 'title', chapter: 1 },
    ]);
    // Chapter 4 has no fact: it ends on its last line.
    expect(steps.at(-1)).toEqual({ kind: 'line', chapter: 3, line: 1 });
    expect(steps).toHaveLength(23);
  });

  it('every stop has a story of 20 to 25 steps', () => {
    for (const story of realStories()) {
      const count = buildSteps(story.chapters).length;
      expect(count, story.id).toBeGreaterThanOrEqual(20);
      expect(count, story.id).toBeLessThanOrEqual(25);
    }
  });

  it('gives each step its text; only narration and lines type out', () => {
    const [title, , , line] = steps;
    if (!title || !line) throw new Error('steps');
    expect(stepText(calamba, title)).toBe('A house by the lake');
    expect(stepText(calamba, line)).toMatch(/^José, come and look/);
    expect(types(steps[0])).toBe(false);
    expect(types(steps[1])).toBe(true);
    expect(types(steps[3])).toBe(true);
    expect(types(steps[4])).toBe(false);
  });

  it('counts a chapter as read on its last step', () => {
    expect(chaptersReadAt(steps, 0)).toBe(0);
    expect(chaptersReadAt(steps, 3)).toBe(0);
    expect(chaptersReadAt(steps, 4)).toBe(1);
    expect(chaptersReadAt(steps, steps.length - 1)).toBe(4);
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
