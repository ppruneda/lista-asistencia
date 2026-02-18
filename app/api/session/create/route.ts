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
    const sessionCookie = request.cookies.get("__session");
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(sessionCookie.value);
    const uid = decoded.uid;

    const sessionsSnap = await adminDb.collection("sessions").get();
    const sessionNumber = sessionsSnap.size + 1;

    const token = generateToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 120 * 1000); // 2 minutos

    const sessionRef = adminDb.collection("sessions").doc();
    await sessionRef.set({
      label: `Clase ${sessionNumber}`,
      number: sessionNumber,
      date: now,
      phase: "entrada",
      activeToken: token,
      tokenExpiresAt: expiresAt,
      createdBy: uid,
      closedAt: null,
    });

    return NextResponse.json({
      success: true,
      sessionId: sessionRef.id,
      token,
    });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Error al crear la sesión" },
      { status: 500 }
    );
  }
}
