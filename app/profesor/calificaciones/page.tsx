"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  getAllStudents,
  getCalificaciones,
  upsertCalificaciones,
} from "@/lib/firestore";
import CalificacionesTable, {
  AlumnoConCalif,
} from "@/components/CalificacionesTable";
import NotasAlumnoModal from "@/components/NotasAlumnoModal";
import type { Calificaciones, NotaCualitativa } from "@/types";

export default function CalificacionesPage() {
  const { user, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<AlumnoConCalif[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingAll, setSavingAll] = useState(false);
  const [modalCuenta, setModalCuenta] = useState<string | null>(null);
  const [dirty, setDirty] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      try {
        const students = await getAllStudents();
        const withCalifs = await Promise.all(
          students.map(async (s) => {
            const c = await getCalificaciones(s.cuenta);
            return { ...s, calificaciones: c } as AlumnoConCalif;
          })
        );
        setRows(withCalifs);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    if (user) load();
  }, [user]);

  function handleChange(cuenta: string, c: Calificaciones) {
    setRows((prev) =>
      prev.map((r) => (r.cuenta === cuenta ? { ...r, calificaciones: c } : r))
    );
    setDirty((prev) => new Set(prev).add(cuenta));
  }

  async function handleSaveAll() {
    setSavingAll(true);
    try {
      const pending = rows.filter((r) => dirty.has(r.cuenta));
      await Promise.all(
        pending.map((r) => upsertCalificaciones(r.cuenta, r.calificaciones))
      );
      setDirty(new Set());
    } finally {
      setSavingAll(false);
    }
  }

  async function handleAddNota(cuenta: string, texto: string) {
    const nota: NotaCualitativa = {
      id: crypto.randomUUID(),
      fecha: new Date(),
      texto,
    };
    const row = rows.find((r) => r.cuenta === cuenta);
    if (!row) return;
    const nuevasNotas = [...row.calificaciones.notas, nota];
    setRows((prev) =>
      prev.map((r) =>
        r.cuenta === cuenta
          ? {
              ...r,
              calificaciones: { ...r.calificaciones, notas: nuevasNotas },
            }
          : r
      )
    );
    await upsertCalificaciones(cuenta, {
      ...row.calificaciones,
      notas: nuevasNotas,
    });
  }

  async function handleDeleteNota(cuenta: string, id: string) {
    const row = rows.find((r) => r.cuenta === cuenta);
    if (!row) return;
    const nuevasNotas = row.calificaciones.notas.filter((n) => n.id !== id);
    setRows((prev) =>
      prev.map((r) =>
        r.cuenta === cuenta
          ? {
              ...r,
              calificaciones: { ...r.calificaciones, notas: nuevasNotas },
            }
          : r
      )
    );
    await upsertCalificaciones(cuenta, {
      ...row.calificaciones,
      notas: nuevasNotas,
    });
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-navy/60 text-lg">Cargando calificaciones...</p>
      </div>
    );
  }

  const activeModal = rows.find((r) => r.cuenta === modalCuenta);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Calificaciones</h1>
        <button
          onClick={handleSaveAll}
          disabled={savingAll || dirty.size === 0}
          className="px-4 py-2 bg-gold text-navy font-bold rounded-lg disabled:opacity-50"
        >
          {savingAll
            ? "Guardando..."
            : dirty.size === 0
            ? "Guardado"
            : `Guardar (${dirty.size})`}
        </button>
      </div>

      <p className="text-sm text-gray-500">
        Regla: si P1 ≥ 7 se promedia con P2. Si P1 &lt; 7 o NP, se aplica el
        examen final. Ajuste es un campo libre que sumas/restas a la final
        decimal antes de redondear. La columna &quot;Acta&quot; es la que tú
        decides asentar (sube o baja respecto a la sugerencia).
      </p>

      {rows.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center shadow-sm">
          <p className="text-gray-400">No hay alumnos registrados aún.</p>
        </div>
      ) : (
        <CalificacionesTable
          alumnos={rows}
          onChange={handleChange}
          onOpenNotas={setModalCuenta}
        />
      )}

      {activeModal && (
        <NotasAlumnoModal
          alumnoNombre={activeModal.name}
          notas={activeModal.calificaciones.notas}
          onClose={() => setModalCuenta(null)}
          onAdd={(texto) => handleAddNota(activeModal.cuenta, texto)}
          onDelete={(id) => handleDeleteNota(activeModal.cuenta, id)}
        />
      )}
    </div>
  );
}
