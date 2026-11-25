import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRoutes, routerFuture, type RootLoader } from '../../app/routes';
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

const answers = () => screen.getByRole('group', { name: /\?$/ });
const option = (text: string) => within(answers()).getByRole('button', { name: new RegExp(text) });
const currentPrompt = () => answers().getAttribute('aria-labelledby');

/** Answers whichever Berlin question is showing (the order is shuffled). */
async function answerBerlin(user: ReturnType<typeof userEvent.setup>, correctly: boolean) {
  const prompt = document.getElementById(currentPrompt() ?? '')?.textContent ?? '';
  const lent = prompt.startsWith('Who lent');
  const right = lent ? 'Maximo Viola' : '^2,000';
  const wrong = lent ? 'Ferdinand Blumentritt' : '^20,000';
  await user.click(option(correctly ? right : wrong));
}

beforeEach(() => {
  localStorage.clear();
  useProgress.setState({ ...initialProgress(), mode: 'free', visited: ['berlin-1887'] });
});

afterEach(() => {
  useProgress.setState(initialProgress());
  vi.restoreAllMocks();
});

describe('Quiz (FR-40 to FR-44)', () => {
  it('shows one question at a time with four options and a progress count', async () => {
    renderAt('/stop/berlin-1887/quiz');
    expect(await screen.findByRole('heading', { name: 'Berlin Quiz' })).toBeVisible();
    expect(screen.getByText('Question 1 of 2')).toBeVisible();
    expect(within(answers()).getAllByRole('button')).toHaveLength(4);
    expect(screen.getByText('Pick an answer')).toBeVisible();
  });

  it('a wrong answer shows the hint, reveals the right one, and can be retried (GD-5)', async () => {
    const user = userEvent.setup();
    renderAt('/stop/berlin-1887/quiz');
    await screen.findByRole('heading', { name: 'Berlin Quiz' });
    await answerBerlin(user, false);

    expect(screen.getByRole('heading', { name: 'Not quite' })).toHaveFocus();
    expect(screen.getByText(/^Hint: /)).toBeVisible();
    expect(
      within(answers()).getByRole('button', { name: /your answer, not correct/ }),
    ).toBeVisible();
    expect(within(answers()).getByRole('button', { name: /correct answer$/ })).toBeVisible();
    expect(
      within(answers())
        .getAllByRole('button')
        .every((b) => b.hasAttribute('disabled')),
    ).toBe(true);

    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByText('Question 1 of 2')).toBeVisible();
    expect(
      within(answers())
        .getAllByRole('button')
        .some((b) => b.hasAttribute('disabled')),
    ).toBe(false);
    expect(useProgress.getState().completed).toEqual([]);
  });

  it('two right answers give the stamp, item and materials exactly once (FR-43)', async () => {
    const user = userEvent.setup();
    renderAt('/stop/berlin-1887/quiz');
    await screen.findByRole('heading', { name: 'Berlin Quiz' });

    await answerBerlin(user, true);
    expect(screen.getByRole('heading', { name: 'Correct!' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Next question ▶' }));
    expect(screen.getByText('Question 2 of 2')).toBeVisible();
    await answerBerlin(user, true);
    await user.click(screen.getByRole('button', { name: 'See your reward ▶' }));

    expect(screen.getByRole('heading', { name: 'Stop complete!' })).toHaveFocus();
    expect(screen.getByText('Berlin stamp and Noli Me Tangere are yours.')).toBeVisible();
    expect(screen.getByText(/\+2 Bamboo · \+2 Stone/)).toBeVisible();
    expect(screen.getByRole('link', { name: 'Open passport ▶' })).toHaveAttribute(
      'href',
      '/passport',
    );
    expect(screen.getByRole('link', { name: 'Back to map' })).toHaveAttribute(
      'href',
      '/region/europe',
    );

    const s = useProgress.getState();
    expect(s.stamps).toEqual(['berlin-1887']);
    expect(s.items).toEqual(['noli-me-tangere']);
    expect(s.newStamp).toBe('berlin-1887');
    expect(screen.getByRole('link', { name: /Passport · 1\/25/ })).toBeVisible();
  });

  it('asks to finish the story first', async () => {
    useProgress.setState({ visited: [] });
    renderAt('/stop/berlin-1887/quiz');
    expect(await screen.findByRole('heading', { name: 'Finish the story first' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Go to the story' })).toHaveAttribute(
      'href',
      '/stop/berlin-1887',
    );
  });

  it('the final stop has no quiz page (GD-6)', async () => {
    useProgress.setState({ visited: ['bagumbayan-1896'] });
    renderAt('/stop/bagumbayan-1896/quiz');
    expect(
      await screen.findByRole('heading', { name: 'That stop is not on the map' }),
    ).toBeVisible();
  });
});
