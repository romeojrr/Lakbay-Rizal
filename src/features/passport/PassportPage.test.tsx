import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createRoutes, routerFuture, type RootLoader } from '../../app/routes';
import { getThemeTotals } from '../../content/selectors';
import { initialProgress, useProgress } from '../../store/progress';
import { realContent, rootData } from '../../test/content';

const content = realContent();
const loader: RootLoader = async () => rootData(content);
const stop = (id: string) => {
  const s = content.stops.find((x) => x.id === id);
  if (!s) throw new Error(id);
  return s;
};

function renderAt(path: string) {
  const router = createMemoryRouter(createRoutes(loader), {
    initialEntries: [path],
    future: routerFuture,
  });
  render(<RouterProvider router={router} future={{ v7_startTransition: true }} />);
}

beforeEach(() => {
  localStorage.clear();
  useProgress.setState(initialProgress());
});

afterEach(() => {
  useProgress.setState(initialProgress());
});

describe('Passport (FR-50 to FR-52)', () => {
  it('shows the traveller page from content', async () => {
    renderAt('/passport');
    expect(await screen.findByRole('heading', { level: 1, name: 'Passport' })).toBeVisible();
    expect(screen.getByRole('img', { name: 'Pixel portrait of José Rizal' })).toBeVisible();
    expect(screen.getByText('1861 · Calamba')).toBeVisible();
    expect(screen.getByText('0 of 25')).toBeVisible();
    expect(screen.getByRole('progressbar', { name: 'Stamps' })).toHaveAttribute(
      'aria-valuenow',
      '0',
    );
  });

  it('shows earned stamps with "New!" on the newest, and "?" for the rest', async () => {
    useProgress.getState().complete(stop('berlin-1887'));
    renderAt('/passport');
    await screen.findByRole('heading', { name: 'Stamps', level: 2 });
    const grid = screen.getByRole('tabpanel', { name: 'Stamps' });
    const cards = within(grid).getAllByRole('listitem');
    expect(cards).toHaveLength(25);
    const berlin = cards[10] as HTMLElement;
    expect(within(berlin).getByText('Berlin')).toBeVisible();
    expect(within(berlin).getByText('New!')).toBeVisible();
    expect(within(cards[0] as HTMLElement).getByText('?')).toBeVisible();
    expect(screen.getByText('1 of 25')).toBeVisible();
  });

  it('opening the passport clears "New!" for next time (SRS §12 step 7)', async () => {
    useProgress.getState().complete(stop('berlin-1887'));
    renderAt('/passport');
    await screen.findByText('New!');
    expect(useProgress.getState().newStamp).toBeUndefined();
  });

  it('theme badges count from content and light up when complete (FR-52)', async () => {
    const totals = getThemeTotals(content.stops);
    useProgress.getState().complete(stop('dapitan-1892')); // the only Exile stop
    renderAt('/passport');
    const badges = (await screen.findByRole('heading', { name: 'Theme badges' }))
      .nextElementSibling as HTMLElement;
    expect(within(badges).getByText(`0/${totals.study}`)).toBeVisible();
    expect(within(badges).getByText(`1/${totals.exile}`)).toBeVisible();
    expect(within(badges).getByText(', complete')).toBeInTheDocument();
  });

  it('the final stop is a plain page with no "New!" (GD-6)', async () => {
    useProgress.getState().complete(stop('bagumbayan-1896'), { quiet: true });
    renderAt('/passport');
    expect(await screen.findByText('Bagumbayan')).toBeVisible();
    expect(screen.queryByText('New!')).toBeNull();
  });
});

describe('Journal (FR-53)', () => {
  it('lists collected items with their description', async () => {
    useProgress.getState().complete(stop('berlin-1887'));
    renderAt('/journal');
    expect(await screen.findByRole('heading', { name: 'Journal' })).toBeVisible();
    expect(screen.getByText('Noli Me Tangere')).toBeVisible();
    expect(screen.getByText(content.items['noli-me-tangere']?.desc ?? '-')).toBeVisible();
    expect(screen.getByText(/1 of 24 keepsakes/)).toBeVisible();
  });

  it('says when there is nothing yet', async () => {
    renderAt('/journal');
    expect(await screen.findByText(/No keepsakes yet/)).toBeVisible();
  });
});

describe('Passport tabs: Stamps · Achievements · Rank (FR-83, SRS v2.3 §3.8)', () => {
  it('seeded progress: 400 XP shows Bachiller; a perfect stop shows Sobresaliente', async () => {
    const user = userEvent.setup();
    useProgress.setState({
      xp: 400,
      completed: ['calamba-1861'],
      stamps: ['calamba-1861'],
      stampGrade: { 'calamba-1861': 'gold' },
      perfectStops: ['calamba-1861'],
      achievements: ['first-steps', 'sobresaliente'],
    });
    renderAt('/passport');
    await screen.findByRole('heading', { level: 1, name: 'Passport' });

    // The top bar shows the rank and XP.
    const header = screen.getByRole('banner');
    expect(within(header).getByText('Bachiller')).toBeVisible();
    expect(within(header).getByText('400 XP')).toBeVisible();

    // Stamps tab: the stamp has its gold ribbon.
    const tabs = screen.getByRole('tablist', { name: 'Passport sections' });
    expect(within(tabs).getByRole('tab', { name: 'Stamps' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByText('Gold')).toBeVisible();

    // Achievements tab, reached with the arrow key.
    within(tabs).getByRole('tab', { name: 'Stamps' }).focus();
    await user.keyboard('{ArrowRight}');
    const achievements = screen.getByRole('tabpanel', { name: 'Achievements' });
    expect(within(achievements).getByText('2 of 14 achievements')).toBeVisible();
    expect(within(achievements).getByText('Sobresaliente')).toBeVisible();
    expect(within(achievements).getAllByText(/Not unlocked yet/)).toHaveLength(12);

    // Rank tab.
    await user.click(within(tabs).getByRole('tab', { name: 'Rank' }));
    const rank = screen.getByRole('tabpanel', { name: 'Rank' });
    expect(within(rank).getByText('Bachiller', { selector: 'p' })).toBeVisible();
    expect(within(rank).getByText('600 XP to Manlalakbay')).toBeVisible();
  });
});
