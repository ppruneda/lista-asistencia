import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("__session");
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await adminAuth.verifyIdToken(sessionCookie.value);

    const { sessionId, skipSalida } = await request.json();
    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId requerido" },
        { status: 400 }
      );
    }

    // If skipping salida, auto-create salida records for all students
    // who registered entrada, so they get full attendance
    if (skipSalida) {
      const entradaRecords = await adminDb
        .collection("records")
        .where("sessionId", "==", sessionId)
        .where("phase", "==", "entrada")
        .get();

      // Check which students already have salida
      const salidaRecords = await adminDb
        .collection("records")
        .where("sessionId", "==", sessionId)
        .where("phase", "==", "salida")
        .get();

      const salidaCuentas = new Set(
        salidaRecords.docs.map((d) => d.data().cuenta)
      );

      const batch = adminDb.batch();
      const now = new Date();

      entradaRecords.docs.forEach((doc) => {
        const data = doc.data();
        // Only create salida if student doesn't already have one
        if (!salidaCuentas.has(data.cuenta)) {
          const ref = adminDb.collection("records").doc();
          batch.set(ref, {
            sessionId,
            cuenta: data.cuenta,
            phase: "salida",
            timestamp: now,
            fingerprint: data.fingerprint,
            tokenUsed: "AUTO-CLOSE",
          });
        }
      });

      await batch.commit();
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
