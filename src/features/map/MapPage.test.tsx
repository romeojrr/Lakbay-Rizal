import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { createRoutes, routerFuture, type RootLoader } from '../../app/routes';
import { sortByOrder } from '../../content/selectors';
import { initialProgress, useProgress } from '../../store/progress';
import { useUi } from '../../store/ui';
import { realContent, rootData } from '../../test/content';

const content = realContent();
const allStops: RootLoader = async () => rootData(content);

function renderAt(path: string, loader: RootLoader = allStops) {
  const router = createMemoryRouter(createRoutes(loader), {
    initialEntries: [path],
    future: routerFuture,
  });
  render(<RouterProvider router={router} future={{ v7_startTransition: true }} />);
  return router;
}

function complete(count: number) {
  const completed = sortByOrder(content.stops)
    .slice(0, count)
    .map((s) => s.id);
  useProgress.setState({ completed });
}

afterEach(() => {
  useProgress.setState(initialProgress());
  useUi.setState({ lastRegion: null, timelineYear: null });
});

describe('MapPage', () => {
  it('opens on the region of the next stop', async () => {
    const router = renderAt('/');
    expect(await screen.findByRole('heading', { level: 1, name: 'Philippines' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/region/philippines');
  });

  it('Guided: locked pins are buttons that explain why (FR-13, FR-18)', async () => {
    const user = userEvent.setup();
    renderAt('/region/europe');
    const pin = await screen.findByRole('button', { name: 'Locked stop, 1888' });
    await user.click(pin);
    expect(screen.getByRole('status')).toHaveTextContent('Finish the previous stop first.');
  });

  it('Free explore opens every pin as a link (GD-2)', async () => {
    const user = userEvent.setup();
    renderAt('/region/europe');
    await user.click(await screen.findByRole('button', { name: 'Free explore' }));
    expect(screen.getByRole('link', { name: 'Berlin, 1887, open' })).toHaveAttribute(
      'href',
      '/stop/berlin-1887',
    );
    expect(screen.queryByRole('button', { name: /^Locked stop/ })).toBeNull();
  });

  it('shows done, current and locked pins for seeded progress (FR-12)', async () => {
    complete(5); // up to Barcelona
    renderAt('/region/europe');
    expect(await screen.findByRole('link', { name: 'Barcelona, 1882, completed' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Madrid, 1882, current stop' })).toBeVisible();
    expect(screen.getAllByRole('button', { name: /^Locked stop/ }).length).toBeGreaterThan(0);
  });

  it('side panel: next stop card and journey list (FR-17)', async () => {
    complete(10); // next stop: Berlin
    renderAt('/region/europe');
    expect(await screen.findByRole('heading', { name: 'Berlin · 1887' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Enter Berlin ▶' })).toHaveAttribute(
      'href',
      '/stop/berlin-1887',
    );
    const journey = screen.getByRole('heading', { name: 'Journey' }).parentElement as HTMLElement;
    expect(within(journey).getAllByRole('listitem')).toHaveLength(13);
  });

  it('Philippines: one cluster pin opens the Manila inset that lists its stops (FR-15)', async () => {
    const user = userEvent.setup();
    renderAt('/region/philippines');
    const cluster = await screen.findByRole('button', {
      name: '8 Manila area stops, show the close-up map',
    });
    await user.click(cluster);
    const inset = screen.getByRole('heading', { name: 'Manila area' }).closest('[tabindex="-1"]');
    expect(inset).toHaveFocus();
    expect(within(inset as HTMLElement).getAllByRole('listitem')).toHaveLength(8);
  });

  it('timeline to 1892 switches to the Philippines and highlights Dapitan (FR-21)', async () => {
    const user = userEvent.setup();
    useProgress.setState({ mode: 'free' });
    const router = renderAt('/region/europe');
    const slider = await screen.findByRole('slider', { name: 'Year' });
    slider.focus();
    await user.keyboard('{End}');
    for (let i = 0; i < 4; i++) await user.keyboard('{ArrowLeft}');
    expect(router.state.location.pathname).toBe('/region/philippines');
    const dapitan = await screen.findByRole('link', { name: 'Dapitan, 1892, open' });
    expect(dapitan.className).toMatch(/highlighted/);
    expect(screen.getByRole('slider', { name: 'Year' })).toHaveAttribute('aria-valuenow', '1892');
  });

  it('shows "Content coming soon" when no stops may be shown (FR-62)', async () => {
    renderAt('/region/europe', async () => rootData(content, []));
    expect(await screen.findByRole('heading', { name: 'Content coming soon' })).toBeVisible();
    expect(screen.queryByRole('link', { name: /Enter/ })).toBeNull();
  });

  it('explains an unknown region', async () => {
    renderAt('/region/atlantis');
    expect(
      await screen.findByRole('heading', { name: 'That place is not on the map' }),
    ).toBeVisible();
  });
});
