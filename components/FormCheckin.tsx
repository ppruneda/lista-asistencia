"use client";

import { useState, useEffect, useCallback } from "react";
import { generateFingerprint } from "@/lib/antifraude";

interface FormCheckinProps {
  sessionId: string;
  phase: "entrada" | "salida";
  label: string;
}

interface StudentInfo {
  exists: boolean;
  name?: string;
  attended?: number;
  partial?: number;
  total?: number;
  percentage?: number;
  remainingAbsences?: number;
}

export default function FormCheckin({ sessionId, phase, label }: FormCheckinProps) {
  const [codigo, setCodigo] = useState("");
  const [cuenta, setCuenta] = useState("");
  const [fingerprint, setFingerprint] = useState("");
  const [loading, setLoading] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    const fp = generateFingerprint();
    setFingerprint(fp);
  }, []);

  const fetchStudent = useCallback(async (cuentaValue: string) => {
    if (!/^\d{8,10}$/.test(cuentaValue)) {
      setStudentInfo(null);
      setConfirmed(false);
      return;
    }
    setLookingUp(true);
    try {
      const response = await fetch(`/api/student/attendance?cuenta=${cuentaValue}`);
      const data = await response.json();
      setStudentInfo(data);
      setConfirmed(false);
    } catch {
      setStudentInfo(null);
    } finally {
      setLookingUp(false);
    }
  }, []);

  useEffect(() => {
    if (cuenta.length >= 8) {
      fetchStudent(cuenta);
    } else {
      setStudentInfo(null);
      setConfirmed(false);
    }
  }, [cuenta, fetchStudent]);

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
          fingerprint,
          sessionId,
          phase,
        }),
      });

      const data = await response.json();
      setResult({ success: data.success, message: data.message });

      if (data.success && data.attendance) {
        setStudentInfo({
          exists: true,
          name: studentInfo?.name,
          attended: data.attendance.attended,
          partial: data.attendance.partial,
          total: data.attendance.total,
          percentage: data.attendance.percentage,
        });
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

  const canSubmit =
    codigo.length === 8 &&
    cuenta.length >= 8 &&
    studentInfo?.exists &&
    confirmed &&
    !loading;

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

        {/* Student lookup result */}
        {lookingUp && cuenta.length >= 8 && (
          <div className="text-center text-gray-400 text-sm py-2">
            Buscando alumno...
          </div>
        )}

        {studentInfo && !studentInfo.exists && cuenta.length >= 8 && !lookingUp && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-red-700 font-medium text-sm">
              ❌ Número de cuenta no encontrado
            </p>
            <p className="text-red-600 text-xs mt-1">
              Tu cuenta debe estar registrada previamente. Si crees que es un error, contacta al profesor.
            </p>
          </div>
        )}

        {studentInfo?.exists && studentInfo.name && !confirmed && !lookingUp && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-blue-800 text-sm text-center mb-3">
              ¿Eres tú?
            </p>
            <p className="text-blue-900 font-bold text-lg text-center mb-3">
              {studentInfo.name}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmed(true)}
                className="flex-1 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 text-sm"
              >
                ✅ Sí, soy yo
              </button>
              <button
                type="button"
                onClick={() => {
                  setCuenta("");
                  setStudentInfo(null);
                  setConfirmed(false);
                }}
                className="flex-1 py-2 bg-red-100 text-red-700 font-bold rounded-lg hover:bg-red-200 text-sm"
              >
                ❌ No, corregir
              </button>
            </div>
          </div>
        )}

        {confirmed && studentInfo?.exists && studentInfo.name && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
            <p className="text-green-700 text-sm">
              ✅ <span className="font-bold">{studentInfo.name}</span>
            </p>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full py-4 bg-navy text-cream font-bold text-lg rounded-xl hover:bg-opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading
            ? "Registrando..."
            : `Registrar ${phase === "entrada" ? "Entrada" : "Salida"}`}
        </button>

        {!studentInfo?.exists && cuenta.length >= 8 && !lookingUp && (
          <p className="text-center text-gray-400 text-xs">
            Debes estar registrado para tomar asistencia
          </p>
        )}
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
      {studentInfo?.exists && studentInfo.total !== undefined && studentInfo.total > 0 && (
        <div className="mt-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 text-center mb-2">
            Tu asistencia acumulada
          </p>
          <p
            className={`text-4xl font-bold text-center ${getPercentageColor(
              studentInfo.percentage || 0
            )}`}
          >
            {studentInfo.percentage}%
          </p>
          <p className="text-sm text-gray-500 text-center mt-1">
            {studentInfo.attended} completa{studentInfo.attended !== 1 ? "s" : ""},{" "}
            {studentInfo.partial} parcial{studentInfo.partial !== 1 ? "es" : ""} de{" "}
            {studentInfo.total} clase{studentInfo.total !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
