"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  getAllStudents,
  getAllSessions,
  getRecordsBySession,
  getCalificaciones,
} from "@/lib/firestore";
import { generateFullReport } from "@/lib/attendance-calc";
import { exportActaToCSV } from "@/lib/export-csv";
import { estatusFila, formatoNota } from "@/lib/calificaciones";
import type {
  AttendanceRecord,
  GradeReportRow,
  Session,
} from "@/types";

const TOTAL_CLASES = 30;

export default function ReporteFinalPage() {
  const { user, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<GradeReportRow[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [students, sessionsData] = await Promise.all([
          getAllStudents(),
          getAllSessions(),
        ]);
        setSessions(sessionsData);

        const allRecords: AttendanceRecord[] = [];
        const arrs = await Promise.all(
          sessionsData.map((s) => getRecordsBySession(s.id))
        );
        arrs.forEach((a) => allRecords.push(...a));

        const attendanceReport = generateFullReport(
          students,
          allRecords,
          sessionsData,
          TOTAL_CLASES
        );

        const gradeRows: GradeReportRow[] = await Promise.all(
          students.map(async (s) => {
            const c = await getCalificaciones(s.cuenta);
            const att = attendanceReport.find((a) => a.cuenta === s.cuenta);
            return {
              cuenta: s.cuenta,
              name: s.name,
              percentage: att?.percentage ?? 0,
              parcial1: c.parcial1,
              parcial2: c.parcial2,
              examenFinal: c.examenFinal,
              notas: c.notas,
              ajuste: c.ajuste,
              finalDecimal: c.finalDecimal,
              finalDecimalNP: c.finalDecimalNP,
              sugeridaRedondeada: c.sugeridaRedondeada,
              finalActa: c.finalActa,
              estatus: estatusFila(c),
            };
          })
        );
        gradeRows.sort((a, b) => a.name.localeCompare(b.name));
        setRows(gradeRows);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    if (user) load();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-navy/60 text-lg">Generando reporte final...</p>
      </div>
    );
  }

  const closedSessions = sessions.filter((s) => s.phase === "closed").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <h1 className="text-2xl font-bold text-navy">Reporte Final</h1>
        <div className="flex gap-2">
          <button
            onClick={() => exportActaToCSV(rows)}
            className="px-4 py-2 border border-navy/20 text-navy rounded-lg hover:bg-navy/5 text-sm font-medium"
          >
            📥 Exportar CSV
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-navy text-cream rounded-lg text-sm font-medium"
          >
            🖨️ Imprimir / PDF
          </button>
        </div>
      </div>

      <div className="printable bg-white rounded-xl shadow-sm p-4 overflow-x-auto">
        <div className="mb-4">
          <h2 className="font-bold text-navy text-lg">
            Acta final del curso
          </h2>
          <p className="text-xs text-gray-500">
            Sucesiones — Prof. Pruneda · {closedSessions} de {TOTAL_CLASES}{" "}
            clases completadas · Generado el{" "}
            {new Date().toLocaleDateString("es-MX")}
          </p>
        </div>

        <table className="w-full text-xs">
          <thead>
            <tr className="bg-navy/5 text-navy text-left">
              <th className="px-2 py-2">Cuenta</th>
              <th className="px-2 py-2">Alumno</th>
              <th className="px-2 py-2">% Asist.</th>
              <th className="px-2 py-2">P1</th>
              <th className="px-2 py-2">P2</th>
              <th className="px-2 py-2">Final Ex.</th>
              <th className="px-2 py-2">Entregas / Participaciones</th>
              <th className="px-2 py-2">Aj.</th>
              <th className="px-2 py-2">Final (déc.)</th>
              <th className="px-2 py-2">Sug.</th>
              <th className="px-2 py-2">Acta</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.cuenta} className="border-t align-top">
                <td className="px-2 py-2 text-gray-500">{r.cuenta}</td>
                <td className="px-2 py-2 font-medium text-navy">{r.name}</td>
                <td className="px-2 py-2">{r.percentage}%</td>
                <td className="px-2 py-2">{formatoNota(r.parcial1)}</td>
                <td className="px-2 py-2">{formatoNota(r.parcial2)}</td>
                <td className="px-2 py-2">{formatoNota(r.examenFinal)}</td>
                <td className="px-2 py-2 max-w-[200px]">
                  {r.notas.length === 0 ? (
                    <span className="text-gray-400">—</span>
                  ) : (
                    <ul className="list-disc ml-4 text-gray-700">
                      {r.notas.map((n) => (
                        <li key={n.id}>{n.texto}</li>
                      ))}
                    </ul>
                  )}
                </td>
                <td className="px-2 py-2">
                  {r.ajuste === null ? "—" : r.ajuste.toFixed(1)}
                </td>
                <td className="px-2 py-2 font-medium">
                  {r.finalDecimalNP
                    ? "NP"
                    : r.finalDecimal === null
                    ? "—"
                    : r.finalDecimal.toFixed(2)}
                </td>
                <td className="px-2 py-2 text-gray-500">
                  {r.sugeridaRedondeada ?? "—"}
                </td>
                <td className="px-2 py-2 font-bold text-navy">
                  {r.finalActa ?? (r.finalDecimalNP ? "NP" : "—")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="text-[10px] text-gray-400 mt-4">
          Regla: P1 ≥ 7 → final = (P1+P2)/2 + ajuste. P1 &lt; 7 o NP → final =
          Examen Final + ajuste. &quot;NP&quot; = no presentó. La columna
          &quot;Acta&quot; es la que el profesor asienta.
        </p>
      </div>
    </div>
  );
}
