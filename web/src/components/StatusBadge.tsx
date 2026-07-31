const TONES: Record<string, 'neutral' | 'good' | 'warn' | 'danger' | 'accent'> = {
  PENDING: 'warn',
  ACTIVE: 'good',
  SUSPENDED: 'danger',
  OPEN: 'accent',
  ACCEPTED: 'accent',
  IN_PROGRESS: 'warn',
  COMPLETED: 'good',
  CANCELLED: 'neutral',
  REVIEWED: 'neutral',
  ACTIONED: 'good',
};

export function StatusBadge({ status }: { status: string }) {
  const tone = TONES[status] ?? 'neutral';
  return <span className={`badge badge-${tone}`}>{status.replace('_', ' ')}</span>;
}
