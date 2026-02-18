"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getAllStudents, updateStudent, createStudent } from "@/lib/firestore";
import FileUpload from "@/components/FileUpload";
import type { Student } from "@/types";

export default function AlumnosPage() {
  const { user, loading: authLoading } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showMerge, setShowMerge] = useState(false);
  const [newCuenta, setNewCuenta] = useState("");
  const [newName, setNewName] = useState("");
  const [addingStudent, setAddingStudent] = useState(false);
  const [mergingFrom, setMergingFrom] = useState("");
  const [mergingTo, setMergingTo] = useState("");
  const [merging, setMerging] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function loadStudents() {
    try {
      const data = await getAllStudents();
      data.sort((a, b) => a.name.localeCompare(b.name));
      setStudents(data);
    } catch (err) {
      console.error("Error loading students:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) loadStudents();
  }, [user]);

  async function handleCSVUpload(data: { cuenta: string; name: string }[]) {
    const response = await fetch("/api/students/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ students: data }),
    });

    const result = await response.json();
    if (result.success) {
      setMessage({
        type: "success",
        text: `${result.created} creados, ${result.updated} actualizados${result.errors.length > 0 ? `, ${result.errors.length} errores` : ""}`,
      });
      setShowUpload(false);
      await loadStudents();
    } else {
      setMessage({ type: "error", text: result.error || "Error al subir" });
    }
  }

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();
    setAddingStudent(true);
    setMessage(null);

    try {
      const success = await createStudent({
        cuenta: newCuenta,
        name: newName.trim(),
        registeredVia: "csv",
        fingerprints: [],
        active: true,
      });

      if (success) {
        setMessage({ type: "success", text: `Alumno ${newName.trim()} agregado` });
        setNewCuenta("");
        setNewName("");
        setShowAddForm(false);
        await loadStudents();
      } else {
        setMessage({ type: "error", text: "Error al agregar alumno" });
      }
    } catch {
      setMessage({ type: "error", text: "Error al agregar alumno" });
    } finally {
      setAddingStudent(false);
    }
  }

  async function handleMerge(e: React.FormEvent) {
    e.preventDefault();
    if (!mergingFrom || !mergingTo) return;

    const confirmMsg = `¿Transferir todos los registros de la cuenta ${mergingFrom} a la cuenta ${mergingTo}?\n\nLa cuenta ${mergingFrom} será eliminada después de transferir.`;
    if (!window.confirm(confirmMsg)) return;

    setMerging(true);
    setMessage(null);

    try {
      const response = await fetch("/api/students/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromCuenta: mergingFrom, toCuenta: mergingTo }),
      });

      const result = await response.json();
      if (result.success) {
        setMessage({ type: "success", text: result.message });
        setMergingFrom("");
        setMergingTo("");
        setShowMerge(false);
        await loadStudents();
      } else {
        setMessage({ type: "error", text: result.error || "Error al fusionar" });
      }
    } catch {
      setMessage({ type: "error", text: "Error al fusionar registros" });
    } finally {
      setMerging(false);
    }
  }

  async function handleResetFingerprints(cuenta: string, name: string) {
    const confirm = window.confirm(
      `¿Resetear los dispositivos de ${name}? Tendrá que registrarse de nuevo desde su celular.`
    );
    if (!confirm) return;

    const success = await updateStudent(cuenta, { fingerprints: [] } as Partial<Student>);
    if (success) {
      setMessage({ type: "success", text: `Dispositivos de ${name} reseteados` });
      await loadStudents();
    } else {
      setMessage({ type: "error", text: "Error al resetear" });
    }
  }

  const filtered = students.filter((s) => {
    const term = search.toLowerCase();
    return s.name.toLowerCase().includes(term) || s.cuenta.includes(term);
  });

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-navy/60 text-lg">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Alumnos</h1>
        <p className="text-gray-500">{students.length} registrados</p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-3 rounded-lg text-sm font-medium ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => {
            setShowUpload(!showUpload);
            setShowAddForm(false);
            setShowMerge(false);
          }}
          className="px-4 py-2 bg-navy text-cream font-medium rounded-lg hover:bg-opacity-90 transition-colors text-sm"
        >
          📄 Subir CSV
        </button>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setShowUpload(false);
            setShowMerge(false);
          }}
          className="px-4 py-2 bg-gold text-navy font-medium rounded-lg hover:bg-opacity-90 transition-colors text-sm"
        >
          ➕ Agregar individual
        </button>
        <button
          onClick={() => {
            setShowMerge(!showMerge);
            setShowUpload(false);
            setShowAddForm(false);
          }}
          className="px-4 py-2 bg-white text-navy border border-navy/20 font-medium rounded-lg hover:bg-navy/5 transition-colors text-sm"
        >
          🔀 Corregir / Fusionar
        </button>
      </div>

      {/* CSV Upload section */}
      {showUpload && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-navy mb-4">Cargar alumnos desde CSV</h2>
          <FileUpload onUpload={handleCSVUpload} />
        </div>
      )}

      {/* Add individual form */}
      {showAddForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-navy mb-4">Agregar alumno</h2>
          <form onSubmit={handleAddStudent} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              inputMode="numeric"
              value={newCuenta}
              onChange={(e) => setNewCuenta(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="Número de cuenta"
              required
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-navy focus:ring-2 focus:ring-gold focus:border-gold outline-none font-mono"
            />
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nombre completo"
              required
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-navy focus:ring-2 focus:ring-gold focus:border-gold outline-none"
            />
            <button
              type="submit"
              disabled={addingStudent || newCuenta.length < 8 || newName.length < 3}
              className="px-6 py-3 bg-navy text-cream font-bold rounded-lg disabled:opacity-40"
            >
              {addingStudent ? "..." : "Agregar"}
            </button>
          </form>
        </div>
      )}

      {/* Merge/Correct section */}
      {showMerge && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-navy mb-2">Corregir / Fusionar registros</h2>
          <p className="text-gray-500 text-sm mb-4">
            Si un alumno se registró con un número de cuenta incorrecto, transfiere sus asistencias a la cuenta correcta. La cuenta incorrecta será eliminada.
          </p>
          <form onSubmit={handleMerge} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <div className="flex-1 w-full">
                <label className="block text-xs text-gray-500 mb-1">Cuenta incorrecta (origen)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={mergingFrom}
                  onChange={(e) => setMergingFrom(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="Ej: 99999999"
                  required
                  className="w-full px-4 py-3 border border-red-200 bg-red-50 rounded-lg text-navy focus:ring-2 focus:ring-gold outline-none font-mono"
                />
              </div>
              <span className="text-2xl text-gray-400 hidden sm:block">→</span>
              <div className="flex-1 w-full">
                <label className="block text-xs text-gray-500 mb-1">Cuenta correcta (destino)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={mergingTo}
                  onChange={(e) => setMergingTo(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="Ej: 31612345"
                  required
                  className="w-full px-4 py-3 border border-green-200 bg-green-50 rounded-lg text-navy focus:ring-2 focus:ring-gold outline-none font-mono"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={merging || mergingFrom.length < 8 || mergingTo.length < 8 || mergingFrom === mergingTo}
              className="w-full py-3 bg-navy text-cream font-bold rounded-lg disabled:opacity-40"
            >
              {merging ? "Fusionando..." : "Transferir registros"}
            </button>
          </form>
        </div>
      )}

      {/* Search */}
      <div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o cuenta..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-navy focus:ring-2 focus:ring-gold focus:border-gold outline-none"
        />
      </div>

      {/* Students table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center shadow-sm">
          <p className="text-gray-400">
            {students.length === 0
              ? "No hay alumnos registrados. Sube un CSV o agrégalos uno por uno."
              : "No se encontraron resultados."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-navy/5 text-left">
                  <th className="px-4 py-3 font-medium text-navy">Nombre</th>
                  <th className="px-4 py-3 font-medium text-navy">Cuenta</th>
                  <th className="px-4 py-3 font-medium text-navy">Registro</th>
                  <th className="px-4 py-3 font-medium text-navy">Dispositivos</th>
                  <th className="px-4 py-3 font-medium text-navy">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr
                    key={s.cuenta}
                    className="border-t border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium text-navy">
                      {s.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-600">
                      {s.cuenta}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          s.registeredVia === "csv"
                            ? "bg-blue-50 text-blue-600"
                            : "bg-purple-50 text-purple-600"
                        }`}
                      >
                        {s.registeredVia === "csv" ? "CSV" : "Auto"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {s.fingerprints?.length || 0} / 2
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() =>
                          handleResetFingerprints(s.cuenta, s.name)
                        }
                        className="text-xs text-red-500 hover:text-red-700 font-medium"
                        title="Resetear dispositivos"
                      >
                        Resetear dispositivos
                      </button>
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
