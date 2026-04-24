"use client";
import { useMemo } from "react";
import type { Calificaciones, NotaParcial, Student } from "@/types";
import {
  calcularDerivados,
  debeExamenFinal,
  PASSING_PARCIAL1,
} from "@/lib/calificaciones";

export interface AlumnoConCalif extends Student {
  calificaciones: Calificaciones;
  percentage?: number;
}

interface Props {
  alumnos: AlumnoConCalif[];
  onChange: (cuenta: string, c: Calificaciones) => void;
  onOpenNotas: (cuenta: string) => void;
}

export default function CalificacionesTable({
  alumnos,
  onChange,
  onOpenNotas,
}: Props) {
  const rows = useMemo(
    () =>
      alumnos
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((a) => ({
          ...a,
          calificaciones: calcularDerivados(a.calificaciones),
        })),
    [alumnos]
  );

  function update(cuenta: string, patch: Partial<Calificaciones>) {
    const row = rows.find((r) => r.cuenta === cuenta);
    if (!row) return;
    const nuevo = calcularDerivados({ ...row.calificaciones, ...patch });
    onChange(cuenta, nuevo);
  }

  return (
    <div className="overflow-x-auto bg-white rounded-xl shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-navy/5 text-navy">
          <tr>
            <th className="px-3 py-2 text-left">Alumno</th>
            <th className="px-3 py-2">P1</th>
            <th className="px-3 py-2">P2</th>
            <th className="px-3 py-2">Ex. Final</th>
            <th className="px-3 py-2">Ajuste</th>
            <th className="px-3 py-2">Notas</th>
            <th className="px-3 py-2">Final (dec.)</th>
            <th className="px-3 py-2">Sugerida</th>
            <th className="px-3 py-2">Acta</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const c = r.calificaciones;
            const viaPromedio =
              c.parcial1 !== null &&
              c.parcial1 !== "NP" &&
              c.parcial1 >= PASSING_PARCIAL1;
            const viaFinal = debeExamenFinal(c.parcial1);
            return (
              <tr key={r.cuenta} className="border-t">
                <td className="px-3 py-2">
                  <div className="font-medium text-navy">{r.name}</div>
                  <div className="text-xs text-gray-500">{r.cuenta}</div>
                </td>

                <td className="px-2 py-2 text-center">
                  <NotaCell
                    value={c.parcial1}
                    onChange={(v) => update(r.cuenta, { parcial1: v })}
                  />
                </td>

                <td className="px-2 py-2 text-center">
                  <NotaCell
                    value={c.parcial2}
                    disabled={!viaPromedio}
                    onChange={(v) => update(r.cuenta, { parcial2: v })}
                  />
                </td>

                <td className="px-2 py-2 text-center">
                  <NotaCell
                    value={c.examenFinal}
                    disabled={!viaFinal}
                    onChange={(v) => update(r.cuenta, { examenFinal: v })}
                  />
                </td>

                <td className="px-2 py-2 text-center">
                  <input
                    type="number"
                    step="0.1"
                    value={c.ajuste ?? ""}
                    onChange={(e) =>
                      update(r.cuenta, {
                        ajuste:
                          e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    className="w-16 border rounded px-1 py-1 text-center"
                    placeholder="0"
                  />
                </td>

                <td className="px-2 py-2 text-center">
                  <button
                    onClick={() => onOpenNotas(r.cuenta)}
                    className="text-gold hover:text-navy underline text-xs"
                  >
                    {c.notas.length} ✎
                  </button>
                </td>

                <td className="px-2 py-2 text-center font-medium">
                  {c.finalDecimalNP
                    ? "NP"
                    : c.finalDecimal === null
                    ? "—"
                    : c.finalDecimal.toFixed(2)}
                </td>

                <td className="px-2 py-2 text-center text-gray-500">
                  {c.sugeridaRedondeada ?? "—"}
                </td>

                <td className="px-2 py-2 text-center">
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={c.finalActa ?? ""}
                    onChange={(e) =>
                      update(r.cuenta, {
                        finalActa:
                          e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    className="w-16 border rounded px-1 py-1 text-center font-bold text-navy"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function NotaCell({
  value,
  onChange,
  disabled,
}: {
  value: NotaParcial;
  onChange: (v: NotaParcial) => void;
  disabled?: boolean;
}) {
  const isNP = value === "NP";
  return (
    <div className="flex items-center gap-1 justify-center">
      <input
        type="number"
        step="0.1"
        min={0}
        max={10}
        disabled={disabled || isNP}
        value={isNP || value === null ? "" : value}
        onChange={(e) =>
          onChange(e.target.value === "" ? null : Number(e.target.value))
        }
        className="w-16 border rounded px-1 py-1 text-center disabled:bg-gray-100"
        placeholder={disabled ? "—" : isNP ? "NP" : ""}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(isNP ? null : "NP")}
        className={`text-[10px] px-1 py-0.5 rounded border ${
          isNP
            ? "bg-red-600 text-white border-red-600"
            : "text-gray-500 border-gray-300 hover:bg-gray-100"
        } disabled:opacity-30`}
        title="No presentó"
      >
        NP
      </button>
    </div>
  );
}
