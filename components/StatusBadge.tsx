interface StatusBadgeProps {
  status: "ok" | "risk" | "critical";
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const styles = {
    ok: "bg-green-100 text-green-700",
    risk: "bg-yellow-100 text-yellow-700",
    critical: "bg-red-100 text-red-700",
  };

  const labels = {
    ok: "✓ OK",
    risk: "⚠ Riesgo",
    critical: "✗ Crítico",
  };

  return (
    <span
      className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
