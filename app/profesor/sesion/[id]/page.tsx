"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useRealtimeSession } from "@/hooks/useRealtimeSession";
import CodigoRotativo from "@/components/CodigoRotativo";

export default function SessionProjectorPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const { session, entradaCount, salidaCount, loading } = useRealtimeSession(sessionId);
  const [changingPhase, setChangingPhase] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [closing, setClosing] = useState(false);

  async function handleChangePhase() {
    if (!session || changingPhase) return;
    setChangingPhase(true);
    const newPhase = session.phase === "entrada" ? "salida" : "entrada";
    try {
      const response = await fetch("/api/session/change-phase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, phase: newPhase }),
      });
      const data = await response.json();
      if (!data.success) console.error("Error changing phase:", data.error);
    } catch (err) { console.error("Error changing phase:", err); }
    finally { setChangingPhase(false); }
  }

  async function handleClose() {
    if (closing) return;
    setClosing(true);
    try {
      const response = await fetch("/api/session/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await response.json();
      if (data.success) router.push("/profesor");
    } catch (err) { console.error("Error closing session:", err); }
    finally { setClosing(false); }
  }

  if (loading) {
    return (<div className="min-h-screen bg-[#001229] flex items-center justify-center"><p className="text-white/60 text-xl">Cargando sesión...</p></div>);
  }
  if (!session) {
    return (<div className="min-h-screen bg-[#001229] flex flex-col items-center justify-center gap-4"><p className="text-white/60 text-xl">Sesión no encontrada</p><button onClick={() => router.push("/profesor")} className="text-gold hover:text-white">← Volver al dashboard</button></div>);
  }
  if (session.phase === "closed") {
    return (<div className="min-h-screen bg-[#001229] flex flex-col items-center justify-center gap-4"><p className="text-white/60 text-xl">Esta sesión ya fue cerrada</p><button onClick={() => router.push(`/profesor/sesion/${sessionId}/detalle`)} className="px-6 py-3 bg-gold text-navy font-bold rounded-lg">Ver detalle</button></div>);
  }

  return (
    <div className="min-h-screen bg-[#001229] flex flex-col">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-white font-bold text-xl">{session.label}</h1>
          <p className="text-white/40 text-sm">{session.date.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}</p>
        </div>
        <div className="flex gap-6 text-center">
          <div><p className="text-3xl font-bold text-green-400 font-mono">{entradaCount}</p><p className="text-white/40 text-xs">Entradas</p></div>
          <div><p className="text-3xl font-bold text-yellow-400 font-mono">{salidaCount}</p><p className="text-white/40 text-xs">Salidas</p></div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center px-4">
        <CodigoRotativo sessionId={sessionId} initialToken={session.activeToken} phase={session.phase as "entrada" | "salida"} />
      </div>
      <div className="px-6 py-4 border-t border-white/10">
        <div className="flex items-center justify-center gap-4 max-w-lg mx-auto">
          <button onClick={handleChangePhase} disabled={changingPhase} className={`flex-1 py-3 px-6 font-bold rounded-lg transition-colors ${session.phase === "entrada" ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30" : "bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"} disabled:opacity-50`}>
            {changingPhase ? "Cambiando..." : session.phase === "entrada" ? "Cambiar a Salida →" : "← Cambiar a Entrada"}
          </button>
          {!showCloseConfirm ? (
            <button onClick={() => setShowCloseConfirm(true)} className="py-3 px-6 bg-red-500/20 text-red-400 border border-red-500/30 font-bold rounded-lg hover:bg-red-500/30 transition-colors">Cerrar Clase</button>
          ) : (
            <div className="flex gap-2">
              <button onClick={handleClose} disabled={closing} className="py-3 px-4 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50">{closing ? "Cerrando..." : "Sí, cerrar"}</button>
              <button onClick={() => setShowCloseConfirm(false)} className="py-3 px-4 bg-white/10 text-white rounded-lg hover:bg-white/20">Cancelar</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
