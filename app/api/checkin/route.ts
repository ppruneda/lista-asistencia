import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, cuenta, name, fingerprint, sessionId, phase } = body;

    // Basic field validation
    if (!token || !cuenta || !fingerprint || !sessionId || !phase) {
      return NextResponse.json(
        { success: false, message: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // 1. Session exists and is not closed
    const sessionDoc = await adminDb.collection("sessions").doc(sessionId).get();
    if (!sessionDoc.exists) {
      return NextResponse.json(
        { success: false, message: "Sesión no encontrada o cerrada" },
        { status: 400 }
      );
    }
    const sessionData = sessionDoc.data()!;
    if (sessionData.phase === "closed") {
      return NextResponse.json(
        { success: false, message: "Esta sesión ya fue cerrada" },
        { status: 400 }
      );
    }

    // 2. Phase matches
    if (sessionData.phase !== phase) {
      return NextResponse.json(
        {
          success: false,
          message: `La clase está en fase de ${sessionData.phase}, no ${phase}`,
        },
        { status: 400 }
      );
    }

    // 3. Token matches
    if (sessionData.activeToken !== token) {
      return NextResponse.json(
        { success: false, message: "Código inválido o expirado" },
        { status: 400 }
      );
    }

    // 4. Token not expired
    const tokenExpiry = sessionData.tokenExpiresAt.toDate
      ? sessionData.tokenExpiresAt.toDate()
      : new Date(sessionData.tokenExpiresAt);
    if (new Date() > tokenExpiry) {
      return NextResponse.json(
        { success: false, message: "Código expirado, espera el siguiente" },
        { status: 400 }
      );
    }

    // 5. Cuenta is numeric and 8-10 digits
    if (!/^\d{8,10}$/.test(cuenta)) {
      return NextResponse.json(
        { success: false, message: "Número de cuenta inválido (debe tener 8-10 dígitos)" },
        { status: 400 }
      );
    }

    // 6. No duplicate record (same session + cuenta + phase)
    const duplicateSnap = await adminDb
      .collection("records")
      .where("sessionId", "==", sessionId)
      .where("cuenta", "==", cuenta)
      .where("phase", "==", phase)
      .limit(1)
      .get();
    if (!duplicateSnap.empty) {
      return NextResponse.json(
        {
          success: false,
          message: `Ya registraste tu ${phase}`,
        },
        { status: 400 }
      );
    }

    // 7. No same device with different account in same session+phase
    const deviceSnap = await adminDb
      .collection("records")
      .where("sessionId", "==", sessionId)
      .where("phase", "==", phase)
      .where("fingerprint", "==", fingerprint)
      .limit(1)
      .get();
    if (!deviceSnap.empty) {
      const existingRecord = deviceSnap.docs[0].data();
      if (existingRecord.cuenta !== cuenta) {
        return NextResponse.json(
          {
            success: false,
            message: "Este dispositivo ya registró otra cuenta en esta sesión",
          },
          { status: 400 }
        );
      }
    }

    // 8. Check student and fingerprint
    const studentDoc = await adminDb.collection("students").doc(cuenta).get();

    if (studentDoc.exists) {
      const studentData = studentDoc.data()!;
      const fingerprints: string[] = studentData.fingerprints || [];

      if (fingerprints.length >= 2 && !fingerprints.includes(fingerprint)) {
        return NextResponse.json(
          {
            success: false,
            message: "Dispositivo no reconocido. Contacta al profesor.",
          },
          { status: 400 }
        );
      }

      // Add fingerprint if new and under limit
      if (!fingerprints.includes(fingerprint) && fingerprints.length < 2) {
        await adminDb
          .collection("students")
          .doc(cuenta)
          .update({
            fingerprints: [...fingerprints, fingerprint],
          });
      }
    } else {
      // Student doesn't exist — need name for registration
      if (!name || name.trim().length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Primera vez registrándote. Incluye tu nombre completo.",
            needsName: true,
          },
          { status: 400 }
        );
      }

      // Create student
      await adminDb.collection("students").doc(cuenta).set({
        cuenta,
        name: name.trim(),
        registeredAt: new Date(),
        registeredVia: "self",
        fingerprints: [fingerprint],
        active: true,
      });
    }

    // Create attendance record
    const recordRef = adminDb.collection("records").doc();
    await recordRef.set({
      sessionId,
      cuenta,
      phase,
      timestamp: new Date(),
      fingerprint,
      tokenUsed: token,
    });

    // Calculate student attendance
    const allRecords = await adminDb
      .collection("records")
      .where("cuenta", "==", cuenta)
      .get();

    const closedSessions = await adminDb
      .collection("sessions")
      .where("phase", "==", "closed")
      .get();

    // Count sessions with both entrada and salida
    const sessionMap = new Map<string, Set<string>>();
    allRecords.docs.forEach((doc) => {
      const data = doc.data();
      if (!sessionMap.has(data.sessionId)) {
        sessionMap.set(data.sessionId, new Set());
      }
      sessionMap.get(data.sessionId)!.add(data.phase);
    });

    let attended = 0;
    let partial = 0;
    sessionMap.forEach((phases) => {
      if (phases.has("entrada") && phases.has("salida")) {
        attended++;
      } else {
        partial++;
      }
    });

    const total = closedSessions.size;
    const percentage = total > 0 ? Math.round(((attended + partial * 0.5) / total) * 100) : 100;

    const phaseLabel = phase === "entrada" ? "Entrada" : "Salida";

    return NextResponse.json({
      success: true,
      message: `${phaseLabel} registrada correctamente`,
      attendance: {
        attended,
        partial,
        total,
        percentage,
      },
    });
  } catch (error) {
    console.error("Checkin error:", error);
    return NextResponse.json(
      { success: false, message: "Error del servidor. Intenta de nuevo." },
      { status: 500 }
    );
  }
}
