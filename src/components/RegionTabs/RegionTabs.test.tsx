import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { realContent } from '../../test/content';
import RegionTabs from './RegionTabs';

const { regions } = realContent();

function renderAt(path: string) {
  return render(
    <MemoryRouter
      initialEntries={[path]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <RegionTabs regions={regions} />
    </MemoryRouter>,
  );
}

describe('RegionTabs', () => {
  it('links to every region in content, in order', () => {
    renderAt('/map');
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

  it('marks the region of the next stop for everyone, including screen readers', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <RegionTabs regions={regions} nextRegion="asia" />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Asia, your next stop is here' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Europe' })).toBeVisible();
  });

  it('marks only the current region tab', () => {
    renderAt('/region/europe');
    expect(screen.getByRole('link', { name: 'Europe' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Asia' })).not.toHaveAttribute('aria-current');
  });
});
