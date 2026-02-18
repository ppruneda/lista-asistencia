import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    let snapshot = await adminDb
      .collection("sessions")
      .where("phase", "==", "entrada")
      .limit(1)
      .get();

    if (snapshot.empty) {
      snapshot = await adminDb
        .collection("sessions")
        .where("phase", "==", "salida")
        .limit(1)
        .get();
    }

    if (snapshot.empty) {
      return NextResponse.json({ active: false }, {
        headers: { "Cache-Control": "no-store, max-age=0" },
      });
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    return NextResponse.json({
      active: true,
      sessionId: doc.id,
      phase: data.phase,
      label: data.label,
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
