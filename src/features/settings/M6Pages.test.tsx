import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createRoutes, routerFuture, type RootLoader } from '../../app/routes';
import { initialProgress, useProgress } from '../../store/progress';
import { realContent, rootData } from '../../test/content';

const content = realContent();
const loader: RootLoader = async () => rootData(content);

function renderAt(path: string) {
  const router = createMemoryRouter(createRoutes(loader), {
    initialEntries: [path],
    future: routerFuture,
  });
  render(<RouterProvider router={router} future={{ v7_startTransition: true }} />);
  return router;
}

const stop = (id: string) => {
  const s = content.stops.find((x) => x.id === id);
  if (!s) throw new Error(id);
  return s;
};

beforeEach(() => {
  localStorage.clear();
  useProgress.setState({ ...initialProgress(), seenIntro: true });
});

afterEach(() => {
  useProgress.setState(initialProgress());
  delete document.documentElement.dataset.textSize;
  delete document.documentElement.dataset.motion;
});

describe('Scene gallery (FR-55)', () => {
  it('Guided: shows only unlocked scenes', async () => {
    useProgress.getState().complete(stop('calamba-1861'));
    renderAt('/scenes');
    const list = await screen.findByRole('navigation', { name: 'Choose a scene' });
    expect(
      within(list)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual([expect.stringContaining('1 · Calamba'), expect.stringContaining('2 · Biñan')]);
  });

  it('Free: shows every scene, with place, year, time, alt text and verify notes', async () => {
    const user = userEvent.setup();
    useProgress.setState({ mode: 'free' });
    renderAt('/scenes');
    const list = await screen.findByRole('navigation', { name: 'Choose a scene' });
    expect(within(list).getAllByRole('button')).toHaveLength(25);

    await user.click(within(list).getByRole('button', { name: /11 · Berlin/ }));
    const scene = screen.getByRole('region', { name: 'Scene' });
    expect(within(scene).getByText('11 · Berlin · 1887')).toBeVisible();
    expect(within(scene).getByText('Winter daylight')).toBeVisible();
    expect(within(scene).getByRole('heading', { name: 'The Noli is printed' })).toBeVisible();
    // No "what you see" notes in the seed yet: shown as [TO WRITE].
    expect(within(scene).getByText('[TO WRITE]')).toBeVisible();
    // Verify notes show in development (and in production only with the setting on).
    expect(within(scene).getByText('Arrival month in Berlin and when Viola arrived')).toBeVisible();
    expect(within(list).getByRole('button', { name: /11 · Berlin/ })).toHaveAttribute(
      'aria-current',
      'true',
    );
  });
});

describe('Settings (FR-71)', () => {
  it('changes text size and motion on the page', async () => {
    const user = userEvent.setup();
    renderAt('/settings');
    await user.click(await screen.findByRole('radio', { name: 'Large' }));
    expect(useProgress.getState().settings.textSize).toBe('large');
    expect(document.documentElement.dataset.textSize).toBe('large');

    expect(screen.getByRole('radio', { name: 'Same as my device' })).toBeChecked();
    await user.click(screen.getByRole('radio', { name: 'On' }));
    expect(document.documentElement.dataset.motion).toBe('on');
  });

  it('switches journey mode and verify notes', async () => {
    const user = userEvent.setup();
    renderAt('/settings');
    await user.click(await screen.findByRole('button', { name: 'Free explore' }));
    expect(useProgress.getState().mode).toBe('free');
    await user.click(screen.getByRole('checkbox', { name: 'Show verify notes (team)' }));
    expect(useProgress.getState().settings.showVerifyNotes).toBe(true);
  });

  it('Reset progress asks first, then starts again', async () => {
    const user = userEvent.setup();
    useProgress.getState().complete(stop('berlin-1887'));
    renderAt('/settings');

    await user.click(await screen.findByRole('button', { name: 'Reset progress' }));
    const dialog = screen.getByRole('dialog', { name: 'Reset all progress?' });
    await user.click(within(dialog).getByRole('button', { name: 'Keep my progress' }));
    expect(useProgress.getState().stamps).toEqual(['berlin-1887']);

    await user.click(screen.getByRole('button', { name: 'Reset progress' }));
    await user.click(within(dialog).getByRole('button', { name: 'Yes, reset' }));
    expect(useProgress.getState().stamps).toEqual([]);
    expect(useProgress.getState().seenIntro).toBe(false);
    expect(screen.getByRole('status')).toHaveTextContent('Progress was reset');
  });
});

describe('Credits (FR-72)', () => {
  it('lists art, fonts, map data and every source in content', async () => {
    renderAt('/credits');
    expect(await screen.findByRole('heading', { level: 1, name: 'Credits' })).toBeVisible();
    expect(screen.getByText('Original pixel art by the RIZLIFE team.')).toBeVisible();
    expect(screen.getByText('VT323 by Peter Hull, under the SIL Open Font License.')).toBeVisible();
    expect(screen.getByText(/global-land-mask.*GLOBE 1-km/)).toBeVisible();
    const sources = screen.getByRole('region', { name: 'Sources' });
    expect(within(sources).getAllByRole('listitem')).toHaveLength(content.sources.length);
  });
});

describe('Intro cards (FR-4)', () => {
  it('shows three cards on a fresh profile; choosing a mode closes it for good', async () => {
    const user = userEvent.setup();
    useProgress.setState({ seenIntro: false });
    renderAt('/region/philippines');
    const dialog = await screen.findByRole('dialog', { name: 'Welcome to Lakbay Rizal' });
    expect(within(dialog).getByText('Card 1 of 3')).toBeVisible();
    await user.click(within(dialog).getByRole('button', { name: 'Next ▶' }));
    await user.click(within(dialog).getByRole('button', { name: 'Next ▶' }));
    expect(within(dialog).getByText('Card 3 of 3')).toBeVisible();
    await user.click(within(dialog).getByRole('button', { name: 'Explore freely' }));

    expect(useProgress.getState().seenIntro).toBe(true);
    expect(useProgress.getState().mode).toBe('free');
    expect(dialog).not.toHaveAttribute('open');
  });

  it('Skip closes it and keeps Guided', async () => {
    const user = userEvent.setup();
    useProgress.setState({ seenIntro: false });
    renderAt('/region/philippines');
    const dialog = await screen.findByRole('dialog', { name: 'Welcome to Lakbay Rizal' });
    await user.click(within(dialog).getByRole('button', { name: 'Skip' }));
    expect(useProgress.getState().seenIntro).toBe(true);
    expect(useProgress.getState().mode).toBe('guided');
  });

  it('is not shown once seen', async () => {
    renderAt('/region/philippines');
    await screen.findByRole('heading', { level: 1, name: 'Philippines' });
    expect(screen.queryByRole('dialog', { name: 'Welcome to Lakbay Rizal' })).toBeNull();
  });
});
