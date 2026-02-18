import type { StudentReport } from "@/types";

export function exportReportToCSV(reports: StudentReport[]) {
  const headers = [
    "Cuenta",
    "Nombre",
    "Asistencias",
    "Parciales",
    "Faltas",
    "Porcentaje",
    "Faltas Restantes",
    "Estado",
  ];

  const statusLabels = {
    ok: "OK",
    risk: "En riesgo",
    critical: "Crítico",
  };

  const rows = reports.map((r) => [
    r.cuenta,
    `"${r.name}"`,
    r.attended.toString(),
    r.partial.toString(),
    r.missed.toString(),
    `${r.percentage}%`,
    r.remainingAbsences.toString(),
    statusLabels[r.status],
  ]);

  const csvContent =
    "\uFEFF" + // BOM for Excel UTF-8 compatibility
    headers.join(",") +
    "\n" +
    rows.map((row) => row.join(",")).join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `reporte-asistencia-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
