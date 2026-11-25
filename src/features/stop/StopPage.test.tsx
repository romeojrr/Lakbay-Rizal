import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { createRoutes, routerFuture, type RootLoader } from '../../app/routes';
import { defaultCrop } from '../../components/Portrait/Portrait';
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

afterEach(() => {
  useProgress.setState(initialProgress());
  useUi.setState({ storyStep: {} });
});

/** Text appears at once with reduced motion, so these tests do not wait for typing. */
function freeAndStill() {
  useProgress.setState({
    mode: 'free',
    settings: { ...initialProgress().settings, reduceMotion: 'on' },
  });
}

const next = () => userEvent.click(screen.getByRole('button', { name: 'Next ▶' }));
const player = () => screen.getByRole('region', { name: 'Story' });
const step = () => useUi.getState().storyStep['calamba-1861'] ?? 0;

// calamba-1861 steps: chapter 1 = 0–4, chapter 2 = 5–9, chapter 3 = 10–17, chapter 4 = 18–22.
const CALAMBA_CHAPTER_3 = 10;

describe('Story player — Calamba (FR-80, SRS v2.3 §3.6)', () => {
  it('plays chapter by chapter: title card, narration, close-up line, fact', async () => {
    freeAndStill();
    renderAt('/stop/calamba-1861');
    expect(await screen.findByRole('heading', { level: 1, name: 'Calamba · 1861' })).toBeVisible();
    expect(within(player()).getByText('Chapter 1 of 4', { selector: 'p' })).toBeVisible();
    expect(screen.getByRole('heading', { level: 2, name: 'A house by the lake' })).toBeVisible();

    await next();
    expect(
      within(player()).getByText(/^José Protasio Rizal Mercado y Alonso Realonda/, {
        selector: '.visually-hidden',
      }),
    ).toBeInTheDocument();
    await next();
    await next();
    // The line: Teodora's close-up (happy row), her name, the Dramatized tag, the "…" bubble.
    expect(screen.getByRole('img', { name: 'Portrait of Teodora Alonso, happy' })).toBeVisible();
    expect(within(player()).getByText('Teodora Alonso')).toBeVisible();
    const tag = screen.getByRole('button', { name: 'Dramatized' });
    expect(tag).toHaveAccessibleDescription('Based on real events. The exact words are imagined.');
    expect(screen.getByText('…')).toBeInTheDocument();

    await next();
    expect(screen.getByRole('heading', { level: 3, name: 'Did you know?' })).toBeVisible();
    expect(
      within(player()).getByText('Source: José Rizal: Life, Works and Writings'),
    ).toBeVisible();
    await next();
    expect(screen.getByRole('heading', { level: 2, name: 'Nights on the azotea' })).toBeVisible();
    expect(within(player()).getByText('Chapter 2 of 4', { selector: 'span' })).toBeInTheDocument();
  });

  it('chapter 3 zooms to Teodora, and her moth line is Recorded', async () => {
    freeAndStill();
    useUi.setState({ storyStep: { 'calamba-1861': CALAMBA_CHAPTER_3 } });
    renderAt('/stop/calamba-1861');
    expect(await screen.findByRole('heading', { level: 2, name: 'The young moth' })).toBeVisible();
    const camera = player().querySelector('[data-zoom]') as HTMLElement;
    expect(camera.dataset.zoom).toBe('1.6');
    expect(camera.style.transform).toMatch(/^translate\(-46\.8\d*%, -55\.6\d*%\) scale\(1\.6\)$/);

    await next();
    await next();
    await next();
    expect(screen.getByRole('img', { name: 'Portrait of Teodora Alonso, happy' })).toBeVisible();
    const recorded = screen.getByRole('button', { name: 'Recorded' });
    expect(recorded).toHaveAccessibleDescription(
      "Real words, from a published source. Source: Rizal's Own Story of His Life",
    );
    // Her anchor (60.5 %, 58 %) seen through the camera.
    const bubble = screen.getByText('…').parentElement as HTMLElement;
    expect(parseFloat(bubble.style.left)).toBeCloseTo(50, 1);
    expect(parseFloat(bubble.style.top)).toBeCloseTo(37.2, 1);

    await next();
    expect(screen.getByRole('img', { name: 'Portrait of José, surprised' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Dramatized' })).toBeVisible();
  });

  it('Back, and the keys: → / Space next, ← back, A auto-play', async () => {
    const user = userEvent.setup();
    freeAndStill();
    renderAt('/stop/calamba-1861');
    await screen.findByRole('heading', { level: 2, name: 'A house by the lake' });
    expect(screen.getByRole('button', { name: '◀ Back' })).toBeDisabled();

    await user.keyboard('{ArrowRight}');
    expect(step()).toBe(1);
    await user.keyboard(' ');
    expect(step()).toBe(2);
    await user.keyboard('{ArrowLeft}');
    expect(step()).toBe(1);
    await user.click(screen.getByRole('button', { name: '◀ Back' }));
    expect(screen.getByRole('heading', { level: 2, name: 'A house by the lake' })).toBeVisible();

    const autoplay = screen.getByRole('button', { name: 'Auto-play' });
    expect(autoplay).toHaveAttribute('aria-pressed', 'false');
    await user.keyboard('a');
    expect(autoplay).toHaveAttribute('aria-pressed', 'true');
    // Auto-play moves on 1.5 s after the step has finished.
    await waitFor(() => expect(step()).toBe(1), { timeout: 2500 });
    await user.keyboard('A');
    expect(autoplay).toHaveAttribute('aria-pressed', 'false');
  });

  it('Skip to the end: the stop counts as visited and the quiz opens', async () => {
    const user = userEvent.setup();
    freeAndStill();
    renderAt('/stop/calamba-1861');
    await screen.findByRole('heading', { level: 2, name: 'A house by the lake' });
    expect(screen.queryByRole('link', { name: 'Quiz ▶' })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Skip to the end' }));
    expect(useProgress.getState().visited).toEqual(['calamba-1861']);
    expect(useProgress.getState().readIn).toEqual({ 'calamba-1861': ['en'] });
    expect(screen.getByRole('link', { name: 'Take the quiz ▶' })).toHaveAttribute(
      'href',
      '/stop/calamba-1861/quiz',
    );
    expect(screen.getByRole('link', { name: 'Quiz ▶' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Skip to the end' })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Replay ↺' }));
    expect(screen.getByRole('heading', { level: 2, name: 'A house by the lake' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Quiz ▶' })).toBeVisible();
  });

  it('counts chapters read as the player passes them (§3.8)', async () => {
    freeAndStill();
    useUi.setState({ storyStep: { 'calamba-1861': 4 } }); // chapter 1's fact, its last step
    renderAt('/stop/calamba-1861');
    await screen.findByRole('heading', { level: 3, name: 'Did you know?' });
    await waitFor(() => expect(useProgress.getState().chaptersRead['calamba-1861']).toBe(1));
  });

  it('types the text: the first press shows it all, the second moves on', async () => {
    useProgress.setState({
      mode: 'free',
      settings: { ...initialProgress().settings, reduceMotion: 'off' },
    });
    useUi.setState({ storyStep: { 'calamba-1861': 1 } });
    renderAt('/stop/calamba-1861');
    const full = await screen.findByText(/^José Protasio Rizal Mercado y Alonso Realonda/, {
      selector: '.visually-hidden',
    });
    const typed = full.parentElement?.firstElementChild as HTMLElement;
    expect(typed.textContent?.length ?? 0).toBeLessThan(full.textContent?.length ?? 0);
    await next();
    expect(typed.textContent).toBe(full.textContent);
    expect(step()).toBe(1);
    await next();
    expect(step()).toBe(2);
  });
});

describe('Stop page — Berlin (M3)', () => {
  it('Info drawer: this stop, item reward and sources from content (FR-32, v2.3 §5.5)', async () => {
    const user = userEvent.setup();
    useProgress.setState({ mode: 'free' });
    renderAt('/stop/berlin-1887');
    await screen.findByRole('heading', { level: 1, name: 'Berlin · 1887' });

    // The cards live in the Info drawer, closed at first but present for the guide.
    expect(document.querySelector('[data-guide="sources-card"]')).not.toBeNull();
    expect(screen.queryByRole('heading', { name: 'Sources' })).toBeNull();
    const toggle = screen.getByRole('button', { name: 'Info', expanded: false });
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const drawer = screen.getByRole('region', { name: 'About this stop' });
    expect(drawer).toHaveFocus();

    expect(within(drawer).getByText('Berlin, Kingdom of Prussia (German Empire)')).toBeVisible();
    expect(within(drawer).getByText('Berlin, Germany')).toBeVisible();
    expect(within(drawer).getByText('Noli Me Tangere')).toBeVisible();

    const sources = within(drawer).getByRole('heading', { name: 'Sources' })
      .parentElement as HTMLElement;
    expect(within(sources).getAllByRole('listitem')).toHaveLength(2);
    expect(within(sources).getByText(/Rizal–Blumentritt Correspondence/)).toBeVisible();
    await user.click(within(sources).getByRole('button', { name: 'Show all 7 sources' }));
    expect(within(sources).getAllByRole('listitem')).toHaveLength(7);
    expect(within(sources).getByText('ch. VI, "The Period of Preparation"')).toBeVisible();

    // Esc closes the drawer and returns focus to the Info button.
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('region', { name: 'About this stop' })).toBeNull();
    expect(toggle).toHaveFocus();
  });

  it('Read more: the summary, then and today, the date and every source (FR-33, §3.6)', async () => {
    const user = userEvent.setup();
    useProgress.setState({ mode: 'free' });
    renderAt('/stop/berlin-1887');
    await user.click(await screen.findByRole('button', { name: 'Read more' }));

    const dialog = screen.getByRole('dialog', { name: 'The Noli is printed' });
    expect(dialog).toHaveAttribute('open');
    expect(within(dialog).getByText(/Rizal arrived in Berlin in late 1886/)).toBeInTheDocument();
    expect(within(dialog).getByText('Berlin, Germany')).toBeInTheDocument();
    expect(within(dialog).getByText('Nov 1886 – May 1887')).toBeInTheDocument();
    expect(within(dialog).getAllByRole('listitem')).toHaveLength(7);
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

  it('the final stop: quiet player, no quiz, and a quiet epilogue (GD-6)', async () => {
    const user = userEvent.setup();
    freeAndStill();
    renderAt('/stop/bagumbayan-1896');
    await screen.findByRole('heading', { level: 1, name: 'Bagumbayan · 1896' });
    expect(screen.queryByText('Quiz ▶')).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Epilogue' })).toBeNull();
    // No auto-play, and no close-ups: the narrator speaks.
    expect(screen.queryByRole('button', { name: 'Auto-play' })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Skip to the end' }));
    expect(screen.queryByRole('img', { name: /^Portrait of/ })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Take the quiz ▶' })).toBeNull();
    const epilogue = screen.getByRole('heading', { name: 'Epilogue' }).parentElement as HTMLElement;
    expect(epilogue).toBeVisible();
    expect(within(epilogue).getByRole('link', { name: 'Credits' })).toHaveAttribute(
      'href',
      '/credits',
    );
    expect(useProgress.getState().completed).toEqual(['bagumbayan-1896']);
  });
});

describe('defaultCrop (SRS §5.4)', () => {
  it('matches the mockup crop for a 34 × 78 sprite', () => {
    expect(defaultCrop(34, 78)).toEqual({ left: -12, top: -18, width: 102, height: 234 });
  });
});
