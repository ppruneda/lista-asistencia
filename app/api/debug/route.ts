import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const allSessions = await adminDb.collection("sessions").get();
    
    const sessions = allSessions.docs.map((doc) => ({
      id: doc.id,
      phase: doc.data().phase,
      label: doc.data().label,
      activeToken: doc.data().activeToken ? "yes" : "no",
    }));

    return NextResponse.json({
      totalSessions: sessions.length,
      sessions,
    }, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
