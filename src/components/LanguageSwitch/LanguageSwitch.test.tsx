// FR-86 (SRS v2.3 §3.10): switching language (in Settings) changes UI and content text
// without a reload; missing strings fall back to English. The Filipino files are reviewed, so
// no "Draft translation" badge shows (it does only while a file is a draft or cannot load).
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LanguageRoot from '../../app/LanguageRoot';
import { createRoutes, routerFuture, type RootLoader } from '../../app/routes';
import { clearTranslations } from '../../content/translations';
import { setActiveLanguage } from '../../i18n/t';
import { initialProgress, useProgress } from '../../store/progress';
import { rawContentV3, realContent, rootData } from '../../test/content';

const content = realContent();
const loader: RootLoader = async () => rootData(content);
const raw = rawContentV3() as unknown as Record<string, unknown>;

const fetchMock = vi.fn(async (url: string) => {
  const name = /content\/(.+)\.json$/.exec(url)?.[1] ?? '';
  return name in raw
    ? ({ ok: true, json: async () => raw[name] } as Response)
    : ({ ok: false, status: 404 } as Response);
});

function renderAt(path: string) {
  const router = createMemoryRouter(createRoutes(loader), {
    initialEntries: [path],
    future: routerFuture,
  });
  render(
    <LanguageRoot>
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </LanguageRoot>,
  );
  return router;
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  localStorage.clear();
  useProgress.setState({ ...initialProgress(), seenIntro: true });
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockClear();
  clearTranslations();
  setActiveLanguage('en');
  useProgress.setState(initialProgress());
});

describe('language switch (FR-86)', () => {
  it('switches the UI and the content to Filipino and back, without a reload', async () => {
    const user = userEvent.setup();
    const router = renderAt('/settings');
    const header = await screen.findByRole('banner');
    expect(within(header).getByRole('link', { name: 'Scenes' })).toBeVisible();

    await user.click(await screen.findByRole('radio', { name: 'Filipino' }));

    // UI strings and content (region tabs come from regions.json) are now Filipino.
    const filHeader = await screen.findByRole('banner');
    expect(await within(filHeader).findByRole('link', { name: 'Mga Tagpo' })).toBeVisible();
    expect(within(filHeader).getByRole('link', { name: /Pilipinas/ })).toBeVisible();
    expect(document.documentElement.lang).toBe('fil');
    expect(useProgress.getState().settings.lang).toBe('fil');
    expect(router.state.location.pathname).toBe('/settings');
    await waitFor(() => expect(screen.getByRole('radio', { name: 'Filipino' })).toHaveFocus());
    // Reviewed translation: no badge.
    expect(screen.queryByRole('button', { name: 'Draft translation' })).not.toBeInTheDocument();

    const [english] = screen.getAllByRole('radio');
    if (!english) throw new Error('radio');
    await user.click(english);
    const enHeader = await screen.findByRole('banner');
    expect(await within(enHeader).findByRole('link', { name: 'Scenes' })).toBeVisible();
    expect(document.documentElement.lang).toBe('en');
  });

  it('falls back to English for strings Filipino does not have yet', async () => {
    const user = userEvent.setup();
    renderAt('/settings');
    await user.click(await screen.findByRole('radio', { name: 'Filipino' }));
    // "Settings" has a Filipino string; the motion option "Same as my device" does not (yet).
    expect(await screen.findByRole('heading', { level: 1, name: 'Settings' })).toBeVisible();
    const main = screen.getByRole('main');
    expect(within(main).getByRole('group', { name: 'Wika' })).toBeVisible();
    expect(screen.getByRole('radio', { name: 'Same as my device' })).toBeVisible();
    expect(screen.getByRole('radio', { name: 'Filipino' })).toBeChecked();
    await waitFor(() => expect(screen.getByRole('radio', { name: 'Filipino' })).toHaveFocus());
  });

  it('a saved Filipino choice shows Filipino from the start', async () => {
    useProgress.setState({
      ...initialProgress(),
      seenIntro: true,
      settings: { ...initialProgress().settings, lang: 'fil' },
    });
    // The real root loader fetches the Filipino files before the first paint.
    const { rootLoader } = await import('../../app/routes');
    await rootLoader().catch(() => undefined); // content fetch is not mocked; only fil files matter
    expect(fetchMock).toHaveBeenCalledWith('/content/i18n/fil.stops.json');
    renderAt('/region/europe');
    const header = await screen.findByRole('banner');
    expect(await within(header).findByRole('link', { name: 'Mga Tagpo' })).toBeVisible();
    expect(within(header).getByRole('link', { name: /Europa/ })).toBeVisible();
  });

  it('keeps English content if the Filipino files cannot be fetched', async () => {
    fetchMock.mockImplementation(async () => ({ ok: false, status: 503 }) as Response);
    const user = userEvent.setup();
    renderAt('/settings');
    await user.click(await screen.findByRole('radio', { name: 'Filipino' }));
    const filHeader = await screen.findByRole('banner');
    // UI strings are part of the app, so they switch; content stays English.
    expect(await within(filHeader).findByRole('link', { name: 'Mga Tagpo' })).toBeVisible();
    expect(within(filHeader).getByRole('link', { name: /Europe/ })).toBeVisible();
    // The Filipino files did not load, so Settings says the translation may be incomplete.
    expect(screen.getByRole('button', { name: 'Draft translation' })).toBeVisible();
  });
});
