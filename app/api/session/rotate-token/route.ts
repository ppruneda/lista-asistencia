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

    await adminAuth.verifyIdToken(sessionCookie.value);

    const { sessionId } = await request.json();
    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId requerido" },
        { status: 400 }
      );
    }

    const token = generateToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 120 * 1000); // 2 minutos

    await adminDb.collection("sessions").doc(sessionId).update({
      activeToken: token,
      tokenExpiresAt: expiresAt,
    });

    return NextResponse.json({
      success: true,
      token,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Error rotating token:", error);
    return NextResponse.json(
      { error: "Error al rotar el token" },
      { status: 500 }
    );
  }
}
