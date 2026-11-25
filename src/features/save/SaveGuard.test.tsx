// FR-85 / FR-87 / FR-88 (SRS v2.3 §3.9, §3.8): the leave warning only when something is
// unsaved; the Settings save code; the /timeline page; the certificate.
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createRoutes, routerFuture, type RootLoader } from '../../app/routes';
import { initialProgress, useProgress } from '../../store/progress';
import { useSaveStatus } from '../../store/saveStatus';
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

/** True if leaving now would make the browser ask "Leave site?". */
function leaveWarns(): boolean {
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}

beforeEach(() => {
  localStorage.clear();
  useProgress.setState({
    ...initialProgress(),
    seenIntro: true,
    mode: 'free',
    visited: ['calamba-1861'],
  });
});
afterEach(() => useProgress.setState(initialProgress()));

describe('leaving the page (§3.9)', () => {
  it('no warning on the map', async () => {
    renderAt('/region/philippines');
    await screen.findByRole('heading', { level: 1, name: 'Philippines' });
    expect(leaveWarns()).toBe(false);
  });

  it('warns mid-quiz', async () => {
    const user = userEvent.setup();
    renderAt('/stop/calamba-1861/quiz');
    await screen.findByRole('heading', { name: 'Calamba Quiz' });
    expect(leaveWarns()).toBe(false);
    // Question 1 is "order": checking it as shuffled (never already right) is an answer.
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByRole('heading', { name: 'Not quite' })).toBeVisible();
    expect(leaveWarns()).toBe(true);
  });
});

describe('save indicator (§3.9)', () => {
  it('shows "Not saved" with an explanation when a save fails', async () => {
    const user = userEvent.setup();
    renderAt('/region/philippines');
    await screen.findByRole('heading', { level: 1, name: 'Philippines' });
    useSaveStatus.getState().report(false);
    const button = await screen.findByRole('button', { name: 'Not saved' });
    await user.click(button);
    expect(screen.getByRole('dialog', { name: 'Your progress is not being saved' })).toBeVisible();
    useSaveStatus.setState({ state: 'idle', count: 0 });
  });
});

describe('Settings save code (§3.9)', () => {
  it('a bad code shows a friendly error and changes nothing', async () => {
    const user = userEvent.setup();
    renderAt('/settings');
    const box = await screen.findByLabelText('Paste a save code');
    await user.type(box, 'not a code');
    await user.click(screen.getByRole('button', { name: 'Load this code' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'does not look like a Lakbay Rizal save code',
    );
    expect(useProgress.getState().visited).toEqual(['calamba-1861']);
  });
});

describe('/timeline (FR-88)', () => {
  it('lists every stop in date order, filterable by theme and region', async () => {
    const user = userEvent.setup();
    useProgress.setState({ completed: ['calamba-1861'], stamps: ['calamba-1861'] });
    renderAt('/timeline');
    await screen.findByRole('heading', { level: 1, name: 'Timeline' });
    const main = screen.getByRole('main');
    const list = within(main).getAllByRole('listitem');
    expect(list).toHaveLength(25);
    expect(within(list[0] as HTMLElement).getByText('Completed')).toBeVisible();
    expect(within(list[0] as HTMLElement).getByRole('img', { name: 'Stamp earned' })).toBeVisible();
    await user.click(
      within(screen.getByRole('group', { name: 'Region' })).getByRole('button', { name: 'Asia' }),
    );
    expect(within(main).getAllByRole('listitem')).toHaveLength(2);
    await user.click(
      within(screen.getByRole('group', { name: 'Theme' })).getByRole('button', { name: 'Cause' }),
    );
    expect(screen.getByRole('status')).toHaveTextContent('Showing 1 of 25 stops');
  });
});

describe('certificate (FR-87)', () => {
  it('needs every quiz stop; then shows the name, rank, stamps and a Print button', async () => {
    renderAt('/certificate');
    expect(
      await screen.findByText('Complete all 24 quiz stops to earn the certificate.'),
    ).toBeVisible();
  });

  it('remembers the name, and warns on leaving while it is being typed', async () => {
    const user = userEvent.setup();
    const quizStops = content.stops.filter((s) => s.quiz.length > 0).map((s) => s.id);
    useProgress.setState({
      completed: quizStops,
      xp: 1900,
      stampGrade: { 'calamba-1861': 'gold' },
    });
    renderAt('/certificate');
    const name = await screen.findByLabelText(/Your name/);
    await user.type(name, 'Juana');
    expect(leaveWarns()).toBe(true);
    await user.keyboard('{Enter}');
    expect(useProgress.getState().certificateName).toBe('Juana');
    expect(leaveWarns()).toBe(false);
    const certificate = screen.getByRole('article', { name: 'Certificate of Journey' });
    expect(within(certificate).getByText('Juana')).toBeVisible();
    expect(within(certificate).getByText('Rank: Manunulat')).toBeVisible();
    expect(within(certificate).getByText('Stamps: 1 gold and 23 silver')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Print certificate' })).toBeVisible();
  });
});
