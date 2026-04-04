import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock lucide-react to avoid SVG rendering issues in jsdom
vi.mock('lucide-react', () => ({
  Inbox: () => <svg data-testid="inbox-icon" />,
}));

import { LoadingState, ErrorState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Tabs } from '@/components/ui/Tabs';

// ---------------------------------------------------------------------------
// LoadingState
// ---------------------------------------------------------------------------
describe('LoadingState', () => {
  it('renders default loading message', () => {
    render(<LoadingState />);
    expect(screen.getByText('جاري التحميل...')).toBeInTheDocument();
  });

  it('renders a custom message when provided', () => {
    render(<LoadingState message="يرجى الانتظار" />);
    expect(screen.getByText('يرجى الانتظار')).toBeInTheDocument();
  });

  it('has role="status" for assistive technology', () => {
    render(<LoadingState />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has aria-live="polite" for screen readers', () => {
    render(<LoadingState />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });
});

// ---------------------------------------------------------------------------
// ErrorState
// ---------------------------------------------------------------------------
describe('ErrorState', () => {
  it('renders default error message', () => {
    render(<ErrorState />);
    expect(screen.getByText('حدث خطأ أثناء تحميل البيانات')).toBeInTheDocument();
  });

  it('renders a custom error message', () => {
    render(<ErrorState message="فشل الاتصال بالخادم" />);
    expect(screen.getByText('فشل الاتصال بالخادم')).toBeInTheDocument();
  });

  it('has role="alert" for assistive technology', () => {
    render(<ErrorState />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    fireEvent.click(screen.getByText('إعادة المحاولة'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------
describe('EmptyState', () => {
  it('renders default empty message', () => {
    render(<EmptyState />);
    expect(screen.getByText('لا توجد بيانات')).toBeInTheDocument();
  });

  it('renders a custom message', () => {
    render(<EmptyState message="لا توجد نتائج" />);
    expect(screen.getByText('لا توجد نتائج')).toBeInTheDocument();
  });

  it('renders an action slot when provided', () => {
    render(<EmptyState action={<button>إضافة</button>} />);
    expect(screen.getByText('إضافة')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------
describe('Tabs', () => {
  const sampleTabs = [
    { id: 'all', label: 'الكل', count: 10 },
    { id: 'active', label: 'نشط', count: 3 },
    { id: 'inactive', label: 'غير نشط' },
  ];

  it('renders all tab labels', () => {
    render(<Tabs tabs={sampleTabs} active="all" onChange={() => {}} />);
    expect(screen.getByText('الكل')).toBeInTheDocument();
    expect(screen.getByText('نشط')).toBeInTheDocument();
    expect(screen.getByText('غير نشط')).toBeInTheDocument();
  });

  it('renders count badges when count is provided', () => {
    render(<Tabs tabs={sampleTabs} active="all" onChange={() => {}} />);
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('calls onChange with correct tab id on click', () => {
    const onChange = vi.fn();
    render(<Tabs tabs={sampleTabs} active="all" onChange={onChange} />);
    fireEvent.click(screen.getByText('نشط'));
    expect(onChange).toHaveBeenCalledWith('active');
  });

  it('applies active class to the selected tab', () => {
    render(<Tabs tabs={sampleTabs} active="active" onChange={() => {}} />);
    const activeButton = screen.getByText('نشط').closest('button');
    expect(activeButton?.className).toContain('active');

    const inactiveButton = screen.getByText('الكل').closest('button');
    expect(inactiveButton?.className).not.toContain('active');
  });
});
