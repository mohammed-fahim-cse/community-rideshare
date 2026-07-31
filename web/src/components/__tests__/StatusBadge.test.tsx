import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusBadge } from '../StatusBadge';

describe('StatusBadge', () => {
  it.each([
    ['PENDING', 'badge-warn'],
    ['ACTIVE', 'badge-good'],
    ['SUSPENDED', 'badge-danger'],
    ['OPEN', 'badge-accent'],
    ['COMPLETED', 'badge-good'],
    ['CANCELLED', 'badge-neutral'],
    ['ACTIONED', 'badge-good'],
  ])('maps %s to the %s tone', (status, expectedClass) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(status.replace('_', ' '))).toHaveClass(expectedClass);
  });

  it('falls back to neutral for an unrecognized status rather than throwing', () => {
    render(<StatusBadge status="SOMETHING_NEW" />);
    expect(screen.getByText('SOMETHING NEW')).toHaveClass('badge-neutral');
  });

  it('renders underscored statuses (e.g. IN_PROGRESS) with a space', () => {
    render(<StatusBadge status="IN_PROGRESS" />);
    expect(screen.getByText('IN PROGRESS')).toBeInTheDocument();
  });
});
