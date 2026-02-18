"use client";

import { useState, useEffect } from "react";
import { doc, collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Session } from "@/types";

export function useRealtimeSession(sessionId: string) {
  const [session, setSession] = useState<Session | null>(null);
  const [entradaCount, setEntradaCount] = useState(0);
  const [salidaCount, setSalidaCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    const sessionRef = doc(db, "sessions", sessionId);
    const unsubSession = onSnapshot(sessionRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setSession({
          id: snap.id,
          label: data.label,
          number: data.number,
          date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date),
          phase: data.phase,
          activeToken: data.activeToken,
          tokenExpiresAt: data.tokenExpiresAt instanceof Timestamp ? data.tokenExpiresAt.toDate() : new Date(data.tokenExpiresAt),
          createdBy: data.createdBy,
          closedAt: data.closedAt ? (data.closedAt instanceof Timestamp ? data.closedAt.toDate() : new Date(data.closedAt)) : undefined,
        });
      } else {
        setSession(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Session listener error:", error);
      setLoading(false);
    });
    const entradaQuery = query(collection(db, "records"), where("sessionId", "==", sessionId), where("phase", "==", "entrada"));
    const unsubEntrada = onSnapshot(entradaQuery, (snap) => { setEntradaCount(snap.size); });
    const salidaQuery = query(collection(db, "records"), where("sessionId", "==", sessionId), where("phase", "==", "salida"));
    const unsubSalida = onSnapshot(salidaQuery, (snap) => { setSalidaCount(snap.size); });
    return () => { unsubSession(); unsubEntrada(); unsubSalida(); };
  }, [sessionId]);

  return { session, entradaCount, salidaCount, loading };
}
