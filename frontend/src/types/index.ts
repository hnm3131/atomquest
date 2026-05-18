export type Role = 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
export type GoalSheetStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'LOCKED';
export type UomType = 'NUMERIC_MIN' | 'NUMERIC_MAX' | 'PERCENTAGE' | 'TIMELINE' | 'ZERO_BASED';
export type ProgressStatus = 'NOT_STARTED' | 'ON_TRACK' | 'COMPLETED';
export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  department: string;
  managerId?: string;
  designation?: string;
}

export interface AuthResponse {
  token: string;
  userId: string;
  email: string;
  name: string;
  role: Role;
  department: string;
}

export interface GoalSheet {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  cycleId: string;
  cycleName: string;
  status: GoalSheetStatus;
  submittedAt?: string;
  approvedAt?: string;
  rejectionComment?: string;
  goals: Goal[];
  totalWeightage: number;
  createdAt: string;
}

export interface Goal {
  id: string;
  thrustArea: string;
  title: string;
  description?: string;
  uomType: UomType;
  targetValue?: number;
  targetDate?: string;
  weightage: number;
  isShared: boolean;
  sharedSourceId?: string;
}

export interface GoalRequest {
  thrustArea: string;
  title: string;
  description?: string;
  uomType: UomType;
  targetValue?: number;
  targetDate?: string;
  weightage: number;
}

export interface Achievement {
  id: string;
  goalId: string;
  quarter: Quarter;
  actualValue?: number;
  actualDate?: string;
  status: ProgressStatus;
  computedScore?: number;
  employeeComment?: string;
}

export interface CheckIn {
  id: string;
  goalSheetId: string;
  managerId: string;
  employeeId: string;
  quarter: Quarter;
  feedback: string;
  overallRating?: string;
  createdAt: string;
}

export interface Cycle {
  id: string;
  name: string;
  goalSettingStart: string;
  goalSettingEnd: string;
  q1Start: string; q1End: string;
  q2Start: string; q2End: string;
  q3Start: string; q3End: string;
  q4Start: string; q4End: string;
  isActive: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  entityId: string;
  entityType: string;
  action: string;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  changedBy: string;
  changedByName: string;
  changedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string>;
}
