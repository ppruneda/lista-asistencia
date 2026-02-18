import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const allSessions = await adminDb.collection("sessions").get();
    
    let activeSession = null;
    
    for (const doc of allSessions.docs) {
      const data = doc.data();
      if (data.phase === "entrada" || data.phase === "salida") {
        activeSession = { id: doc.id, ...data };
        break;
      }
    }

    if (!activeSession) {
      return NextResponse.json({ active: false }, {
        headers: { "Cache-Control": "no-store, max-age=0" },
      });
    }

    return NextResponse.json({
      active: true,
      sessionId: activeSession.id,
      phase: activeSession.phase,
      label: activeSession.label,
    }, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("Error getting active session:", error);
    return NextResponse.json(
      { error: "Error al buscar sesión activa" },
      { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }
}
