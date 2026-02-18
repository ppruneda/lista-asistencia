import type { AttendanceRecord, Session, Student, StudentReport } from "@/types";

interface AttendanceResult {
  attended: number;
  partial: number;
  missed: number;
  total: number;
  percentage: number;
}

interface ProjectionResult {
  current: number;
  bestCase: number;
  needed: number;
  remainingAbsences: number;
}

export function calculateAttendance(
  records: AttendanceRecord[],
  sessions: Session[],
  cuenta: string
): AttendanceResult {
  const closedSessions = sessions.filter((s) => s.phase === "closed");
  const total = closedSessions.length;

  if (total === 0) {
    return { attended: 0, partial: 0, missed: 0, total: 0, percentage: 100 };
  }

  // Group student's records by session
  const studentRecords = records.filter((r) => r.cuenta === cuenta);
  const sessionMap = new Map<string, Set<string>>();
  studentRecords.forEach((r) => {
    if (!sessionMap.has(r.sessionId)) {
      sessionMap.set(r.sessionId, new Set());
    }
    sessionMap.get(r.sessionId)!.add(r.phase);
  });

  let attended = 0;
  let partial = 0;

  // Only count closed sessions
  closedSessions.forEach((session) => {
    const phases = sessionMap.get(session.id);
    if (phases && phases.has("entrada") && phases.has("salida")) {
      attended++;
    } else if (phases && (phases.has("entrada") || phases.has("salida"))) {
      partial++;
    }
  });

  const missed = total - attended - partial;
  const percentage =
    total > 0 ? Math.round(((attended + partial * 0.5) / total) * 100) : 100;

  return { attended, partial, missed, total, percentage };
}

export function calculateProjection(
  attendance: AttendanceResult,
  totalClasses: number
): ProjectionResult {
  const currentCredits = attendance.attended + attendance.partial * 0.5;
  const current =
    totalClasses > 0
      ? Math.round((currentCredits / totalClasses) * 100)
      : 100;

  const remainingClasses = totalClasses - attendance.total;
  const bestCaseCredits = currentCredits + remainingClasses;
  const bestCase =
    totalClasses > 0
      ? Math.round((bestCaseCredits / totalClasses) * 100)
      : 100;

  const minRequired = Math.ceil(totalClasses * 0.8);
  const needed = Math.max(0, Math.ceil(minRequired - currentCredits));

  const maxMissable = totalClasses - minRequired;
  const currentMissed = attendance.total - currentCredits;
  const remainingAbsences = Math.max(
    0,
    Math.floor(maxMissable - currentMissed)
  );

  return { current, bestCase, needed, remainingAbsences };
}

export function getStudentStatus(
  percentage: number,
  bestCase: number
): "ok" | "risk" | "critical" {
  if (percentage >= 80) return "ok";
  if (bestCase >= 80) return "risk";
  return "critical";
}

export function generateFullReport(
  students: Student[],
  records: AttendanceRecord[],
  sessions: Session[],
  totalClasses: number
): StudentReport[] {
  return students.map((student) => {
    const attendance = calculateAttendance(records, sessions, student.cuenta);
    const projection = calculateProjection(attendance, totalClasses);
    const status = getStudentStatus(attendance.percentage, projection.bestCase);

    return {
      cuenta: student.cuenta,
      name: student.name,
      attended: attendance.attended,
      partial: attendance.partial,
      missed: attendance.missed,
      percentage: attendance.percentage,
      remainingAbsences: projection.remainingAbsences,
      status,
    };
  });
}
