"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getAllSessions, getAllStudents } from "@/lib/firestore";
import type { Session, Student } from "@/types";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [sessionsData, studentsData] = await Promise.all([
          getAllSessions(),
          getAllStudents(),
        ]);
        setSessions(sessionsData);
        setStudents(studentsData);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadData();
    }
  }, [user]);

  async function handleNewSession() {
    setCreating(true);
    try {
      const response = await fetch("/api/session/create", {
        method: "POST",
      });
      const data = await response.json();
      if (data.success) {
        router.push(`/profesor/sesion/${data.sessionId}`);
      }
    } catch (err) {
      console.error("Error creating session:", err);
    } finally {
      setCreating(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-navy/60 text-lg">Cargando...</p>
      </div>
    );
  }

  const activeSession = sessions.find((s) => s.phase !== "closed");
  const closedSessions = sessions.filter((s) => s.phase === "closed");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Dashboard</h1>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">Clases completadas</p>
          <p className="text-3xl font-bold text-navy">{closedSessions.length}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">Alumnos registrados</p>
          <p className="text-3xl font-bold text-navy">{students.length}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">Total de sesiones</p>
          <p className="text-3xl font-bold text-navy">{sessions.length}</p>
        </div>
      </div>

      {/* Active session or New class button */}
      {activeSession ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">
                Sesión activa
              </p>
              <p className="text-lg font-bold text-green-900">
                {activeSession.label} — Fase:{" "}
                {activeSession.phase === "entrada" ? "Entrada" : "Salida"}
              </p>
            </div>
            <button
              onClick={() =>
                router.push(`/profesor/sesion/${activeSession.id}`)
              }
              className="px-6 py-3 bg-green-700 text-white font-bold rounded-lg hover:bg-green-800 transition-colors"
            >
              Continuar sesión
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleNewSession}
          disabled={creating}
          className="w-full py-4 bg-gold text-navy font-bold text-lg rounded-xl hover:bg-opacity-90 transition-all disabled:opacity-50 shadow-sm"
        >
          {creating ? "Creando clase..." : "➕ Nueva Clase"}
        </button>
      )}

      {/* Recent sessions */}
      <div>
        <h2 className="text-lg font-bold text-navy mb-3">Sesiones recientes</h2>
        {closedSessions.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm">
            <p className="text-gray-400">
              No hay clases completadas aún. Crea tu primera clase.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-navy/5 text-left">
                  <th className="px-4 py-3 text-sm font-medium text-navy">
                    Clase
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-navy">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-navy">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-navy">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody>
                {closedSessions.slice(0, 10).map((session) => (
                  <tr
                    key={session.id}
                    className="border-t border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium text-navy">
                      {session.label}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {session.date.toLocaleDateString("es-MX", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        Cerrada
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() =>
                          router.push(
                            `/profesor/sesion/${session.id}/detalle`
                          )
                        }
                        className="text-sm text-gold hover:text-navy font-medium"
                      >
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
