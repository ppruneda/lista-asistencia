import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const snapshot = await adminDb
      .collection("sessions")
      .where("phase", "!=", "closed")
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ active: false });
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    return NextResponse.json({
      active: true,
      sessionId: doc.id,
      phase: data.phase,
      label: data.label,
    });
  } catch (error) {
    console.error("Error getting active session:", error);
    return NextResponse.json(
      { error: "Error al buscar sesión activa" },
      { status: 500 }
    );
  }
}
