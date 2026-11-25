import { render, screen, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { routerFuture, routes } from './routes';

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path], future: routerFuture });
  return render(<RouterProvider router={router} future={{ v7_startTransition: true }} />);
}

describe('Layout header', () => {
  it('shows the logo, region tabs, Scenes link and Passport link', () => {
    renderAt('/');
    const header = screen.getByRole('banner');

    expect(within(header).getByRole('link', { name: 'LAKBAY RIZAL' })).toHaveAttribute('href', '/');
    const regions = within(header).getByRole('navigation', { name: 'Regions' });
    expect(within(regions).getAllByRole('link')).toHaveLength(4);
    expect(within(header).getByRole('link', { name: 'Scenes' })).toHaveAttribute('href', '/scenes');
    expect(within(header).getByRole('link', { name: 'Passport · 0/25' })).toHaveAttribute(
      'href',
      '/passport',
    );
  });

  it('renders the shell with an empty main area on any URL', () => {
    renderAt('/some/unknown/page');
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeEmptyDOMElement();
  });
});
