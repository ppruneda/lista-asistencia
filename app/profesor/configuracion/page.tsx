"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import LoadingSpinner from "@/components/LoadingSpinner";

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
      alert("Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return <LoadingSpinner message="Cargando configuración..." />;
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-navy">Configuración</h1>

      <form onSubmit={handleSave} className="bg-white rounded-xl p-6 shadow-sm space-y-5">
        <div>
          <label className="block text-sm font-medium text-navy mb-1">
            Nombre de la materia
          </label>
          <input
            type="text"
            value={config.materiaName}
            onChange={(e) =>
              setConfig({ ...config, materiaName: e.target.value })
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-navy focus:ring-2 focus:ring-gold focus:border-gold outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-navy mb-1">
            Total de clases del semestre
          </label>
          <input
            type="number"
            min="1"
            max="100"
            value={config.totalClasses}
            onChange={(e) =>
              setConfig({
                ...config,
                totalClasses: parseInt(e.target.value) || 30,
              })
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-navy focus:ring-2 focus:ring-gold focus:border-gold outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-navy mb-1">
            Semestre
          </label>
          <input
            type="text"
            value={config.semestre}
            onChange={(e) =>
              setConfig({ ...config, semestre: e.target.value })
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-navy focus:ring-2 focus:ring-gold focus:border-gold outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-navy mb-1">
            Nombre del profesor
          </label>
          <input
            type="text"
            value={config.profesorName}
            onChange={(e) =>
              setConfig({ ...config, profesorName: e.target.value })
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-navy focus:ring-2 focus:ring-gold focus:border-gold outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-navy text-cream font-bold rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>

        {saved && (
          <p className="text-green-600 text-sm text-center font-medium">
            ✅ Configuración guardada
          </p>
        )}
      </form>

      {/* Read-only account info */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-sm font-medium text-gray-500 mb-3">
          Información de la cuenta
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Email</span>
            <span className="text-navy font-mono">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">UID</span>
            <span className="text-navy font-mono text-xs">
              {user?.uid}
            </span>
          </div>
        </div>
      </div>

      {/* Note about minimum attendance */}
      <div className="bg-gold/10 border border-gold/30 rounded-xl p-4 text-sm text-navy">
        <p className="font-medium mb-1">Porcentaje mínimo de asistencia</p>
        <p className="text-navy/70">
          El sistema usa un mínimo de 80% de asistencia para acreditar la
          materia. Este valor es fijo y se aplica automáticamente en los
          reportes y cálculos de estado (OK / Riesgo / Crítico).
        </p>
      </div>
    </div>
  );
}
