import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cuenta = searchParams.get("cuenta");

    if (!cuenta || !/^\d{8,10}$/.test(cuenta)) {
      return NextResponse.json(
        { error: "Número de cuenta inválido" },
        { status: 400 }
      );
    }

    // Check if student exists
    const studentDoc = await adminDb.collection("students").doc(cuenta).get();
    if (!studentDoc.exists) {
      return NextResponse.json({ exists: false });
    }

    const studentData = studentDoc.data()!;

    // Get all records for this student
    const recordsSnap = await adminDb
      .collection("records")
      .where("cuenta", "==", cuenta)
      .get();

    // Get closed sessions count
    const closedSnap = await adminDb
      .collection("sessions")
      .where("phase", "==", "closed")
      .get();

    const totalClosed = closedSnap.size;

    // Group records by session
    const sessionMap = new Map<string, Set<string>>();
    recordsSnap.docs.forEach((doc) => {
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

    const missed = Math.max(0, totalClosed - attended - partial);
    const percentage =
      totalClosed > 0
        ? Math.round(((attended + partial * 0.5) / totalClosed) * 100)
        : 100;

    // Calculate remaining absences (assuming 30 total classes and 80% minimum)
    const totalClasses = 30;
    const minRequired = Math.ceil(totalClasses * 0.8);
    const currentCredits = attended + partial * 0.5;
    const remainingAbsences = Math.max(
      0,
      Math.floor(totalClasses - minRequired - (totalClosed - currentCredits))
    );

    return NextResponse.json({
      exists: true,
      name: studentData.name,
      attended,
      partial,
      missed,
      total: totalClosed,
      percentage,
      remainingAbsences,
    });
  } catch (error) {
    console.error("Student attendance error:", error);
    return NextResponse.json(
      { error: "Error del servidor" },
      { status: 500 }
    );
  }
}
