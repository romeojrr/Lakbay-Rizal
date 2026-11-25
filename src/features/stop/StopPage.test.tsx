import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { createRoutes, routerFuture, type RootLoader } from '../../app/routes';
import { defaultCrop } from '../../components/Portrait/Portrait';
import { initialProgress, useProgress } from '../../store/progress';
import { realContent } from '../../test/content';

const content = realContent();
const loader: RootLoader = async () => ({ content, stops: content.stops });

function renderAt(path: string) {
  const router = createMemoryRouter(createRoutes(loader), {
    initialEntries: [path],
    future: routerFuture,
  });
  render(<RouterProvider router={router} future={{ v7_startTransition: true }} />);
  return router;
}

function speaker() {
  const dialogue = screen.getByRole('region', { name: 'Dialogue' });
  return dialogue.querySelector('span')?.textContent;
}

afterEach(() => {
  useProgress.setState(initialProgress());
});

describe('Stop page — Berlin plays end to end (M3)', () => {
  it('steps through the dialogue, then shows Replay and unlocks the quiz (FR-31)', async () => {
    const user = userEvent.setup();
    useProgress.setState({ mode: 'free' });
    renderAt('/stop/berlin-1887');

    expect(await screen.findByRole('heading', { level: 1, name: 'Berlin · 1887' })).toBeVisible();
    expect(screen.getByRole('img', { name: /Berlin print works/ })).toBeVisible();
    expect(speaker()).toBe('Maximo Viola');
    expect(screen.getByText(/no money left to print your novel/)).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Quiz ▶' })).toBeNull();
    expect(screen.getByText('Line 1 of 3')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next ▶' }));
    expect(speaker()).toBe('José Rizal');
    await user.click(screen.getByRole('button', { name: 'Next ▶' }));
    expect(speaker()).toBe('Narrator');
    expect(screen.getByText('Line 3 of 3')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'Quiz ▶' })).toHaveAttribute(
      'href',
      '/stop/berlin-1887/quiz',
    );
    expect(useProgress.getState().visited).toEqual(['berlin-1887']);

    await user.click(screen.getByRole('button', { name: 'Replay ↺' }));
    expect(speaker()).toBe('Maximo Viola');
    expect(screen.getByRole('link', { name: 'Quiz ▶' })).toBeVisible();
  });

  it('moves the "…" indicator to the speaker (FR-34)', async () => {
    const user = userEvent.setup();
    useProgress.setState({ mode: 'free' });
    renderAt('/stop/berlin-1887');
    await screen.findByRole('heading', { level: 1, name: 'Berlin · 1887' });

    expect(screen.getByText('…')).toHaveStyle({ left: '35.5%', top: '56%' }); // Viola
    await user.click(screen.getByRole('button', { name: 'Next ▶' }));
    expect(screen.getByText('…')).toHaveStyle({ left: '24.5%', top: '56%' }); // Rizal
    await user.click(screen.getByRole('button', { name: 'Next ▶' }));
    expect(screen.queryByText('…')).toBeNull(); // Narrator
  });

  it('shows the Dramatized tag with its explanation (FR-35)', async () => {
    useProgress.setState({ mode: 'free' });
    renderAt('/stop/berlin-1887');
    const tag = await screen.findByRole('button', { name: 'Dramatized' });
    expect(tag).toHaveAccessibleDescription('Based on real events. The exact words are imagined.');
  });

  it('has no Dramatized tag when nobody speaks', async () => {
    useProgress.setState({ mode: 'free' });
    renderAt('/stop/heidelberg-1886');
    await screen.findByRole('heading', { level: 1, name: 'Heidelberg · 1886' });
    expect(screen.queryByRole('button', { name: 'Dramatized' })).toBeNull();
  });

  it('side panel: this stop, item reward and sources from content (FR-32)', async () => {
    const user = userEvent.setup();
    useProgress.setState({ mode: 'free' });
    renderAt('/stop/berlin-1887');
    await screen.findByRole('heading', { level: 1, name: 'Berlin · 1887' });

    expect(screen.getByText('Berlin, Kingdom of Prussia (German Empire)')).toBeVisible();
    expect(screen.getByText('Berlin, Germany')).toBeVisible();
    expect(screen.getByText('Noli Me Tangere')).toBeVisible();

    const sources = screen.getByRole('heading', { name: 'Sources' }).parentElement as HTMLElement;
    expect(within(sources).getAllByRole('listitem')).toHaveLength(2);
    expect(within(sources).getByText(/Rizal–Blumentritt Correspondence/)).toBeVisible();
    await user.click(within(sources).getByRole('button', { name: 'Show all 7 sources' }));
    expect(within(sources).getAllByRole('listitem')).toHaveLength(7);
    expect(within(sources).getByText('ch. VI, "The Period of Preparation"')).toBeVisible();
  });

  it('Read more opens the story in a dialog and closes again (FR-33)', async () => {
    const user = userEvent.setup();
    useProgress.setState({ mode: 'free' });
    renderAt('/stop/berlin-1887');
    await user.click(await screen.findByRole('button', { name: 'Read more' }));

    const dialog = screen.getByRole('dialog', { name: 'The Noli is printed' });
    expect(dialog).toHaveAttribute('open');
    expect(within(dialog).getByText(/Rizal arrived in Berlin in late 1886/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Close' }));
    expect(dialog).not.toHaveAttribute('open');
  });
});

describe('Stop page — other states', () => {
  it('Guided: a locked stop cannot be opened by URL (FR-18)', async () => {
    renderAt('/stop/berlin-1887');
    expect(await screen.findByRole('heading', { name: 'This stop is still locked' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Go to your next stop: Calamba' })).toHaveAttribute(
      'href',
      '/stop/calamba-1861',
    );
  });

  it('an unknown stop shows a way back', async () => {
    renderAt('/stop/atlantis-1900');
    expect(
      await screen.findByRole('heading', { name: 'That stop is not on the map' }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: '◀ Back to map' })).toBeVisible();
  });

  it('the final stop has no quiz and ends with a quiet epilogue (GD-6)', async () => {
    const user = userEvent.setup();
    useProgress.setState({ mode: 'free' });
    renderAt('/stop/bagumbayan-1896');
    await screen.findByRole('heading', { level: 1, name: 'Bagumbayan · 1896' });
    expect(screen.queryByText('Quiz ▶')).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Epilogue' })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Next ▶' }));
    expect(screen.getByRole('heading', { name: 'Epilogue' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Credits' })).toHaveAttribute('href', '/credits');
  });
});

describe('defaultCrop (SRS §5.4)', () => {
  it('matches the mockup crop for a 34 × 78 sprite', () => {
    expect(defaultCrop(34, 78)).toEqual({ left: -12, top: -18, width: 102, height: 234 });
  });
});
