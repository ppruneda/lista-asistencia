import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    // Verify professor auth
    const sessionCookie = request.cookies.get("__session");
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await adminAuth.verifyIdToken(sessionCookie.value);

    const { sessionId } = await request.json();
    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId requerido" },
        { status: 400 }
      );
    }

    await adminDb.collection("sessions").doc(sessionId).update({
      phase: "closed",
      closedAt: new Date(),
      activeToken: "",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error closing session:", error);
    return NextResponse.json(
      { error: "Error al cerrar la sesión" },
      { status: 500 }
    );
  }
}
