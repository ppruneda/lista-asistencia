"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  getStudent,
  getAllSessions,
  getRecordsByStudent,
} from "@/lib/firestore";
import {
  calculateAttendance,
  calculateProjection,
  getStudentStatus,
} from "@/lib/attendance-calc";
import StatusBadge from "@/components/StatusBadge";
import type { Student, Session, AttendanceRecord } from "@/types";

interface SessionDetail {
  sessionId: string;
  label: string;
  date: Date;
  entrada?: Date;
  salida?: Date;
  result: "Completa" | "Parcial" | "Falta";
}

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const cuenta = params.cuenta as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [details, setDetails] = useState<SessionDetail[]>([]);
  const [attendance, setAttendance] = useState<ReturnType<typeof calculateAttendance> | null>(null);
  const [projection, setProjection] = useState<ReturnType<typeof calculateProjection> | null>(null);
  const [status, setStatus] = useState<"ok" | "risk" | "critical">("ok");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [studentData, sessions, records] = await Promise.all([
          getStudent(cuenta),
          getAllSessions(),
          getRecordsByStudent(cuenta),
        ]);

        if (!studentData) {
          setLoading(false);
          return;
        }

        setStudent(studentData);

        const att = calculateAttendance(records, sessions, cuenta);
        const proj = calculateProjection(att, 30);
        const st = getStudentStatus(att.percentage, proj.bestCase);

        setAttendance(att);
        setProjection(proj);
        setStatus(st);

        // Build session-by-session detail
        const closedSessions = sessions
          .filter((s) => s.phase === "closed")
          .sort((a, b) => a.date.getTime() - b.date.getTime());

        const recordMap = new Map<string, AttendanceRecord[]>();
        records.forEach((r) => {
          const existing = recordMap.get(r.sessionId) || [];
          existing.push(r);
          recordMap.set(r.sessionId, existing);
        });

        const sessionDetails: SessionDetail[] = closedSessions.map((session) => {
          const recs = recordMap.get(session.id) || [];
          const entrada = recs.find((r) => r.phase === "entrada");
          const salida = recs.find((r) => r.phase === "salida");

          let result: SessionDetail["result"] = "Falta";
          if (entrada && salida) result = "Completa";
          else if (entrada || salida) result = "Parcial";

          return {
            sessionId: session.id,
            label: session.label,
            date: session.date,
            entrada: entrada?.timestamp,
            salida: salida?.timestamp,
            result,
          };
        });

        setDetails(sessionDetails);
      } catch (err) {
        console.error("Error loading student detail:", err);
      } finally {
        setLoading(false);
      }
    }

    if (user) loadData();
  }, [user, cuenta]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-navy/60 text-lg">Cargando...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Alumno no encontrado</p>
        <button
          onClick={() => router.push("/profesor/reportes")}
          className="mt-4 text-gold hover:text-navy font-medium"
        >
          ← Volver a reportes
        </button>
      </div>
    );
  }

  const getPercentageColor = (pct: number) => {
    if (pct >= 80) return "text-green-700";
    if (pct >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">{student.name}</h1>
          <p className="text-gray-500 font-mono">{student.cuenta}</p>
        </div>
        <button
          onClick={() => router.push("/profesor/reportes")}
          className="px-4 py-2 text-sm text-navy border border-navy/20 rounded-lg hover:bg-navy/5"
        >
          ← Reportes
        </button>
      </div>

      {/* Stats */}
      {attendance && projection && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm text-center">
            <p className="text-sm text-gray-500">Porcentaje</p>
            <p className={`text-4xl font-bold ${getPercentageColor(attendance.percentage)}`}>
              {attendance.percentage}%
            </p>
            <StatusBadge status={status} />
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm text-center">
            <p className="text-sm text-gray-500">Asistencias</p>
            <p className="text-3xl font-bold text-green-700">{attendance.attended}</p>
            <p className="text-xs text-gray-400">completas</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm text-center">
            <p className="text-sm text-gray-500">Parciales</p>
            <p className="text-3xl font-bold text-yellow-600">{attendance.partial}</p>
            <p className="text-xs text-gray-400">solo entrada o salida</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm text-center">
            <p className="text-sm text-gray-500">Proyección</p>
            <p className={`text-3xl font-bold ${getPercentageColor(projection.bestCase)}`}>
              {projection.bestCase}%
            </p>
            <p className="text-xs text-gray-400">
              mejor caso · {projection.remainingAbsences} faltas disponibles
            </p>
          </div>
        </div>
      )}

      {/* Session-by-session detail */}
      <div>
        <h2 className="text-lg font-bold text-navy mb-3">Historial por clase</h2>
        {details.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm">
            <p className="text-gray-400">No hay clases cerradas aún.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-navy/5 text-left">
                    <th className="px-4 py-3 font-medium text-navy">Clase</th>
                    <th className="px-4 py-3 font-medium text-navy">Fecha</th>
                    <th className="px-4 py-3 font-medium text-navy">Entrada</th>
                    <th className="px-4 py-3 font-medium text-navy">Salida</th>
                    <th className="px-4 py-3 font-medium text-navy">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {details.map((d) => (
                    <tr key={d.sessionId} className="border-t border-gray-100">
                      <td className="px-4 py-3 font-medium text-navy">{d.label}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {d.date.toLocaleDateString("es-MX", {
                          day: "numeric",
                          month: "short",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        {d.entrada ? (
                          <span className="text-green-700">
                            {d.entrada.toLocaleTimeString("es-MX", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        ) : (
                          <span className="text-red-400">✗</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {d.salida ? (
                          <span className="text-green-700">
                            {d.salida.toLocaleTimeString("es-MX", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        ) : (
                          <span className="text-red-400">✗</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            d.result === "Completa"
                              ? "bg-green-100 text-green-700"
                              : d.result === "Parcial"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {d.result}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Timeline */}
      {details.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-navy mb-3">Timeline</h2>
          <div className="flex flex-wrap gap-1">
            {details.map((d) => (
              <div
                key={d.sessionId}
                title={`${d.label}: ${d.result}`}
                className={`w-8 h-8 rounded flex items-center justify-center text-xs font-mono ${
                  d.result === "Completa"
                    ? "bg-green-500 text-white"
                    : d.result === "Parcial"
                    ? "bg-yellow-400 text-navy"
                    : "bg-red-400 text-white"
                }`}
              >
                {d.label.replace("Clase ", "")}
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-2 text-xs text-gray-400">
            <span>🟩 Completa</span>
            <span>🟨 Parcial</span>
            <span>🟥 Falta</span>
          </div>
        </div>
      )}
    </div>
  );
}
