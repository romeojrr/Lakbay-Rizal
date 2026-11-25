import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createRoutes, routerFuture, type RootLoader } from '../../app/routes';
import { initialProgress, useProgress } from '../../store/progress';
import { realContent } from '../../test/content';
import { availableMaterials, isTownComplete, shortfall } from './builderModel';

const content = realContent();
const { builder } = content;
const loader: RootLoader = async () => ({ content, stops: content.stops });

function renderAt(path: string) {
  const router = createMemoryRouter(createRoutes(loader), {
    initialEntries: [path],
    future: routerFuture,
  });
  render(<RouterProvider router={router} future={{ v7_startTransition: true }} />);
  return router;
}

const tiles = () =>
  within(
    screen
      .getByRole('heading', { name: 'Materials' })
      .closest('div[aria-labelledby]') as HTMLElement,
  );
const amount = (material: string) =>
  tiles().getByText(material).previousElementSibling?.textContent;

beforeEach(() => {
  localStorage.clear();
  useProgress.setState({ ...initialProgress(), mode: 'free', visited: ['dapitan-1892'] });
});

afterEach(() => {
  useProgress.setState(initialProgress());
});

describe('builderModel', () => {
  const none = initialProgress();

  it('starts from builder.json, with the school pre-built and free', () => {
    expect(availableMaterials(builder, none)).toEqual(builder.start);
  });

  it('adds materials earned from stops and subtracts what was built', () => {
    const progress = {
      ...none,
      materials: { bamboo: 2, stone: 1, tools: 0 },
      builder: { school: false, clinic: true, water: false },
    };
    const clinic = builder.projects.clinic.cost;
    expect(availableMaterials(builder, progress)).toEqual({
      bamboo: builder.start.bamboo + 2 - (clinic.bamboo ?? 0),
      stone: builder.start.stone + 1 - (clinic.stone ?? 0),
      tools: builder.start.tools - (clinic.tools ?? 0),
    });
  });

  it('lists what is missing for a project', () => {
    const available = { bamboo: 0, stone: 10, tools: 3 };
    expect(shortfall('clinic', builder, available)).toEqual([
      { material: 'bamboo', missing: builder.projects.clinic.cost.bamboo },
    ]);
    expect(shortfall('water', builder, available)).toEqual([]);
  });

  it('the town is complete when all three projects stand', () => {
    expect(isTownComplete(builder, { builder: { school: false, clinic: true, water: true } })).toBe(
      true,
    );
    expect(
      isTownComplete(builder, { builder: { school: false, clinic: true, water: false } }),
    ).toBe(false);
  });
});

describe('Dapitan builder page (M5)', () => {
  it('opens with the school built and the start materials', async () => {
    renderAt('/dapitan/build');
    expect(await screen.findByRole('heading', { level: 1, name: 'Dapitan' })).toBeVisible();
    expect(screen.getByText('Town projects 1/3')).toBeVisible();
    expect(screen.getByRole('img', { name: 'School' })).toBeVisible();
    expect(screen.getByRole('img', { name: 'Empty plot for the clinic' })).toBeVisible();
    expect(amount('Bamboo')).toBe(String(builder.start.bamboo));
    expect(amount('Stone')).toBe(String(builder.start.stone));
    expect(amount('Tools')).toBe(String(builder.start.tools));
  });

  it('building places the sprite, spends materials and shows the fact from content', async () => {
    const user = userEvent.setup();
    renderAt('/dapitan/build');
    await user.click(await screen.findByRole('button', { name: 'Build the Clinic' }));

    expect(screen.getByRole('img', { name: 'Clinic' })).toBeVisible();
    expect(screen.getByText('Town projects 2/3')).toBeVisible();
    expect(screen.getByText(builder.projects.clinic.fact)).toBeVisible();
    expect(screen.getByText('Did you know?')).toBeVisible();
    expect(amount('Bamboo')).toBe(
      String(builder.start.bamboo - (builder.projects.clinic.cost.bamboo ?? 0)),
    );
  });

  it('building all three gives the Dapitan stamp once (§3.5)', async () => {
    const user = userEvent.setup();
    renderAt('/dapitan/build');
    await user.click(await screen.findByRole('button', { name: 'Build the Clinic' }));
    await user.click(screen.getByRole('button', { name: 'Build the Water system' }));

    expect(screen.getByText('Dapitan stamp earned!')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Open passport ▶' })).toHaveAttribute(
      'href',
      '/passport',
    );
    const s = useProgress.getState();
    expect(s.stamps).toEqual(['dapitan-1892']);
    expect(s.items).toEqual(['talisay-school-bell']);
    expect(s.completed).toEqual(['dapitan-1892']);
  });

  it('"Need more" explains what is missing', async () => {
    const pricey = {
      ...builder,
      projects: { ...builder.projects, water: { ...builder.projects.water, cost: { stone: 99 } } },
    };
    const router = createMemoryRouter(
      createRoutes(async () => ({
        content: { ...content, builder: pricey },
        stops: content.stops,
      })),
      { initialEntries: ['/dapitan/build'], future: routerFuture },
    );
    render(<RouterProvider router={router} future={{ v7_startTransition: true }} />);
    await screen.findByRole('heading', { level: 1, name: 'Dapitan' });
    expect(screen.queryByRole('button', { name: 'Build the Water system' })).toBeNull();
    expect(screen.getByText(/Needs \d+ more Stone/)).toBeInTheDocument();
  });

  it('Restart builder resets only the builder', async () => {
    const user = userEvent.setup();
    renderAt('/dapitan/build');
    await user.click(await screen.findByRole('button', { name: 'Build the Clinic' }));
    await user.click(screen.getByRole('button', { name: 'Build the Water system' }));
    await user.click(screen.getByRole('button', { name: 'Restart builder' }));

    expect(screen.getByText('Town projects 1/3')).toBeVisible();
    expect(amount('Stone')).toBe(String(builder.start.stone));
    expect(useProgress.getState().stamps).toEqual(['dapitan-1892']);
    expect(screen.getByText(/stamps and keepsakes are safe/)).toBeVisible();
  });

  it('asks to finish the Dapitan story first', async () => {
    useProgress.setState({ visited: [] });
    renderAt('/dapitan/build');
    expect(
      await screen.findByRole('heading', { name: 'Finish the Dapitan story first' }),
    ).toBeVisible();
  });

  it('the Dapitan stop links to the builder once its dialogue is finished', async () => {
    renderAt('/stop/dapitan-1892');
    expect(await screen.findByRole('link', { name: 'Build the town ▶' })).toHaveAttribute(
      'href',
      '/dapitan/build',
    );
  });
});
