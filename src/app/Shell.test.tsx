import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { initialProgress, useProgress } from '../store/progress';
import { useUi } from '../store/ui';
import { realContent, rootData } from '../test/content';
import { createRoutes, routerFuture, type RootLoader } from './routes';

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

beforeEach(() => {
  localStorage.clear();
  useProgress.setState({ ...initialProgress(), seenIntro: true });
});

afterEach(() => {
  useProgress.setState(initialProgress());
  useUi.setState({ storyStep: {} });
});

// SRS v2.3 §3.7: ids the guided tour will look for.
const MAP_GUIDES = [
  'map',
  'region-tabs',
  'timeline',
  'mode-toggle',
  'pin-current',
  'xp-bar',
  'passport-button',
  'save-indicator',
];
const STOP_GUIDES = ['scene', 'line-tag', 'sources-card', 'quiz-button'];

describe('App shell v2.3 (§5.5)', () => {
  it('top bar: logo, XP placeholder, language switch and Passport', async () => {
    renderAt('/region/europe');
    const header = await screen.findByRole('banner');
    expect(within(header).getByRole('link', { name: 'LAKBAY RIZAL' })).toBeVisible();
    expect(within(header).getByText('0 XP')).toBeVisible();
    const language = within(header).getByRole('group', { name: 'Language' });
    expect(within(language).getByRole('button', { name: 'EN (English)' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(within(language).getByRole('button', { name: 'FIL (Filipino)' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(within(header).getByRole('link', { name: 'Passport · 0/25' })).toBeVisible();
  });

  it('bottom navigation: Map · Timeline · Passport · Journal · More', async () => {
    const user = userEvent.setup();
    renderAt('/region/europe');
    const nav = await screen.findByRole('navigation', { name: 'Main' });
    const items = within(nav)
      .getAllByRole('listitem')
      .map((li) => li.textContent);
    expect(items).toEqual(['Map', 'Timeline', 'Passport', 'Journal', 'More']);
    expect(within(nav).getByRole('link', { name: 'Map' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: 'Passport · 0/25' })).toHaveAttribute(
      'href',
      '/passport',
    );

    await user.click(within(nav).getByRole('button', { name: 'More' }));
    const more = screen.getByRole('dialog', { name: 'More' });
    expect(within(more).getByRole('link', { name: 'Settings' })).toHaveAttribute(
      'href',
      '/settings',
    );
    expect(within(more).getByRole('link', { name: 'Scenes' })).toHaveAttribute('href', '/scenes');
  });

  it('map screen: the map, the side panel beside it, the timeline across the bottom', async () => {
    renderAt('/region/europe');
    const panel = await screen.findByRole('complementary', { name: 'Stops in this region' });
    expect(within(panel).getByRole('group', { name: 'Journey mode' })).toBeVisible();
    expect(within(panel).getByRole('heading', { name: 'Journey' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Hide panel' })).toBeNull();
  });

  it('the timeline shows the era labels, and can be made smaller', async () => {
    const user = userEvent.setup();
    renderAt('/region/europe');
    const less = await screen.findByRole('button', { name: 'Less', expanded: true });
    expect(screen.getByText('1882 · Europe')).toBeVisible();
    await user.click(less);
    expect(screen.getByText('1882 · Europe')).not.toBeVisible();
  });

  it('map screen has every guide target (§3.7)', async () => {
    renderAt('/region/philippines');
    await screen.findByRole('heading', { level: 1, name: 'Philippines' });
    for (const id of MAP_GUIDES) {
      expect(document.querySelector(`[data-guide="${id}"]`), id).not.toBeNull();
    }
  });

  it('stop screen has every guide target (§3.7)', async () => {
    useProgress.setState({ mode: 'free' });
    // line-tag is on spoken lines, so open the story at its first line (step 4).
    useUi.setState({ storyStep: { 'berlin-1887': 4 } });
    renderAt('/stop/berlin-1887');
    await screen.findByRole('heading', { level: 1, name: 'Berlin · 1887' });
    for (const id of STOP_GUIDES) {
      expect(document.querySelector(`[data-guide="${id}"]`), id).not.toBeNull();
    }
  });
});
