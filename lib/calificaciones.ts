import type { Calificaciones, NotaParcial } from "@/types";

export const PASSING_PARCIAL1 = 7;

export function calificacionesVacias(): Calificaciones {
  return {
    parcial1: null,
    parcial2: null,
    examenFinal: null,
    ajuste: null,
    notas: [],
    finalDecimal: null,
    finalDecimalNP: false,
    sugeridaRedondeada: null,
    finalActa: null,
  };
}

/** ¿La nota es numérica (no NP ni null)? */
export function esNumerica(n: NotaParcial): n is number {
  return typeof n === "number";
}

/** Indica si el alumno debe presentar examen final según P1 */
export function debeExamenFinal(p1: NotaParcial): boolean {
  if (p1 === "NP" || p1 === null) return true;
  return p1 < PASSING_PARCIAL1;
}

/** Formatea una nota parcial para UI y reportes */
export function formatoNota(n: NotaParcial): string {
  if (n === "NP") return "NP";
  if (n === null || n === undefined) return "—";
  return n.toFixed(1);
}

/** Redondeo estándar (≥ .5 sube). Se usa solo como sugerencia. */
export function redondeoSugerido(n: number): number {
  return Math.round(n);
}

/**
 * Calcula los campos derivados de una calificación según la regla:
 *  - Si P1 >= 7 y existe P2 numérico: final = (P1+P2)/2 + ajuste
 *  - Si P1 < 7, P1 = NP o P1 = null: final = examenFinal + ajuste
 *  - Si falta dato requerido: finalDecimal = null (pendiente)
 *  - Si el dato requerido es NP: finalDecimalNP = true, finalDecimal = 0
 */
export function calcularDerivados(c: Calificaciones): Calificaciones {
  const ajuste = c.ajuste ?? 0;
  let finalDecimal: number | null = null;
  let finalDecimalNP = false;

  if (c.parcial1 !== null && c.parcial1 !== "NP" && c.parcial1 >= PASSING_PARCIAL1) {
    if (c.parcial2 === "NP") {
      finalDecimalNP = true;
      finalDecimal = 0;
    } else if (esNumerica(c.parcial2)) {
      finalDecimal = (c.parcial1 + c.parcial2) / 2 + ajuste;
    } else {
      finalDecimal = null;
    }
  } else {
    if (c.examenFinal === "NP") {
      finalDecimalNP = true;
      finalDecimal = 0;
    } else if (esNumerica(c.examenFinal)) {
      finalDecimal = c.examenFinal + ajuste;
    } else {
      finalDecimal = null;
    }
  }

  if (finalDecimal !== null) {
    finalDecimal = Math.max(0, Math.min(10, finalDecimal));
  }

  const sugeridaRedondeada =
    finalDecimal === null ? null : redondeoSugerido(finalDecimal);

  return {
    ...c,
    finalDecimal,
    finalDecimalNP,
    sugeridaRedondeada,
    finalActa: c.finalActa ?? sugeridaRedondeada,
  };
}

/** Valida consistencia y devuelve advertencias (para UI) */
export function validar(c: Calificaciones): string[] {
  const w: string[] = [];
  if (c.parcial1 !== null && c.parcial1 !== "NP" && c.parcial1 >= PASSING_PARCIAL1) {
    if (c.examenFinal !== null && c.examenFinal !== "NP") {
      w.push("P1 ≥ 7: el examen final no se promedia, se ignora.");
    }
  } else if (c.parcial1 !== null) {
    if (c.parcial2 !== null && c.parcial2 !== "NP") {
      w.push("P1 < 7 o NP: el segundo parcial no aplica, se ignora.");
    }
  }
  return w;
}

export function estatusFila(c: Calificaciones):
  | "promediado"
  | "final"
  | "pendiente"
  | "NP" {
  if (c.finalDecimalNP) return "NP";
  if (c.finalDecimal === null) return "pendiente";
  if (c.parcial1 !== null && c.parcial1 !== "NP" && c.parcial1 >= PASSING_PARCIAL1) {
    return "promediado";
  }
  return "final";
}
