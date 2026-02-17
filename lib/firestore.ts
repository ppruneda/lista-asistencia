import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Student, Session, AttendanceRecord } from "@/types";
// ============ STUDENTS ============
export async function getStudent(cuenta: string): Promise<Student | null> {
  try {
    const snap = await getDoc(doc(db, "students", cuenta));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      ...data,
      registeredAt: (data.registeredAt as Timestamp).toDate(),
    } as Student;
  } catch (e) {
    console.error("getStudent error:", e);
    return null;
  }
}
export async function getAllStudents(): Promise<Student[]> {
  try {
    const snap = await getDocs(collection(db, "students"));
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        ...data,
        cuenta: d.id,
        registeredAt: (data.registeredAt as Timestamp).toDate(),
      } as Student;
    });
  } catch (e) {
    console.error("getAllStudents error:", e);
    return [];
  }
}
export async function createStudent(data: Omit<Student, "registeredAt"> & { registeredAt?: Date }): Promise<boolean> {
  try {
    await setDoc(doc(db, "students", data.cuenta), {
      ...data,
      registeredAt: Timestamp.fromDate(data.registeredAt || new Date()),
    });
    return true;
  } catch (e) {
    console.error("createStudent error:", e);
    return false;
  }
}
export async function updateStudent(cuenta: string, data: Partial<Student>): Promise<boolean> {
  try {
    const updateData: Record<string, unknown> = { ...data };
    if (data.registeredAt) {
      updateData.registeredAt = Timestamp.fromDate(data.registeredAt);
    }
    await updateDoc(doc(db, "students", cuenta), updateData);
    return true;
  } catch (e) {
    console.error("updateStudent error:", e);
    return false;
  }
}
export async function batchCreateStudents(students: Student[]): Promise<boolean> {
  try {
    const batch = writeBatch(db);
    students.forEach((s) => {
      const ref = doc(db, "students", s.cuenta);
      batch.set(ref, {
        ...s,
        registeredAt: Timestamp.fromDate(s.registeredAt || new Date()),
      });
    });
    await batch.commit();
    return true;
  } catch (e) {
    console.error("batchCreateStudents error:", e);
    return false;
  }
}
// ============ SESSIONS ============
export async function createSession(data: Omit<Session, "id">): Promise<string | null> {
  try {
    const ref = doc(collection(db, "sessions"));
    await setDoc(ref, {
      ...data,
      date: Timestamp.fromDate(data.date),
      tokenExpiresAt: Timestamp.fromDate(data.tokenExpiresAt),
      closedAt: data.closedAt ? Timestamp.fromDate(data.closedAt) : null,
    });
    return ref.id;
  } catch (e) {
    console.error("createSession error:", e);
    return null;
  }
}
export async function getSession(id: string): Promise<Session | null> {
  try {
    const snap = await getDoc(doc(db, "sessions", id));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      ...data,
      id: snap.id,
      date: (data.date as Timestamp).toDate(),
      tokenExpiresAt: (data.tokenExpiresAt as Timestamp).toDate(),
      closedAt: data.closedAt ? (data.closedAt as Timestamp).toDate() : undefined,
    } as Session;
  } catch (e) {
    console.error("getSession error:", e);
    return null;
  }
}
export async function getAllSessions(): Promise<Session[]> {
  try {
    const q = query(collection(db, "sessions"), orderBy("date", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        ...data,
        id: d.id,
        date: (data.date as Timestamp).toDate(),
        tokenExpiresAt: (data.tokenExpiresAt as Timestamp).toDate(),
        closedAt: data.closedAt ? (data.closedAt as Timestamp).toDate() : undefined,
      } as Session;
    });
  } catch (e) {
    console.error("getAllSessions error:", e);
    return [];
  }
}
export async function updateSession(id: string, data: Partial<Session>): Promise<boolean> {
  try {
    const updateData: Record<string, unknown> = { ...data };
    if (data.date) updateData.date = Timestamp.fromDate(data.date);
    if (data.tokenExpiresAt) updateData.tokenExpiresAt = Timestamp.fromDate(data.tokenExpiresAt);
    if (data.closedAt) updateData.closedAt = Timestamp.fromDate(data.closedAt);
    await updateDoc(doc(db, "sessions", id), updateData);
    return true;
  } catch (e) {
    console.error("updateSession error:", e);
    return false;
  }
}
export async function getActiveSession(): Promise<Session | null> {
  try {
    const q = query(collection(db, "sessions"), where("phase", "!=", "closed"));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    const data = d.data();
    return {
      ...data,
      id: d.id,
      date: (data.date as Timestamp).toDate(),
      tokenExpiresAt: (data.tokenExpiresAt as Timestamp).toDate(),
      closedAt: data.closedAt ? (data.closedAt as Timestamp).toDate() : undefined,
    } as Session;
  } catch (e) {
    console.error("getActiveSession error:", e);
    return null;
  }
}
// ============ RECORDS ============
export async function createRecord(data: Omit<AttendanceRecord, "id">): Promise<string | null> {
  try {
    const ref = doc(collection(db, "records"));
    await setDoc(ref, {
      ...data,
      timestamp: Timestamp.fromDate(data.timestamp),
    });
    return ref.id;
  } catch (e) {
    console.error("createRecord error:", e);
    return null;
  }
}
export async function getRecordsBySession(sessionId: string): Promise<AttendanceRecord[]> {
  try {
    const q = query(collection(db, "records"), where("sessionId", "==", sessionId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        ...data,
        id: d.id,
        timestamp: (data.timestamp as Timestamp).toDate(),
      } as AttendanceRecord;
    });
  } catch (e) {
    console.error("getRecordsBySession error:", e);
    return [];
  }
}
export async function getRecordsByStudent(cuenta: string): Promise<AttendanceRecord[]> {
  try {
    const q = query(collection(db, "records"), where("cuenta", "==", cuenta));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        ...data,
        id: d.id,
        timestamp: (data.timestamp as Timestamp).toDate(),
      } as AttendanceRecord;
    });
  } catch (e) {
    console.error("getRecordsByStudent error:", e);
    return [];
  }
}
export async function getRecordBySessionAndStudent(
  sessionId: string,
  cuenta: string,
  phase: "entrada" | "salida"
): Promise<AttendanceRecord | null> {
  try {
    const q = query(
      collection(db, "records"),
      where("sessionId", "==", sessionId),
      where("cuenta", "==", cuenta),
      where("phase", "==", phase)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    const data = d.data();
    return {
      ...data,
      id: d.id,
      timestamp: (data.timestamp as Timestamp).toDate(),
    } as AttendanceRecord;
  } catch (e) {
    console.error("getRecordBySessionAndStudent error:", e);
    return null;
  }
}
