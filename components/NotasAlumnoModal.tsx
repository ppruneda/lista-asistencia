"use client";
import { useState } from "react";
import type { NotaCualitativa } from "@/types";

interface Props {
  alumnoNombre: string;
  notas: NotaCualitativa[];
  onClose: () => void;
  onAdd: (texto: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function NotasAlumnoModal({
  alumnoNombre,
  notas,
  onClose,
  onAdd,
  onDelete,
}: Props) {
  const [texto, setTexto] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!texto.trim()) return;
    setSaving(true);
    try {
      await onAdd(texto.trim());
      setTexto("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-bold text-navy">
            Entregas / Participaciones — {alumnoNombre}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-navy">
            ✕
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-2">
          {notas.length === 0 ? (
            <p className="text-sm text-gray-400">Sin notas registradas.</p>
          ) : (
            notas
              .slice()
              .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
              .map((n) => (
                <div
                  key={n.id}
                  className="flex items-start justify-between gap-2 border rounded-lg p-2 text-sm"
                >
                  <div>
                    <p className="text-gray-500 text-xs">
                      {n.fecha.toLocaleDateString("es-MX")}
                    </p>
                    <p className="text-navy">{n.texto}</p>
                  </div>
                  <button
                    onClick={() => onDelete(n.id)}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    Eliminar
                  </button>
                </div>
              ))
          )}
        </div>

        <div className="p-4 border-t space-y-2">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={2}
            placeholder="Ej. Entregó ensayo tema 3 / Participó activamente en debate"
            className="w-full border rounded-lg p-2 text-sm"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 text-sm text-gray-600 hover:text-navy"
            >
              Cerrar
            </button>
            <button
              onClick={handleAdd}
              disabled={saving || !texto.trim()}
              className="px-4 py-2 bg-gold text-navy font-medium text-sm rounded-lg disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Agregar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
