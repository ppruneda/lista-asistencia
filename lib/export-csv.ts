import type { StudentReport, GradeReportRow } from "@/types";

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
export function exportActaToCSV(rows: GradeReportRow[]) {
  const headers = [
    "Cuenta",
    "Nombre",
    "% Asistencia",
    "P1",
    "P2",
    "Examen Final",
    "Ajuste",
    "Final Decimal",
    "Sugerida",
    "Acta",
    "Notas/Participaciones",
  ];

  const fmt = (n: number | string | null): string => {
    if (n === null || n === undefined) return "";
    if (n === "NP") return "NP";
    if (typeof n === "number") return n.toString();
    return n;
  };

  const csvRows = rows.map((r) => [
    r.cuenta,
    `"${r.name.replace(/"/g, '""')}"`,
    `${r.percentage}%`,
    fmt(r.parcial1),
    fmt(r.parcial2),
    fmt(r.examenFinal),
    fmt(r.ajuste),
    r.finalDecimalNP
      ? "NP"
      : r.finalDecimal === null
      ? ""
      : r.finalDecimal.toFixed(2),
    fmt(r.sugeridaRedondeada),
    fmt(r.finalActa),
    `"${r.notas.map((n) => n.texto.replace(/"/g, '""')).join(" | ")}"`,
  ]);

  const csv =
    "\uFEFF" +
    headers.join(",") +
    "\n" +
    csvRows.map((r) => r.join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `acta-final-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
