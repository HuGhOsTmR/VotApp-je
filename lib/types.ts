// Tipos TypeScript para el Sistema Parlamentario de Votación

// ============ ENUMERACIONES ============
export enum UserRole {
  ADMIN = 'admin',
  PARLIAMENTARIAN = 'parliamentarian',
  OBSERVER = 'observer',
}

export enum VoteType {
  FAVOR = 'favor',
  AGAINST = 'against',
  ABSTENTION = 'abstention',
  ABSENT = 'absent',
}

export enum SessionStatus {
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
}

export enum MotionStatus {
  PENDING = 'pending',
  OPEN = 'open',
  CLOSED = 'closed',
  REJECTED = 'rejected',
  APPROVED = 'approved',
}

export enum MotionType {
  RESOLUTION = 'resolution',
  AMENDMENT = 'amendment',
  QUESTION = 'question',
}

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  EXCUSED = 'excused',
}

export enum AuditAction {
  SESSION_CREATED = 'session_created',
  SESSION_UPDATED = 'session_updated',
  MOTION_CREATED = 'motion_created',
  MOTION_UPDATED = 'motion_updated',
  MOTION_OPENED = 'motion_opened',
  MOTION_CLOSED = 'motion_closed',
  VOTE_CAST = 'vote_cast',
  USER_CREATED = 'user_created',
  PARLIAMENTARIAN_CREATED = 'parliamentarian_created',
  PARLIAMENTARIAN_UPDATED = 'parliamentarian_updated',
}

// ============ USUARIO Y AUTENTICACIÓN ============
export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthSession {
  user: UserProfile;
  access_token: string;
  refresh_token: string;
}

// ============ PARLAMENTARIOS ============
export interface Parliamentarian {
  id: string;
  user_id?: string;
  full_name: string;
  political_party: string;
  circumscription: string;
  photo_url?: string;
  phone_number?: string;
  email?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============ SESIONES ============
export interface Session {
  id: string;
  legislature_number: number;
  session_date: string;
  start_time?: string;
  end_time?: string;
  status: SessionStatus;
  title?: string;
  description?: string;
  quorum_required: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// ============ MOCIONES ============
export interface Motion {
  id: string;
  session_id: string;
  title: string;
  description?: string;
  proposer_id: string;
  motion_type: MotionType;
  status: MotionStatus;
  voting_start_time?: string;
  voting_end_time?: string;
  minimum_votes_required?: number;
  created_at: string;
  updated_at: string;
}

export interface MotionWithProposer extends Motion {
  proposer: Parliamentarian;
}

export interface MotionWithResults extends Motion {
  proposer: Parliamentarian;
  results: MotionResults;
}

// ============ VOTOS ============
export interface Vote {
  id: string;
  motion_id: string;
  parliamentarian_id: string;
  vote_type: VoteType;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
  created_at: string;
}

export interface VoteWithDetails extends Vote {
  parliamentarian: Parliamentarian;
}

// ============ RESULTADOS DE MOCIONES ============
export interface MotionResults {
  favor_count: number;
  against_count: number;
  abstention_count: number;
  absent_count: number;
  total_votes: number;
  quorum_met: boolean;
}

export interface MotionSummary {
  motion: MotionWithProposer;
  results: MotionResults;
  votes: VoteWithDetails[];
}

// ============ ASISTENCIA ============
export interface Attendance {
  id: string;
  session_id: string;
  parliamentarian_id: string;
  status: AttendanceStatus;
  created_at: string;
}

// ============ AUDITORÍA ============
export interface AuditLog {
  id: string;
  user_id?: string;
  action: AuditAction;
  entity_type: string;
  entity_id?: string;
  ip_address?: string;
  user_agent?: string;
  details?: Record<string, any>;
  timestamp: string;
  created_at: string;
}

// ============ ESTADÍSTICAS Y REPORTES ============
export interface PartyVoteStatistics {
  party: string;
  favor: number;
  against: number;
  abstention: number;
  absent: number;
  total: number;
}

export interface SessionReport {
  session: Session;
  total_parliamentarians: number;
  present: number;
  absent: number;
  excused: number;
  motions_count: number;
  motions_approved: number;
  motions_rejected: number;
  creation_date: string;
}

// ============ SOLICITUDES Y RESPUESTAS DE API ============
export interface CreateMotionRequest {
  session_id: string;
  title: string;
  description?: string;
  proposer_id: string;
  motion_type: MotionType;
}

export interface CastVoteRequest {
  motion_id: string;
  parliamentarian_id: string;
  vote_type: VoteType;
}

export interface CreateSessionRequest {
  legislature_number: number;
  session_date: string;
  start_time?: string;
  end_time?: string;
  title?: string;
  description?: string;
  quorum_required?: number;
}

export interface UpdateSessionRequest {
  status?: SessionStatus;
  end_time?: string;
  title?: string;
  description?: string;
}

export interface UpdateMotionRequest {
  status?: MotionStatus;
  voting_start_time?: string;
  voting_end_time?: string;
}

// ============ EVENTOS DE WEBSOCKET ============
export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

export interface VoteEventData {
  motion_id: string;
  parliamentarian_id: string;
  vote_type: VoteType;
  timestamp: string;
}

export interface MotionStatusEventData {
  motion_id: string;
  status: MotionStatus;
  timestamp: string;
}

export interface ResultsUpdateEventData {
  motion_id: string;
  results: MotionResults;
  timestamp: string;
}

// ============ RESPUESTAS API ESTÁNDAR ============
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
