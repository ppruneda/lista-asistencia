"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import FormCheckin from "@/components/FormCheckin";

interface ActiveSession {
  active: boolean;
  sessionId?: string;
  phase?: "entrada" | "salida";
  label?: string;
}

export default function AlumnoPage() {
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch("/api/session/active");
        const data = await response.json();
        setSession(data);
      } catch {
        setSession({ active: false });
      } finally {
        setLoading(false);
      }
    }

    checkSession();

    // Poll every 10 seconds to detect when a session starts
    const interval = setInterval(checkSession, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-cream px-4">
        <p className="text-navy/60 text-lg">Buscando clase activa...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream px-4 py-8">
      {session?.active && session.sessionId && session.phase && session.label ? (
        <FormCheckin
          sessionId={session.sessionId}
          phase={session.phase}
          label={session.label}
        />
      ) : (
        <div className="max-w-sm mx-auto text-center pt-20">
          <div className="bg-white rounded-xl p-8 shadow-sm">
            <p className="text-5xl mb-4">📚</p>
            <h2 className="text-xl font-bold text-navy mb-2">
              No hay clase en curso
            </h2>
            <p className="text-gray-500 text-sm">
              Cuando el profesor inicie la clase, esta página se actualizará
              automáticamente.
            </p>
          </div>
        </div>
      )}

      <div className="text-center mt-8">
        <Link
          href="/"
          className="text-sm text-gray-400 hover:text-navy transition-colors"
        >
          ← Volver al inicio
        </Link>
      </div>
    </main>
  );
}
