// Constantes de la Aplicación
// Sistema Parlamentario de Votación en Tiempo Real

export const APP_NAME = 'Sistema Parlamentario de Votación';
export const APP_VERSION = '1.0.0';
export const ORGANIZATION = 'Brigada Parlamentaria de Cochabamba';
export const COUNTRY = 'Bolivia';

// ============ CONFIGURACIÓN DE VOTACIÓN ============
export const QUORUM_PERCENTAGE = 0.5; // 50% para mayoría absoluta
export const QUORUM_REQUIRED = 50; // Número mínimo de votos para quórum (fallback)
export const MIN_VOTES_FOR_APPROVAL = 50; // Voto necesario para aprobar (en porcentaje)
export const VOTE_TIMEOUT_MINUTES = 120; // Tiempo máximo de votación en minutos
export const MAX_VOTE_CHANGE_WINDOW_MINUTES = 5; // Ventana para cambiar voto (deshabilitada en producción)

// ============ ROLES DE USUARIO (Multi-Tenant) ============
export const USER_ROLES = {
  PLATFORM_ADMIN: 'platform_admin',
  TENANT_ADMIN: 'tenant_admin',
  ADMIN: 'admin', // Legacy - maps to tenant_admin
  SECRETARY: 'secretary',
  PARLIAMENTARIAN: 'parliamentarian',
  OBSERVER: 'observer',
} as const;

export const ROLE_LABELS = {
  platform_admin: 'Super Administrador',
  tenant_admin: 'Administrador de Institución',
  admin: 'Administrador', // Legacy
  secretary: 'Secretario',
  parliamentarian: 'Parlamentario',
  observer: 'Observador',
} as const;

export const ROLE_PERMISSIONS = {
  // Platform admin can manage all institutions
  platform_admin: [
    'view_all_data',
    'create_institution',
    'manage_institution',
    'create_session',
    'create_motion',
    'close_motion',
    'manage_parliamentarians',
    'view_audit_logs',
    'export_reports',
    'manage_users',
  ],
  // Tenant admin manages their specific institution
  tenant_admin: [
    'view_all_data',
    'create_session',
    'create_motion',
    'close_motion',
    'manage_parliamentarians',
    'view_audit_logs',
    'export_reports',
  ],
  // Legacy admin role maps to tenant_admin
  admin: [
    'view_all_data',
    'create_session',
    'create_motion',
    'close_motion',
    'manage_parliamentarians',
    'view_audit_logs',
    'export_reports',
  ],
  // Secretary: sessions/motions/attendance/quorum/voting control, no user/parl mgmt/delete/override
  secretary: [
    'view_all_data',
    'create_session',
    'update_session',
    'create_motion',
    'update_motion',
    'open_close_motion',
    'manage_attendance',
    'view_quorum_progress',
    'view_results',
    'view_audit_logs',
  ],
  parliamentarian: [
    'view_active_motions',
    'cast_vote',
    'view_own_votes',
    'view_results',
  ],
  observer: [
    'view_active_motions',
    'view_results',
    'view_nominal_list',
  ],
} as const;

// ============ TIPOS DE VOTO ============
export const VOTE_TYPES = {
  FAVOR: 'favor',
  AGAINST: 'against',
  ABSTENTION: 'abstention',
  ABSENT: 'absent',
} as const;

export const VOTE_LABELS = {
  favor: 'A Favor',
  against: 'En Contra',
  abstention: 'Abstención',
  absent: 'Ausente',
} as const;

export const VOTE_COLORS = {
  favor: '#10b981', // green
  against: '#ef4444', // red
  abstention: '#f59e0b', // amber
  absent: '#9ca3af', // gray
} as const;

// ============ ESTADOS DE SESIÓN ============
export const SESSION_STATUSES = {
  SCHEDULED: 'scheduled',
  ACTIVE: 'active',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
} as const;

export const SESSION_STATUS_LABELS = {
  scheduled: 'Programada',
  active: 'Activa',
  closed: 'Cerrada',
  cancelled: 'Cancelada',
} as const;

// ============ ESTADOS DE MOCIÓN ============
export const MOTION_STATUSES = {
  PENDING: 'pending',
  OPEN: 'open',
  CLOSED: 'closed',
  REJECTED: 'rejected',
  APPROVED: 'approved',
} as const;

export const MOTION_STATUS_LABELS = {
  pending: 'Pendiente',
  open: 'Abierta',
  closed: 'Cerrada',
  rejected: 'Rechazada',
  approved: 'Aprobada',
} as const;

// ============ TIPOS DE MOCIÓN ============
export const MOTION_TYPES = {
  RESOLUTION: 'resolution',
  AMENDMENT: 'amendment',
  QUESTION: 'question',
} as const;

export const MOTION_TYPE_LABELS = {
  resolution: 'Resolución',
  amendment: 'Enmienda',
  question: 'Pregunta',
} as const;

// ============ ESTADOS DE ASISTENCIA ============
export const ATTENDANCE_STATUSES = {
  PRESENT: 'present',
  ABSENT: 'absent',
  EXCUSED: 'excused',
} as const;

export const ATTENDANCE_STATUS_LABELS = {
  present: 'Presente',
  absent: 'Ausente',
  excused: 'Justificado',
} as const;

// ============ ACCIONES DE AUDITORÍA ============
export const AUDIT_ACTIONS = {
  SESSION_CREATED: 'session_created',
  SESSION_UPDATED: 'session_updated',
  MOTION_CREATED: 'motion_created',
  MOTION_UPDATED: 'motion_updated',
  MOTION_OPENED: 'motion_opened',
  MOTION_CLOSED: 'motion_closed',
  VOTE_CAST: 'vote_cast',
  USER_CREATED: 'user_created',
  PARLIAMENTARIAN_CREATED: 'parliamentarian_created',
  PARLIAMENTARIAN_UPDATED: 'parliamentarian_updated',
} as const;

export const AUDIT_ACTION_LABELS = {
  session_created: 'Sesión Creada',
  session_updated: 'Sesión Actualizada',
  motion_created: 'Moción Creada',
  motion_updated: 'Moción Actualizada',
  motion_opened: 'Moción Abierta',
  motion_closed: 'Moción Cerrada',
  vote_cast: 'Voto Registrado',
  user_created: 'Usuario Creado',
  parliamentarian_created: 'Parlamentario Creado',
  parliamentarian_updated: 'Parlamentario Actualizado',
} as const;

// ============ PARTIDOS POLÍTICOS DE EJEMPLO ============
export const POLITICAL_PARTIES = [
  'MAS',
  'UN',
  'CC',
  'PDC',
  'PAN-BOL',
  'Indígena',
  'Otro',
] as const;

// ============ CIRCUNSCRIPCIONES ============
export const CIRCUMSCRIPTIONS = [
  'Cochabamba Central',
  'Cochabamba Rural',
  'Quillacollo',
  'Sacaba',
  'Aiquile',
] as const;

// ============ NAVEGACIÓN ============
export const NAV_ITEMS_ADMIN = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Usuarios', href: '/admin/users' },
  { label: 'Sesiones', href: '/admin/sessions' },
  { label: 'Mociones', href: '/admin/motions' },
  { label: 'Asistencia', href: '/admin/attendance' },
  { label: 'Parlamentarios', href: '/admin/parliamentarians' },
  { label: 'Reportes', href: '/admin/reports' },
  { label: 'Auditoría', href: '/admin/audit' },
  { label: 'Mi Perfil', href: '/admin/profile' },
] as const;

export const NAV_ITEMS_SECRETARY = [
  { label: 'Dashboard', href: '/secretary' },
  { label: 'Sesiones', href: '/secretary/sessions' },
  { label: 'Mociones', href: '/secretary/motions' },
  { label: 'Asistencia', href: '/secretary/attendance' },
  { label: 'Quórum & Resultados', href: '/secretary/quorum' },
  { label: 'Auditoría', href: '/secretary/audit' },
] as const;

export const NAV_ITEMS_PARLIAMENTARIAN = [
  { label: 'Dashboard', href: '/parliamentarian' },
  { label: 'Votar', href: '/parliamentarian/voting' },
  { label: 'Mi Historial', href: '/parliamentarian/history' },
] as const;

export const NAV_ITEMS_PUBLIC = [
  { label: 'Resultados en Vivo', href: '/public' },
  { label: 'Mociones', href: '/public/motions' },
] as const;

// ============ FORMATEO ============
export const DATE_FORMAT = 'dd/MM/yyyy';
export const TIME_FORMAT = 'HH:mm:ss';
export const DATETIME_FORMAT = 'dd/MM/yyyy HH:mm:ss';

// ============ VALIDACIONES ============
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 255,
  MAX_DESCRIPTION_LENGTH: 2000,
  MAX_TITLE_LENGTH: 500,
} as const;

// ============ MENSAJES ============
export const MESSAGES = {
  SUCCESS: {
    VOTE_CAST: 'Tu voto ha sido registrado exitosamente',
    SESSION_CREATED: 'Sesión creada exitosamente',
    MOTION_CREATED: 'Moción creada exitosamente',
    MOTION_OPENED: 'Votación abierta',
    MOTION_CLOSED: 'Votación cerrada',
    PARLIAMENTARIAN_CREATED: 'Parlamentario agregado exitosamente',
    PARLIAMENTARIAN_UPDATED: 'Parlamentario actualizado exitosamente',
  },
  ERROR: {
    VOTE_ALREADY_CAST: 'Ya has votado en esta moción',
    MOTION_NOT_OPEN: 'Esta moción no está abierta para votación',
    UNAUTHORIZED: 'No tienes permisos para realizar esta acción',
    SESSION_REQUIRED: 'Se requiere una sesión activa',
    INVALID_MOTION: 'Moción inválida o no encontrada',
    INVALID_PARLIAMENTARIAN: 'Parlamentario inválido o no encontrado',
    SERVER_ERROR: 'Error del servidor. Por favor, intenta de nuevo.',
    NETWORK_ERROR: 'Error de conexión. Por favor, verifica tu conexión.',
    QUORUM_NOT_MET: 'Quórum no alcanzado para esta votación',
  },
} as const;

// ============ LÍMITES DE RATE LIMITING ============
export const RATE_LIMITS = {
  VOTES_PER_MINUTE: 10,
  API_CALLS_PER_MINUTE: 60,
  LOGIN_ATTEMPTS_PER_MINUTE: 5,
} as const;

// ============ CONFIGURACIÓN DE UI ============
export const UI_CONFIG = {
  TOAST_DURATION: 5000, // ms
  LOADING_TIMEOUT: 30000, // ms
  DEBOUNCE_DELAY: 300, // ms
  PAGINATION_SIZE: 20,
} as const;

