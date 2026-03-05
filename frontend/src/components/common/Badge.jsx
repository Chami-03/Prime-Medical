const STATUS_MAP = {
  // Appointment
  PENDING:        'badge-amber',
  CONFIRMED:      'badge-blue',
  COMPLETED:      'badge-green',
  CANCELLED:      'badge-red',
  NO_SHOW:        'badge-gray',
  IN_CONSULTATION:'badge-purple',
  CHECKED_IN:     'badge-blue',
  IN_PROGRESS:    'badge-purple',
  WAITING:        'badge-amber',
  // Billing
  DRAFT:          'badge-gray',
  ISSUED:         'badge-blue',
  PARTIAL:        'badge-amber',
  PAID:           'badge-green',
  REFUNDED:       'badge-red',
  // Prescription
  DISPENSED:      'badge-green',
  // Priority
  EMERGENCY:      'badge-red',
  NORMAL:         'badge-gray',
  // Severity
  LOW:            'badge-gray',
  MEDIUM:         'badge-amber',
  HIGH:           'badge-red',
}

export default function Badge({ status, label, className = '' }) {
  const cls = STATUS_MAP[status] || 'badge-gray'
  return (
    <span className={`${cls} whitespace-nowrap ${className}`}>
      {label || status?.replace(/_/g, ' ')}
    </span>
  )
}
