"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getAllStudents, getAllSessions, getRecordsBySession } from "@/lib/firestore";
import { generateFullReport } from "@/lib/attendance-calc";
import { exportReportToCSV } from "@/lib/export-csv";
import TablaAsistencia from "@/components/TablaAsistencia";
import type { Student, Session, AttendanceRecord, StudentReport } from "@/types";

export default function ReportesPage() {
  const { user, loading: authLoading } = useAuth();
  const [reports, setReports] = useState<StudentReport[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [students, sessionsData] = await Promise.all([
          getAllStudents(),
          getAllSessions(),
        ]);
        setSessions(sessionsData);

        // Load all records from all sessions
        const allRecords: AttendanceRecord[] = [];
        const recordPromises = sessionsData.map((s) =>
          getRecordsBySession(s.id)
        );
        const recordArrays = await Promise.all(recordPromises);
        recordArrays.forEach((records) => allRecords.push(...records));

        // Generate report (using 30 as default total classes)
        const report = generateFullReport(students, allRecords, sessionsData, 30);
        report.sort((a, b) => a.name.localeCompare(b.name));
        setReports(report);
      } catch (err) {
        console.error("Error loading reports:", err);
      } finally {
        setLoading(false);
      }
    }

    if (user) loadData();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-navy/60 text-lg">Cargando reportes...</p>
      </div>
    );
  }

  const closedSessions = sessions.filter((s) => s.phase === "closed").length;
  const okCount = reports.filter((r) => r.status === "ok").length;
  const riskCount = reports.filter((r) => r.status === "risk").length;
  const criticalCount = reports.filter((r) => r.status === "critical").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Reportes de Asistencia</h1>
        {reports.length > 0 && (
          <button
            onClick={() => exportReportToCSV(reports)}
            className="px-4 py-2 border border-navy/20 text-navy rounded-lg hover:bg-navy/5 transition-colors text-sm font-medium"
          >
            📥 Exportar CSV
          </button>
        )}
      </div>

      {/* Info */}
      <p className="text-gray-500 text-sm">
        {closedSessions} de 30 clases completadas — mínimo 80% de asistencia para acreditar
      </p>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-green-500">
          <p className="text-sm text-gray-500">OK</p>
          <p className="text-3xl font-bold text-green-700">{okCount}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-yellow-500">
          <p className="text-sm text-gray-500">En riesgo</p>
          <p className="text-3xl font-bold text-yellow-600">{riskCount}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-red-500">
          <p className="text-sm text-gray-500">Críticos</p>
          <p className="text-3xl font-bold text-red-600">{criticalCount}</p>
        </div>
      </div>

      {/* Table */}
      {reports.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center shadow-sm">
          <p className="text-gray-400">
            No hay alumnos registrados aún. Ve a la sección de Alumnos para agregar o subir un CSV.
          </p>
        </div>
      ) : (
        <TablaAsistencia reports={reports} />
      )}

      {/* Methodology note */}
      <div className="bg-white rounded-xl p-4 shadow-sm text-xs text-gray-400">
        <p className="font-medium text-gray-500 mb-1">Metodología de cálculo</p>
        <p>
          Asistencia completa (entrada + salida) = 1.0 · Asistencia parcial (solo
          entrada o solo salida) = 0.5 · Porcentaje = (completas + parciales×0.5) ÷
          clases cerradas × 100 · Estado OK: ≥80% · Riesgo: &lt;80% pero alcanzable ·
          Crítico: imposible llegar a 80%
        </p>
      </div>
    </div>
  );
}
