import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import TimelineSlider from './TimelineSlider';

function Harness({ start }: { start: number }) {
  const [year, setYear] = useState(start);
  return <TimelineSlider value={year} onChange={setYear} />;
}

describe('TimelineSlider (FR-20)', () => {
  it('is a slider from 1861 to 1896 with the current year', () => {
    render(<Harness start={1887} />);
    const slider = screen.getByRole('slider', { name: 'Year' });
    expect(slider).toHaveAttribute('aria-valuemin', '1861');
    expect(slider).toHaveAttribute('aria-valuemax', '1896');
    expect(slider).toHaveAttribute('aria-valuenow', '1887');
  });

  it('moves ±1 year with the arrows and ±5 with PageUp/PageDown', async () => {
    const user = userEvent.setup();
    render(<Harness start={1880} />);
    const slider = screen.getByRole('slider', { name: 'Year' });
    slider.focus();
    await user.keyboard('{ArrowRight}');
    expect(slider).toHaveAttribute('aria-valuenow', '1881');
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(slider).toHaveAttribute('aria-valuenow', '1879');
    await user.keyboard('{PageUp}');
    expect(slider).toHaveAttribute('aria-valuenow', '1884');
    await user.keyboard('{PageDown}{PageDown}');
    expect(slider).toHaveAttribute('aria-valuenow', '1874');
  });

  it('stays within 1861–1896 and jumps with Home/End', async () => {
    const user = userEvent.setup();
    render(<Harness start={1894} />);
    const slider = screen.getByRole('slider', { name: 'Year' });
    slider.focus();
    await user.keyboard('{PageUp}');
    expect(slider).toHaveAttribute('aria-valuenow', '1896');
    await user.keyboard('{Home}');
    expect(slider).toHaveAttribute('aria-valuenow', '1861');
    await user.keyboard('{ArrowLeft}');
    expect(slider).toHaveAttribute('aria-valuenow', '1861');
    await user.keyboard('{End}');
    expect(slider).toHaveAttribute('aria-valuenow', '1896');
  });

  it('shows the era labels', () => {
    render(<Harness start={1861} />);
    for (const label of ['1861 · Childhood', '1872 · School', '1882 · Europe', '1892 · Exile']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });
});
