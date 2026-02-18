import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("__session");
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await adminAuth.verifyIdToken(sessionCookie.value);

    const { keepStudents } = await request.json();

    // Delete all records
    const records = await adminDb.collection("records").get();
    const batch1Size = records.docs.length;
    for (let i = 0; i < records.docs.length; i += 500) {
      const batch = adminDb.batch();
      records.docs.slice(i, i + 500).forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }

    // Delete all sessions
    const sessions = await adminDb.collection("sessions").get();
    const batch2Size = sessions.docs.length;
    for (let i = 0; i < sessions.docs.length; i += 500) {
      const batch = adminDb.batch();
      sessions.docs.slice(i, i + 500).forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }

    let batch3Size = 0;
    if (!keepStudents) {
      const students = await adminDb.collection("students").get();
      batch3Size = students.docs.length;
      for (let i = 0; i < students.docs.length; i += 500) {
        const batch = adminDb.batch();
        students.docs.slice(i, i + 500).forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
      }
    } else {
      const students = await adminDb.collection("students").get();
      for (let i = 0; i < students.docs.length; i += 500) {
        const batch = adminDb.batch();
        students.docs.slice(i, i + 500).forEach((doc) => {
          batch.update(doc.ref, { fingerprints: [] });
        });
        await batch.commit();
      }
    }

    return NextResponse.json({
      success: true,
      deleted: {
        records: batch1Size,
        sessions: batch2Size,
        students: keepStudents ? 0 : batch3Size,
      },
    });
  } catch (error) {
    console.error("Reset error:", error);
    return NextResponse.json(
      { error: "Error al reiniciar" },
      { status: 500 }
    );
  }
}
