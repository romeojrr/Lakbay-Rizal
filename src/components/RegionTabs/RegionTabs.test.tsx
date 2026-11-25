import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import RegionTabs from './RegionTabs';

function renderAt(path: string) {
  return render(
    <MemoryRouter
      initialEntries={[path]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <RegionTabs />
    </MemoryRouter>,
  );
}

describe('RegionTabs', () => {
  it('links to all four regions', () => {
    renderAt('/');
    const nav = screen.getByRole('navigation', { name: 'Regions' });
    const links = within(nav).getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual([
      'Philippines',
      'Asia',
      'Europe',
      'America',
    ]);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/region/philippines',
      '/region/asia',
      '/region/europe',
      '/region/america',
    ]);
  });

  it('marks only the current region tab', () => {
    renderAt('/region/europe');
    expect(screen.getByRole('link', { name: 'Europe' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Asia' })).not.toHaveAttribute('aria-current');
  });
});
