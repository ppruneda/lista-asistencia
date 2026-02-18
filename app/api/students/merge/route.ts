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

    const { fromCuenta, toCuenta } = await request.json();

    if (!fromCuenta || !toCuenta) {
      return NextResponse.json(
        { error: "Se requieren ambas cuentas" },
        { status: 400 }
      );
    }

    if (fromCuenta === toCuenta) {
      return NextResponse.json(
        { error: "Las cuentas deben ser diferentes" },
        { status: 400 }
      );
    }

    // Verify target student exists
    const targetDoc = await adminDb.collection("students").doc(toCuenta).get();
    if (!targetDoc.exists) {
      return NextResponse.json(
        { error: `La cuenta destino ${toCuenta} no existe` },
        { status: 400 }
      );
    }

    // Get all records from source account
    const recordsSnap = await adminDb
      .collection("records")
      .where("cuenta", "==", fromCuenta)
      .get();

    if (recordsSnap.empty) {
      return NextResponse.json(
        { error: `No hay registros para la cuenta ${fromCuenta}` },
        { status: 400 }
      );
    }

    // Transfer records to target account
    const batch = adminDb.batch();
    let transferred = 0;

    for (const doc of recordsSnap.docs) {
      // Check if target already has a record for this session+phase
      const existing = await adminDb
        .collection("records")
        .where("sessionId", "==", doc.data().sessionId)
        .where("cuenta", "==", toCuenta)
        .where("phase", "==", doc.data().phase)
        .limit(1)
        .get();

      if (existing.empty) {
        // Transfer the record
        batch.update(doc.ref, { cuenta: toCuenta });
        transferred++;
      } else {
        // Delete duplicate
        batch.delete(doc.ref);
      }
    }

    // Delete the source student if it exists
    const sourceDoc = await adminDb.collection("students").doc(fromCuenta).get();
    if (sourceDoc.exists) {
      batch.delete(sourceDoc.ref);
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      transferred,
      message: `${transferred} registro(s) transferidos de ${fromCuenta} a ${toCuenta}. La cuenta ${fromCuenta} fue eliminada.`,
    });
  } catch (error) {
    console.error("Merge error:", error);
    return NextResponse.json(
      { error: "Error al fusionar registros" },
      { status: 500 }
    );
  }
}
