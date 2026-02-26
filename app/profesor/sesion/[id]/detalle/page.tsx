"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getSession, getRecordsBySession, getAllStudents, createRecord, deleteRecord } from "@/lib/firestore";
import type { Session, AttendanceRecord, Student } from "@/types";

interface AttendanceSummary {
  cuenta: string;
  name: string;
  entrada?: Date;
  entradaRecordId?: string;
  salida?: Date;
  salidaRecordId?: string;
  status: "Completa" | "Solo entrada" | "Solo salida";
}

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [summaries, setSummaries] = useState<AttendanceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const sessionId = params.id as string;

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
      setAllStudents(students);

      const studentMap = new Map<string, Student>();
      students.forEach((s) => studentMap.set(s.cuenta, s));

      const recordsByCuenta = new Map<string, AttendanceRecord[]>();
      records.forEach((r) => {
        const existing = recordsByCuenta.get(r.cuenta) || [];
        existing.push(r);
        recordsByCuenta.set(r.cuenta, existing);
      });

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
          entradaRecordId: entrada?.id,
          salida: salida?.timestamp,
          salidaRecordId: salida?.id,
          status,
        });
      });

      result.sort((a, b) => a.name.localeCompare(b.name));
      setSummaries(result);
    } catch (err) {
      console.error("Error loading session detail:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, sessionId]);

  async function handleAddAttendance(cuenta: string, name: string) {
    setSaving(true);
    try {
      await createRecord({
        sessionId,
        cuenta,
        phase: "entrada",
        timestamp: session?.date || new Date(),
        fingerprint: "manual-profesor",
        tokenUsed: "manual",
      });
      await createRecord({
        sessionId,
        cuenta,
        phase: "salida",
        timestamp: session?.date || new Date(),
        fingerprint: "manual-profesor",
        tokenUsed: "manual",
      });
      await loadData();
      setShowAddModal(false);
      setSearchTerm("");
    } catch (err) {
      console.error("Error adding attendance:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteRecord(recordId: string | undefined) {
    if (!recordId) return;
    setSaving(true);
    try {
      await deleteRecord(recordId);
      await loadData();
    } catch (err) {
      console.error("Error deleting record:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddPhase(cuenta: string, phase: "entrada" | "salida") {
    setSaving(true);
    try {
      await createRecord({
        sessionId,
        cuenta,
        phase,
        timestamp: session?.date || new Date(),
        fingerprint: "manual-profesor",
        tokenUsed: "manual",
      });
      await loadData();
    } catch (err) {
      console.error("Error adding phase:", err);
    } finally {
      setSaving(false);
    }
  }

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
        <p className="text-gray-500">Sesion no encontrada</p>
        <button
          onClick={() => router.push("/profesor")}
          className="mt-4 text-gold hover:text-navy font-medium"
        >
          \u2190 Volver al dashboard
        </button>
      </div>
    );
  }

  const completas = summaries.filter((s) => s.status === "Completa").length;
  const parciales = summaries.filter((s) => s.status !== "Completa").length;

  const studentsWithoutAttendance = allStudents.filter(
    (s) => !summaries.find((sum) => sum.cuenta === s.cuenta)
  );

  const filteredStudents = studentsWithoutAttendance.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.cuenta.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="flex gap-2">
          <button
            onClick={() => setEditMode(!editMode)}
            className={`px-4 py-2 text-sm rounded-lg ${
              editMode
                ? "bg-navy text-white"
                : "text-navy border border-navy/20 hover:bg-navy/5"
            }`}
          >
            {editMode ? "\u2713 Editando" : "\u270E Editar asistencias"}
          </button>
          <button
            onClick={() => router.push("/profesor")}
            className="px-4 py-2 text-sm text-navy border border-navy/20 rounded-lg hover:bg-navy/5"
          >
            \u2190 Dashboard
          </button>
        </div>
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

      {/* Add attendance button in edit mode */}
      {editMode && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
          >
            + Agregar asistencia
          </button>
        </div>
      )}

      {/* Add attendance modal */}
      {showAddModal && (
        <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-green-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-navy">Agregar asistencia</h3>
            <button
              onClick={() => { setShowAddModal(false); setSearchTerm(""); }}
              className="text-gray-400 hover:text-gray-600"
            >
              \u2715
            </button>
          </div>
          <input
            type="text"
            placeholder="Buscar alumno por nombre o cuenta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg mb-4 focus:outline-none focus:border-navy"
          />
          {filteredStudents.length === 0 ? (
            <p className="text-gray-400 text-center py-4">
              {searchTerm ? "No se encontraron alumnos" : "Todos los alumnos ya tienen asistencia"}
            </p>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-2">
              {filteredStudents.map((s) => (
                <div
                  key={s.cuenta}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                >
                  <div>
                    <p className="font-medium text-navy">{s.name}</p>
                    <p className="text-sm text-gray-500 font-mono">{s.cuenta}</p>
                  </div>
                  <button
                    onClick={() => handleAddAttendance(s.cuenta, s.name)}
                    disabled={saving}
                    className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                  >
                    {saving ? "..." : "Agregar"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Attendance table */}
      {summaries.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center shadow-sm">
          <p className="text-gray-400">
            No se registraron asistencias en esta sesion.
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
                  {editMode && (
                    <th className="px-4 py-3 text-sm font-medium text-navy">
                      Acciones
                    </th>
                  )}
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
                        <span className="text-red-400">\u2717</span>
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
                        <span className="text-red-400">\u2717</span>
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
                    {editMode && (
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {!s.entrada && (
                            <button
                              onClick={() => handleAddPhase(s.cuenta, "entrada")}
                              disabled={saving}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                            >
                              +Entrada
                            </button>
                          )}
                          {!s.salida && (
                            <button
                              onClick={() => handleAddPhase(s.cuenta, "salida")}
                              disabled={saving}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                            >
                              +Salida
                            </button>
                          )}
                          {s.entradaRecordId && (
                            <button
                              onClick={() => handleDeleteRecord(s.entradaRecordId)}
                              disabled={saving}
                              className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                            >
                              \u2717 Entrada
                            </button>
                          )}
                          {s.salidaRecordId && (
                            <button
                              onClick={() => handleDeleteRecord(s.salidaRecordId)}
                              disabled={saving}
                              className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                            >
                              \u2717 Salida
                            </button>
                          )}
                        </div>
                      </td>
                    )}
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
