import { render, screen, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { realContent } from '../test/content';
import { createRoutes, routerFuture, type RootLoader } from './routes';

const content = realContent();

function renderAt(path: string, loader: RootLoader) {
  const router = createMemoryRouter(createRoutes(loader), {
    initialEntries: [path],
    future: routerFuture,
  });
  return render(<RouterProvider router={router} future={{ v7_startTransition: true }} />);
}

const withAllStops: RootLoader = async () => ({ content, stops: content.stops });

describe('Layout header', () => {
  it('shows the logo, region tabs from content, Scenes link and Passport link', async () => {
    renderAt('/', withAllStops);
    const header = await screen.findByRole('banner');

    expect(within(header).getByRole('link', { name: 'LAKBAY RIZAL' })).toHaveAttribute('href', '/');
    const regions = within(header).getByRole('navigation', { name: 'Regions' });
    expect(within(regions).getAllByRole('link')).toHaveLength(content.regions.length);
    expect(within(header).getByRole('link', { name: 'Scenes' })).toHaveAttribute('href', '/scenes');
    expect(within(header).getByRole('link', { name: 'Passport · 0/25' })).toHaveAttribute(
      'href',
      '/passport',
    );
  });

  it('counts only the stops this build may show', async () => {
    renderAt('/', async () => ({ content, stops: [] }));
    expect(await screen.findByRole('link', { name: 'Passport · 0/0' })).toBeInTheDocument();
  });

  it('renders the shell with an empty main area on any URL', async () => {
    renderAt('/some/unknown/page', withAllStops);
    expect(await screen.findByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeEmptyDOMElement();
  });

  it('shows a friendly retry message when content cannot load', async () => {
    renderAt('/', async () => {
      throw new Error('offline');
    });
    const alert = await screen.findByRole('alert');
    expect(
      within(alert).getByRole('heading', { name: 'The journey could not load' }),
    ).toBeVisible();
    expect(within(alert).getByRole('button', { name: 'Try again' })).toBeVisible();
  });
});
