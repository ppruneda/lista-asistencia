"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Config {
  materiaName: string;
  totalClasses: number;
  semestre: string;
  profesorName: string;
}

export default function ConfiguracionPage() {
  const { user, loading: authLoading } = useAuth();
  const [config, setConfig] = useState<Config>({
    materiaName: "Sucesiones",
    totalClasses: 30,
    semestre: "2026-1",
    profesorName: "Prof. Pablo Pruneda",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  useEffect(() => {
    async function loadConfig() {
      try {
        const snap = await getDoc(doc(db, "config", "general"));
        if (snap.exists()) {
          const data = snap.data() as Config;
          setConfig(data);
        }
      } catch (err) {
        console.error("Error loading config:", err);
      } finally {
        setLoading(false);
      }
    }
    if (user) loadConfig();
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await setDoc(doc(db, "config", "general"), config);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Error saving config:", err);
      alert("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleReset(keepStudents: boolean) {
    const msg = keepStudents
      ? "Esto borrara TODAS las clases y registros de asistencia. Los alumnos se conservaran pero deberan registrar su dispositivo de nuevo."
      : "Esto borrara TODO: clases, registros y la lista de alumnos. No se puede deshacer.";
    if (!window.confirm(msg)) return;
    if (!window.confirm("ULTIMA CONFIRMACION: No hay forma de recuperar los datos.")) return;

    setResetting(true);
    setResetMessage("");
    try {
      const response = await fetch("/api/reset-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keepStudents }),
      });
      const result = await response.json();
      if (result.success) {
        setResetMessage(
          "Listo: " + result.deleted.sessions + " clases y " + result.deleted.records + " registros eliminados" +
          (result.deleted.students > 0 ? ", " + result.deleted.students + " alumnos eliminados" : ", alumnos conservados") +
          ". Listo para un nuevo curso!"
        );
      } else {
        setResetMessage("Error: " + (result.error || "No se pudo reiniciar"));
      }
    } catch {
      setResetMessage("Error de conexion");
    } finally {
      setResetting(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-navy/60 text-lg">Cargando configuracion...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-navy">Configuracion</h1>

      <form onSubmit={handleSave} className="bg-white rounded-xl p-6 shadow-sm space-y-5">
        <div>
          <label className="block text-sm font-medium text-navy mb-1">Nombre de la materia</label>
          <input type="text" value={config.materiaName} onChange={(e) => setConfig({ ...config, materiaName: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-navy focus:ring-2 focus:ring-gold focus:border-gold outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy mb-1">Total de clases del semestre</label>
          <input type="number" min="1" max="100" value={config.totalClasses} onChange={(e) => setConfig({ ...config, totalClasses: parseInt(e.target.value) || 30 })} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-navy focus:ring-2 focus:ring-gold focus:border-gold outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy mb-1">Semestre</label>
          <input type="text" value={config.semestre} onChange={(e) => setConfig({ ...config, semestre: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-navy focus:ring-2 focus:ring-gold focus:border-gold outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy mb-1">Nombre del profesor</label>
          <input type="text" value={config.profesorName} onChange={(e) => setConfig({ ...config, profesorName: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-navy focus:ring-2 focus:ring-gold focus:border-gold outline-none" />
        </div>
        <button type="submit" disabled={saving} className="w-full py-3 bg-navy text-cream font-bold rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50">
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
        {saved && <p className="text-green-600 text-sm text-center font-medium">Configuracion guardada</p>}
      </form>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-sm font-medium text-gray-500 mb-3">Informacion de la cuenta</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Email</span>
            <span className="text-navy font-mono">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">UID</span>
            <span className="text-navy font-mono text-xs">{user?.uid}</span>
          </div>
        </div>
      </div>

      <div className="bg-gold/10 border border-gold/30 rounded-xl p-4 text-sm text-navy">
        <p className="font-medium mb-1">Porcentaje minimo de asistencia</p>
        <p className="text-navy/70">El sistema usa un minimo de 80% para acreditar la materia.</p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-red-200">
        <h2 className="text-lg font-bold text-red-600 mb-2">Reiniciar curso</h2>
        <p className="text-gray-500 text-sm mb-4">Usa estas opciones al terminar un semestre para empezar de nuevo. No se puede deshacer.</p>
        <div className="space-y-3">
          <button onClick={() => handleReset(true)} disabled={resetting} className="w-full py-3 bg-yellow-500 text-white font-bold rounded-lg hover:bg-yellow-600 disabled:opacity-50 text-sm">
            {resetting ? "Reiniciando..." : "Nuevo semestre (conservar alumnos)"}
          </button>
          <p className="text-xs text-gray-400 text-center">Borra clases y registros. Conserva la lista de alumnos.</p>
          <button onClick={() => handleReset(false)} disabled={resetting} className="w-full py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm">
            {resetting ? "Reiniciando..." : "Borrar todo y empezar de cero"}
          </button>
          <p className="text-xs text-gray-400 text-center">Borra clases, registros y todos los alumnos.</p>
        </div>
        {resetMessage && <div className="mt-4 p-3 rounded-lg bg-gray-50 text-sm text-navy">{resetMessage}</div>}
      </div>
    </div>
  );
}
