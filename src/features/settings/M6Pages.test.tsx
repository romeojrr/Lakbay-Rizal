import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createRoutes, routerFuture, type RootLoader } from '../../app/routes';
import { initialProgress, useProgress } from '../../store/progress';
import { useUi } from '../../store/ui';
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

  it('switches journey mode; the team-only verify notes option is gone', async () => {
    const user = userEvent.setup();
    renderAt('/settings');
    await user.click(await screen.findByRole('button', { name: 'Free explore' }));
    expect(useProgress.getState().mode).toBe('free');
    expect(screen.queryByRole('checkbox', { name: 'Show verify notes (team)' })).toBeNull();
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
    expect(useProgress.getState().xp).toBe(0);
    expect(screen.getByRole('status')).toHaveTextContent('Progress was reset');
  });
});

describe('Credits (FR-72)', () => {
  it('lists art, fonts, map data and every source in content', async () => {
    renderAt('/credits');
    expect(await screen.findByRole('heading', { level: 1, name: 'Credits' })).toBeVisible();
    expect(screen.getByText('Original pixel art by the RIZLIFE team.')).toBeVisible();
    expect(
      screen.getByText(
        'VT323 by Peter Hull and Nunito by Vernon Adams, both under the SIL Open Font License.',
      ),
    ).toBeVisible();
    expect(screen.getByText(/global-land-mask.*GLOBE 1-km/)).toBeVisible();
    const sources = screen.getByRole('region', { name: 'Sources' });
    expect(within(sources).getAllByRole('listitem')).toHaveLength(content.sources.length);
  });
});

describe("Rizal's tour (FR-4, FR-84, SRS v2.3 §3.7)", () => {
  const fresh = () => {
    useProgress.setState({ ...initialProgress() });
    useUi.setState({ tour: { active: false, step: 0 }, tourOffered: false });
  };

  it('runs on a fresh profile; Next moves on; Skip (or Esc) ends it for good', async () => {
    const user = userEvent.setup();
    fresh();
    renderAt('/region/philippines');
    const card = await screen.findByRole('dialog', { name: 'Tour with José Rizal' });
    expect(within(card).getByText('Step 1 of 14')).toBeVisible();
    expect(card).toHaveAccessibleDescription(/^Good day! I am José Rizal/);
    await user.click(within(card).getByRole('button', { name: 'Next' }));
    // The card waits (hidden) while the next step's target is looked for, then shows.
    await waitFor(() => expect(screen.getByText('Step 2 of 14')).toBeVisible(), { timeout: 3000 });
    await user.click(screen.getByRole('button', { name: 'Skip tour' }));
    expect(screen.queryByRole('dialog', { name: 'Tour with José Rizal' })).toBeNull();
    expect(useProgress.getState().tourDone).toBe(true);
  });

  it('Esc skips it', async () => {
    const user = userEvent.setup();
    fresh();
    renderAt('/region/philippines');
    await screen.findByRole('dialog', { name: 'Tour with José Rizal' });
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Tour with José Rizal' })).toBeNull();
    expect(useProgress.getState().tourDone).toBe(true);
  });

  it('does not run once done, or for players who saw the v2.2 intro', async () => {
    renderAt('/region/philippines');
    await screen.findByRole('heading', { level: 1, name: 'Philippines' });
    expect(screen.queryByRole('dialog', { name: 'Tour with José Rizal' })).toBeNull();
  });

  it('Settings → Replay the tour starts it again on the map', async () => {
    const user = userEvent.setup();
    useProgress.setState({ tourDone: true });
    useUi.setState({ tourOffered: true });
    const router = renderAt('/settings');
    await user.click(await screen.findByRole('button', { name: 'Replay the tour' }));
    expect(await screen.findByRole('dialog', { name: 'Tour with José Rizal' })).toBeVisible();
    expect(router.state.location.pathname).toMatch(/^\/region\//);
  });

  it('a one-time tip the first time Settings opens', async () => {
    useProgress.setState({ tourDone: true });
    renderAt('/settings');
    expect(
      await screen.findByText(/^Here you can change the text size and language/),
    ).toBeVisible();
    expect(useProgress.getState().seenTips).toEqual(['settings-first']);
  });
});
