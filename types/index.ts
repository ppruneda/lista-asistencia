export interface Student {
  cuenta: string;
  name: string;
  email?: string;
  registeredAt: Date;
  registeredVia: "self" | "csv";
  fingerprints: string[];
  active: boolean;
}
export interface Session {
  id: string;
  label: string;
  number: number;
  date: Date;
  phase: "entrada" | "salida" | "closed";
  activeToken: string;
  tokenExpiresAt: Date;
  createdBy: string;
  closedAt?: Date;
}
export interface AttendanceRecord {
  id: string;
  sessionId: string;
  cuenta: string;
  phase: "entrada" | "salida";
  timestamp: Date;
  fingerprint: string;
  tokenUsed: string;
}
export interface CheckinRequest {
  token: string;
  cuenta: string;
  name?: string;
  fingerprint: string;
  sessionId: string;
  phase: "entrada" | "salida";
}
export interface CheckinResponse {
  success: boolean;
  message: string;
  attendance?: AttendanceRecord;
}
export interface StudentReport {
  cuenta: string;
  name: string;
  attended: number;
  partial: number;
  missed: number;
  percentage: number;
  remainingAbsences: number;
  status: "ok" | "risk" | "critical";
}
export interface AppConfig {
  totalClasses: number;
  materiaName: string;
  profesorName: string;
  profesorUid: string;
  semestre: string;
}
