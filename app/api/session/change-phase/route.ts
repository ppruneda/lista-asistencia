import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

function generateToken(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let token = "";
  for (let i = 0; i < 8; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export async function POST(request: NextRequest) {
  try {
    // Verify professor auth
    const sessionCookie = request.cookies.get("__session");
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await adminAuth.verifyIdToken(sessionCookie.value);

    const { sessionId, phase } = await request.json();

    if (!sessionId || !phase) {
      return NextResponse.json(
        { error: "sessionId y phase requeridos" },
        { status: 400 }
      );
    }

    if (phase !== "entrada" && phase !== "salida") {
      return NextResponse.json(
        { error: "phase debe ser 'entrada' o 'salida'" },
        { status: 400 }
      );
    }

    // Generate new token for the new phase
    const token = generateToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 1000);

    await adminDb.collection("sessions").doc(sessionId).update({
      phase,
      activeToken: token,
      tokenExpiresAt: expiresAt,
    });

    return NextResponse.json({
      success: true,
      phase,
      token,
    });
  } catch (error) {
    console.error("Error changing phase:", error);
    return NextResponse.json(
      { error: "Error al cambiar la fase" },
      { status: 500 }
    );
  }
}
