"use client";

import { useState, useEffect, useCallback } from "react";
import { generateFingerprint } from "@/lib/antifraude";

interface FormCheckinProps {
  sessionId: string;
  phase: "entrada" | "salida";
  label: string;
}

interface AttendanceInfo {
  name: string;
  attended: number;
  partial: number;
  total: number;
  percentage: number;
  remainingAbsences: number;
}

export default function FormCheckin({ sessionId, phase, label }: FormCheckinProps) {
  const [codigo, setCodigo] = useState("");
  const [cuenta, setCuenta] = useState("");
  const [nombre, setNombre] = useState("");
  const [fingerprint, setFingerprint] = useState("");
  const [showNombre, setShowNombre] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [attendance, setAttendance] = useState<AttendanceInfo | null>(null);

  // Generate fingerprint on mount
  useEffect(() => {
    const fp = generateFingerprint();
    setFingerprint(fp);
  }, []);

  // Fetch attendance when cuenta has 8+ digits
  const fetchAttendance = useCallback(async (cuentaValue: string) => {
    if (!/^\d{8,10}$/.test(cuentaValue)) {
      setAttendance(null);
      return;
    }
    try {
      const response = await fetch(
        `/api/student/attendance?cuenta=${cuentaValue}`
      );
      const data = await response.json();
      if (data.exists) {
        setAttendance(data);
        setShowNombre(false);
      } else {
        setAttendance(null);
        setShowNombre(true);
      }
    } catch {
      // Silently fail - not critical
    }
  }, []);

  useEffect(() => {
    if (cuenta.length >= 8) {
      fetchAttendance(cuenta);
    } else {
      setAttendance(null);
      setShowNombre(false);
    }
  }, [cuenta, fetchAttendance]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    setLoading(true);

    try {
      const response = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: codigo.toUpperCase().replace(/[^A-Z0-9]/g, ""),
          cuenta,
          name: showNombre ? nombre : undefined,
          fingerprint,
          sessionId,
          phase,
        }),
      });

      const data = await response.json();

      if (data.needsName) {
        setShowNombre(true);
        setResult({ success: false, message: data.message });
      } else {
        setResult({ success: data.success, message: data.message });
        if (data.success && data.attendance) {
          setAttendance({
            name: "",
            attended: data.attendance.attended,
            partial: data.attendance.partial,
            total: data.attendance.total,
            percentage: data.attendance.percentage,
            remainingAbsences: 0,
          });
        }
      }
    } catch {
      setResult({
        success: false,
        message: "Error de conexión. Verifica tu internet.",
      });
    } finally {
      setLoading(false);
    }
  }

  // Format codigo as user types (add dash after 4 chars)
  function handleCodigoChange(value: string) {
    const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (clean.length <= 8) {
      setCodigo(clean);
    }
  }

  const displayCodigo =
    codigo.length > 4
      ? codigo.slice(0, 4) + "-" + codigo.slice(4)
      : codigo;

  const getPercentageColor = (pct: number) => {
    if (pct >= 80) return "text-green-600";
    if (pct >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Session info */}
      <div className="text-center mb-6">
        <h2 className="text-lg font-bold text-navy">{label}</h2>
        <span
          className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${
            phase === "entrada"
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          Registrar {phase === "entrada" ? "Entrada" : "Salida"}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Codigo field */}
        <div>
          <label className="block text-sm font-medium text-navy mb-1">
            Código de clase
          </label>
          <input
            type="text"
            value={displayCodigo}
            onChange={(e) => handleCodigoChange(e.target.value)}
            placeholder="XXXX-XXXX"
            required
            autoComplete="off"
            className="w-full px-4 py-4 text-center text-2xl font-mono font-bold tracking-[0.15em] border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:border-gold outline-none text-navy uppercase"
          />
        </div>

        {/* Cuenta field */}
        <div>
          <label className="block text-sm font-medium text-navy mb-1">
            Número de cuenta UNAM
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={cuenta}
            onChange={(e) =>
              setCuenta(e.target.value.replace(/\D/g, "").slice(0, 10))
            }
            placeholder="Ej: 31612345"
            required
            autoComplete="off"
            className="w-full px-4 py-4 text-center text-xl font-mono border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:border-gold outline-none text-navy"
          />
        </div>

        {/* Nombre field (conditional) */}
        {showNombre && (
          <div>
            <label className="block text-sm font-medium text-navy mb-1">
              Nombre completo (primera vez)
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: García López María Fernanda"
              required={showNombre}
              className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:border-gold outline-none text-navy"
            />
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading || codigo.length < 8 || cuenta.length < 8}
          className="w-full py-4 bg-navy text-cream font-bold text-lg rounded-xl hover:bg-opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading
            ? "Registrando..."
            : `Registrar ${phase === "entrada" ? "Entrada" : "Salida"}`}
        </button>
      </form>

      {/* Result message */}
      {result && (
        <div
          className={`mt-4 p-4 rounded-xl text-center font-medium ${
            result.success
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {result.success ? "✅ " : "❌ "}
          {result.message}
        </div>
      )}

      {/* Attendance mini-card */}
      {attendance && attendance.total > 0 && (
        <div className="mt-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 text-center mb-2">
            Tu asistencia acumulada
          </p>
          <p
            className={`text-4xl font-bold text-center ${getPercentageColor(
              attendance.percentage
            )}`}
          >
            {attendance.percentage}%
          </p>
          <p className="text-sm text-gray-500 text-center mt-1">
            {attendance.attended} completa{attendance.attended !== 1 ? "s" : ""},{" "}
            {attendance.partial} parcial{attendance.partial !== 1 ? "es" : ""} de{" "}
            {attendance.total} clase{attendance.total !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
