"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getSession, getRecordsBySession, getAllStudents } from "@/lib/firestore";
import type { Session, AttendanceRecord, Student } from "@/types";

interface AttendanceSummary {
  cuenta: string;
  name: string;
  entrada?: Date;
  salida?: Date;
  status: "Completa" | "Solo entrada" | "Solo salida";
}

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [summaries, setSummaries] = useState<AttendanceSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const sessionId = params.id as string;

  useEffect(() => {
    async function loadData() {
      try {
        const [sessionData, records, students] = await Promise.all([
          getSession(sessionId),
          getRecordsBySession(sessionId),
          getAllStudents(),
        ]);

        if (!sessionData) {
          setLoading(false);
          return;
        }

        setSession(sessionData);

        // Build a map of students for name lookup
        const studentMap = new Map<string, Student>();
        students.forEach((s) => studentMap.set(s.cuenta, s));

        // Group records by cuenta
        const recordsByCuenta = new Map<string, AttendanceRecord[]>();
        records.forEach((r) => {
          const existing = recordsByCuenta.get(r.cuenta) || [];
          existing.push(r);
          recordsByCuenta.set(r.cuenta, existing);
        });

        // Build summaries
        const result: AttendanceSummary[] = [];
        recordsByCuenta.forEach((recs, cuenta) => {
          const student = studentMap.get(cuenta);
          const entrada = recs.find((r) => r.phase === "entrada");
          const salida = recs.find((r) => r.phase === "salida");

          let status: AttendanceSummary["status"] = "Solo entrada";
          if (entrada && salida) status = "Completa";
          else if (salida && !entrada) status = "Solo salida";

          result.push({
            cuenta,
            name: student?.name || cuenta,
            entrada: entrada?.timestamp,
            salida: salida?.timestamp,
            status,
          });
        });

        // Sort by name
        result.sort((a, b) => a.name.localeCompare(b.name));
        setSummaries(result);
      } catch (err) {
        console.error("Error loading session detail:", err);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadData();
    }
  }, [user, sessionId]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-navy/60 text-lg">Cargando...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Sesión no encontrada</p>
        <button
          onClick={() => router.push("/profesor")}
          className="mt-4 text-gold hover:text-navy font-medium"
        >
          ← Volver al dashboard
        </button>
      </div>
    );
  }

  const completas = summaries.filter((s) => s.status === "Completa").length;
  const parciales = summaries.filter((s) => s.status !== "Completa").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">{session.label}</h1>
          <p className="text-gray-500">
            {session.date.toLocaleDateString("es-MX", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <button
          onClick={() => router.push("/profesor")}
          className="px-4 py-2 text-sm text-navy border border-navy/20 rounded-lg hover:bg-navy/5"
        >
          ← Dashboard
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total registros</p>
          <p className="text-3xl font-bold text-navy">{summaries.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">Asistencias completas</p>
          <p className="text-3xl font-bold text-green-700">{completas}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">Parciales</p>
          <p className="text-3xl font-bold text-yellow-600">{parciales}</p>
        </div>
      </div>

      {/* Attendance table */}
      {summaries.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center shadow-sm">
          <p className="text-gray-400">
            No se registraron asistencias en esta sesión.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-navy/5 text-left">
                  <th className="px-4 py-3 text-sm font-medium text-navy">
                    Alumno
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-navy">
                    Cuenta
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-navy">
                    Entrada
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-navy">
                    Salida
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-navy">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                {summaries.map((s) => (
                  <tr
                    key={s.cuenta}
                    className="border-t border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium text-navy">
                      {s.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                      {s.cuenta}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {s.entrada ? (
                        <span className="text-green-700">
                          {s.entrada.toLocaleTimeString("es-MX", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      ) : (
                        <span className="text-red-400">✗</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {s.salida ? (
                        <span className="text-green-700">
                          {s.salida.toLocaleTimeString("es-MX", {
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
                          s.status === "Completa"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {s.status}
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
  );
}
