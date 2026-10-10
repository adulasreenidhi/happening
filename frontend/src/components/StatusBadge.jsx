export function StatusBadge({ status, label, className = "" }) {
  if (!status) return null;

  const normalized = status.toUpperCase();
  let statusClass = "badge-neutral";

  if (normalized === "CONFIRMED" || normalized === "APPROVED" || normalized === "ACTIVE") {
    statusClass = "status-confirmed";
  } else if (normalized === "PENDING" || normalized === "WAITING") {
    statusClass = "status-pending";
  } else if (normalized === "CANCELLED" || normalized === "REJECTED" || normalized === "FAILED") {
    statusClass = "status-cancelled";
  }

  return (
    <span className={`status-chip ${statusClass} ${className}`}>
      {label || status}
    </span>
  );
}

export default StatusBadge;
