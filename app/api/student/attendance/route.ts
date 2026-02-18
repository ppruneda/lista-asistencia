import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cuenta = searchParams.get("cuenta");

    if (!cuenta || !/^\d{8,10}$/.test(cuenta)) {
      return NextResponse.json(
        { exists: false, message: "Cuenta inválida" },
        { status: 400 }
      );
    }

    // Check if student exists
    const studentDoc = await adminDb.collection("students").doc(cuenta).get();
    if (!studentDoc.exists) {
      return NextResponse.json({ exists: false });
    }

    const studentData = studentDoc.data()!;

    // Calculate attendance
    const allRecords = await adminDb
      .collection("records")
      .where("cuenta", "==", cuenta)
      .get();

    const closedSessions = await adminDb
      .collection("sessions")
      .where("phase", "==", "closed")
      .get();

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
    const percentage =
      total > 0
        ? Math.round(((attended + partial * 0.5) / total) * 100)
        : 100;

    const totalClasses = 30;
    const currentCredits = attended + partial * 0.5;
    const maxMissable = totalClasses - Math.ceil(totalClasses * 0.8);
    const currentMissed = total - currentCredits;
    const remainingAbsences = Math.max(0, Math.floor(maxMissable - currentMissed));

    return NextResponse.json({
      exists: true,
      name: studentData.name,
      attended,
      partial,
      total,
      percentage,
      remainingAbsences,
    });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json(
      { exists: false, error: "Error al consultar" },
      { status: 500 }
    );
  }
}
