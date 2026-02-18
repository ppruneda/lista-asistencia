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

    const { students } = await request.json();

    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json(
        { error: "No hay alumnos para subir" },
        { status: 400 }
      );
    }

    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    // Process in batches of 500 (Firestore limit)
    const batchSize = 500;
    for (let i = 0; i < students.length; i += batchSize) {
      const chunk = students.slice(i, i + batchSize);
      const batch = adminDb.batch();

      for (const student of chunk) {
        const { cuenta, name } = student;

        // Validate
        if (!cuenta || !/^\d{8,10}$/.test(cuenta)) {
          errors.push(`Cuenta inválida: ${cuenta}`);
          continue;
        }
        if (!name || name.trim().length < 2) {
          errors.push(`Nombre inválido para cuenta ${cuenta}`);
          continue;
        }

        const ref = adminDb.collection("students").doc(cuenta);
        const existing = await ref.get();

        if (existing.exists) {
          // Update name only, keep fingerprints and history
          batch.update(ref, { name: name.trim() });
          updated++;
        } else {
          // Create new student
          batch.set(ref, {
            cuenta,
            name: name.trim(),
            registeredAt: new Date(),
            registeredVia: "csv",
            fingerprints: [],
            active: true,
          });
          created++;
        }
      }

      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      created,
      updated,
      errors,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Error al subir alumnos" },
      { status: 500 }
    );
  }
}
