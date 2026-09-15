const styles: Record<string, string> = {
  APPROVED: 'status-approved',
  ACTIVE: 'status-approved',
  COMPLETED: 'status-approved',
  DISBURSED: 'status-approved',
  PENDING: 'status-pending',
  SUBMITTED: 'status-pending',
  UNDER_REVIEW: 'status-review',
  PROCESSING: 'status-review',
  REJECTED: 'status-rejected',
  FAILED: 'status-rejected',
  REVERSED: 'status-rejected',
  SUSPENDED: 'status-rejected',
  OVERDUE: 'status-rejected',
  DEFAULTED: 'status-rejected',
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`status-badge ${styles[status] || 'status-neutral'}`}>
      <span aria-hidden="true" />
      {status.replace(/_/g, ' ').toLowerCase()}
    </span>
  );
}
