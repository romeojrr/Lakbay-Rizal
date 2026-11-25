import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRoutes, routerFuture, type RootLoader } from '../../app/routes';
import type { PlayableStop } from '../../content/schemas';
import { initialProgress, useProgress } from '../../store/progress';
import { answerRight, answerWrong, currentQuestion } from '../../test/answerQuiz';
import { realContent, rootData } from '../../test/content';

const content = realContent();
const loader: RootLoader = async () => rootData(content);
const stopById = (id: string) => content.stops.find((s) => s.id === id) as PlayableStop;
const calamba = stopById('calamba-1861'); // order, mcq, mcq, error, mcq

function renderAt(path: string) {
  const router = createMemoryRouter(createRoutes(loader), {
    initialEntries: [path],
    future: routerFuture,
  });
  render(<RouterProvider router={router} future={{ v7_startTransition: true }} />);
  return router;
}

/** Answers every question of the quiz on screen right, then opens the reward. */
async function playQuiz(user: ReturnType<typeof userEvent.setup>, stop: PlayableStop) {
  for (let i = 0; i < stop.quiz.length; i++) {
    await answerRight(user, currentQuestion(stop.quiz));
    expect(screen.getByRole('heading', { name: 'Correct!' })).toBeVisible();
    const last = i === stop.quiz.length - 1;
    await user.click(
      screen.getByRole('button', { name: last ? 'See your reward ▶' : 'Next question ▶' }),
    );
  }
}

beforeEach(() => {
  localStorage.clear();
  useProgress.setState({
    ...initialProgress(),
    mode: 'free',
    visited: content.stops.map((s) => s.id),
  });
});

afterEach(() => {
  useProgress.setState(initialProgress());
  vi.restoreAllMocks();
});

describe('Quiz v3 (FR-40 to FR-43, FR-81, FR-82)', { timeout: 20_000 }, () => {
  it('shows one question at a time, with a progress count and the type instruction', async () => {
    renderAt('/stop/calamba-1861/quiz');
    expect(await screen.findByRole('heading', { name: 'Calamba Quiz' })).toBeVisible();
    expect(screen.getByText('Question 1 of 5')).toBeVisible();
    // Question 1 is "order": numbered rows, never already in order, and a Check button.
    expect(screen.getByText('Drag to put these in order')).toBeVisible();
    const rows = within(screen.getByRole('list', { name: calamba.quiz[0]?.prompt })).getAllByRole(
      'button',
    );
    expect(rows).toHaveLength(4);
    const shown = rows.map((r) => r.textContent ?? '');
    const correct =
      calamba.quiz[0]?.type === 'order' ? calamba.quiz[0].items.map((i) => i.text) : [];
    expect(shown.map((text, i) => text.includes(correct[i] ?? '?'))).not.toEqual([
      true,
      true,
      true,
      true,
    ]);
    expect(screen.getByRole('button', { name: 'Check' })).toBeVisible();
  });

  it('a wrong answer: Not quite, a hint on request, then Try again with no penalty (GD-5)', async () => {
    const user = userEvent.setup();
    renderAt('/stop/calamba-1861/quiz');
    await screen.findByRole('heading', { name: 'Calamba Quiz' });
    await answerRight(user, currentQuestion(calamba.quiz));
    await user.click(screen.getByRole('button', { name: 'Next question ▶' }));

    await answerWrong(user, currentQuestion(calamba.quiz));
    expect(screen.getByRole('heading', { name: 'Not quite' })).toHaveFocus();
    expect(screen.getByRole('button', { name: /your answer, not correct/ })).toBeDisabled();
    // The right answer is not given away; the hint points back to the story.
    expect(screen.queryByRole('button', { name: /correct answer$/ })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Show hint' }));
    expect(screen.getByText(/^Hint: /)).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByText('Question 2 of 5')).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Not quite' })).toBeNull();
    await answerRight(user, currentQuestion(calamba.quiz));
    expect(screen.getByRole('heading', { name: 'Correct!' })).toBeVisible();
    // Right: why, and the source's short title.
    expect(screen.getByText(/^Why: /)).toBeVisible();
    expect(screen.getByText(/^Source: /)).toBeVisible();
    expect(useProgress.getState().completed).toEqual([]);
  });

  it('a whole quiz gives the stamp, item and materials once, with a gold grade (FR-43, §3.8)', async () => {
    const user = userEvent.setup();
    renderAt('/stop/calamba-1861/quiz');
    await screen.findByRole('heading', { name: 'Calamba Quiz' });
    await playQuiz(user, calamba);

    expect(screen.getByRole('heading', { name: 'Stop complete!' })).toHaveFocus();
    expect(screen.getByText('Gold stamp')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Open passport ▶' })).toHaveAttribute(
      'href',
      '/passport',
    );
    const s = useProgress.getState();
    expect(s.stamps).toEqual(['calamba-1861']);
    expect(s.items).toEqual(['moth-story']);
    expect(s.stampGrade).toEqual({ 'calamba-1861': 'gold' });
  });

  it('every question type can be answered (FR-81)', async () => {
    const user = userEvent.setup();
    const types = new Set<string>();
    // The fewest stops that between them have all five types.
    for (const id of ['calamba-1861', 'dapitan-1892', 'hongkong-1891']) {
      const stop = stopById(id);
      stop.quiz.forEach((q) => types.add(q.type));
      const view = renderAt(`/stop/${id}/quiz`);
      await screen.findByRole('heading', { name: `${stop.place.label} Quiz` });
      await playQuiz(user, stop);
      expect(screen.getByRole('heading', { name: 'Stop complete!' })).toBeVisible();
      view.dispose();
      cleanup();
    }
    expect(types).toEqual(new Set(['mcq', 'multi', 'order', 'match', 'error']));
  }, 30_000);

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
    renderAt('/stop/bagumbayan-1896/quiz');
    expect(
      await screen.findByRole('heading', { name: 'That stop is not on the map' }),
    ).toBeVisible();
  });
});
