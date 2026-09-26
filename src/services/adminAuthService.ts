import {
  AdminAuthorization,
  AdminAuditLogEntry,
  AdminAuthorizationStatus,
  CodeScrietUser,
} from '../types/index';

export const BOOTSTRAP_ADMIN_EMAIL = 'applicationinformation73737@gmail.com';

export const INITIAL_ADMIN_AUTHORIZATIONS: AdminAuthorization[] = [
  {
    id: 'auth-bootstrap-master',
    userId: 'usr-bootstrap-admin',
    email: BOOTSTRAP_ADMIN_EMAIL,
    name: 'Code.SCRIET Master Admin',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    verified: true,
    active: true,
    verifiedBy: 'SYSTEM_BOOTSTRAP',
    verifiedAt: '2026-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    notes: 'Official permanent authoritative Super Admin for Code.SCRIET platform',
  },
  {
    id: 'auth-kavita-02',
    userId: 'usr-kavita',
    email: 'kavita@scriet.ac.in',
    name: 'Kavita Rao',
    role: 'EVENT_ADMIN',
    status: 'ACTIVE',
    verified: true,
    active: true,
    verifiedBy: BOOTSTRAP_ADMIN_EMAIL,
    verifiedAt: '2026-02-15T10:00:00.000Z',
    createdAt: '2026-02-15T10:00:00.000Z',
    updatedAt: '2026-02-15T10:00:00.000Z',
    notes: 'Technical Lead for Event Operations & Scarcity Engine',
  },
  {
    id: 'auth-rohan-03',
    userId: 'usr-rohan',
    email: 'rohan@scriet.ac.in',
    name: 'Rohan Mehta',
    role: 'EVENT_OPERATOR',
    status: 'SUSPENDED',
    verified: false,
    active: false,
    verifiedBy: BOOTSTRAP_ADMIN_EMAIL,
    verifiedAt: '2026-02-10T12:00:00.000Z',
    suspendedAt: '2026-02-24T18:00:00.000Z',
    createdAt: '2026-02-10T12:00:00.000Z',
    updatedAt: '2026-02-24T18:00:00.000Z',
    notes: 'Suspended by Super Admin due to audit token revocation',
  },
  {
    id: 'auth-vikram-04',
    userId: 'usr-vikram',
    email: 'vikram@scriet.ac.in',
    name: 'Vikram Singh',
    role: 'ADMIN',
    status: 'REVOKED',
    verified: false,
    active: false,
    verifiedBy: BOOTSTRAP_ADMIN_EMAIL,
    verifiedAt: '2026-02-01T10:00:00.000Z',
    revokedAt: '2026-02-20T16:00:00.000Z',
    createdAt: '2026-02-01T10:00:00.000Z',
    updatedAt: '2026-02-20T16:00:00.000Z',
    notes: 'Access revoked by Super Admin due to squad competition conflict',
  },
];

export const INITIAL_ADMIN_AUDIT_LOGS: AdminAuditLogEntry[] = [
  {
    id: 'audit-001',
    actorUserId: 'system',
    actorEmail: 'system@scriet.dev',
    targetUserId: 'usr-bootstrap-admin',
    targetEmail: BOOTSTRAP_ADMIN_EMAIL,
    action: 'BOOTSTRAP_INITIAL_ADMIN',
    beforeStatus: 'NONE',
    afterStatus: 'SUPER_ADMIN',
    timestamp: '2026-01-01T00:00:00.000Z',
    reason: 'System bootstrap provisioning of authoritative administrator',
  },
  {
    id: 'audit-002',
    actorUserId: 'usr-bootstrap-admin',
    actorEmail: BOOTSTRAP_ADMIN_EMAIL,
    targetUserId: 'usr-kavita',
    targetEmail: 'kavita@scriet.ac.in',
    action: 'ADMIN_VERIFIED',
    beforeStatus: 'NONE',
    afterStatus: 'ACTIVE (EVENT_ADMIN)',
    timestamp: '2026-02-15T10:00:00.000Z',
    reason: 'Verified by Super Admin for technical operations',
  },
  {
    id: 'audit-003',
    actorUserId: 'usr-bootstrap-admin',
    actorEmail: BOOTSTRAP_ADMIN_EMAIL,
    targetUserId: 'usr-rohan',
    targetEmail: 'rohan@scriet.ac.in',
    action: 'ADMIN_SUSPENDED',
    beforeStatus: 'ACTIVE',
    afterStatus: 'SUSPENDED',
    timestamp: '2026-02-24T18:00:00.000Z',
    reason: 'Access suspended by Super Admin due to device token broadcast',
  },
  {
    id: 'audit-004',
    actorUserId: 'usr-bootstrap-admin',
    actorEmail: BOOTSTRAP_ADMIN_EMAIL,
    targetUserId: 'usr-vikram',
    targetEmail: 'vikram@scriet.ac.in',
    action: 'ADMIN_REVOKED',
    beforeStatus: 'ACTIVE',
    afterStatus: 'REVOKED',
    timestamp: '2026-02-20T16:00:00.000Z',
    reason: 'Revoked by Super Admin: active participating squad conflict',
  },
];

// Persona presets for testing authentication and authorization transitions
export const PRESET_USERS: {
  user: CodeScrietUser;
  label: string;
  expectedStatus: AdminAuthorizationStatus;
  badge: string;
  description: string;
}[] = [
  {
    user: {
      id: 'usr-bootstrap-admin',
      name: 'Code.SCRIET Master Admin',
      email: BOOTSTRAP_ADMIN_EMAIL,
      role: 'SUPERADMIN',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    },
    label: 'Initial Bootstrap Super Admin',
    expectedStatus: 'ACTIVE',
    badge: 'SUPER_ADMIN',
    description: 'Permanent Super Admin. Can verify, suspend, and revoke admins.',
  },
  {
    user: {
      id: 'usr-aman-student',
      name: 'Aman Gupta',
      email: 'aman@scriet.edu',
      role: 'MEMBER',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    },
    label: 'Normal Student / Founder',
    expectedStatus: 'NONE',
    badge: 'MEMBER',
    description: 'Standard campus founder. Admin button hidden. No apply option.',
  },
  {
    user: {
      id: 'usr-kavita',
      name: 'Kavita Rao',
      email: 'kavita@scriet.ac.in',
      role: 'ADMIN',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80',
    },
    label: 'Verified Event Admin',
    expectedStatus: 'ACTIVE',
    badge: 'EVENT_ADMIN',
    description: 'Super Admin verified. Admin button visible.',
  },
  {
    user: {
      id: 'usr-rohan',
      name: 'Rohan Mehta',
      email: 'rohan@scriet.ac.in',
      role: 'USER',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    },
    label: 'Suspended Admin Account',
    expectedStatus: 'SUSPENDED',
    badge: 'SUSPENDED',
    description: 'Access suspended by Super Admin. Admin button hidden.',
  },
  {
    user: {
      id: 'usr-vikram',
      name: 'Vikram Singh',
      email: 'vikram@scriet.ac.in',
      role: 'USER',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    },
    label: 'Revoked Admin Account',
    expectedStatus: 'REVOKED',
    badge: 'REVOKED',
    description: 'Access revoked by Super Admin. Normal Code.SCRIET user.',
  },
];

// =========================================================================
// AUTHORIZATION ABSTRACTION INTERFACE (Requirement 23)
// Clean abstraction layer ready to connect to Code.SCRIET API
// =========================================================================

export interface AuthorizationState {
  isAuthenticated: boolean;
  isVerifiedAdmin: boolean;
  loading: boolean;
  status: AdminAuthorizationStatus;
  role?: string;
  user?: CodeScrietUser | null;
  authorization?: AdminAuthorization | null;
}

/**
 * Returns the currently authenticated user from Code.SCRIET session
 */
export function getCurrentUser(): CodeScrietUser {
  try {
    const raw = localStorage.getItem('zero_one_user');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // fallback
  }
  return PRESET_USERS[1].user; // Default Aman Gupta (Normal user)
}

/**
 * Returns the authoritative admin authorization record for an email or ID
 */
export function getAdminAuthorization(emailOrId?: string): AdminAuthorization | undefined {
  const email = (emailOrId || getCurrentUser().email || '').toLowerCase().trim();
  try {
    const raw = localStorage.getItem('zero_one_admin_authorizations');
    if (raw) {
      const records: AdminAuthorization[] = JSON.parse(raw);
      return records.find((r) => r.email.toLowerCase() === email || r.userId === emailOrId);
    }
  } catch (e) {
    // fallback
  }
  return INITIAL_ADMIN_AUTHORIZATIONS.find((r) => r.email.toLowerCase() === email);
}

/**
 * Evaluates whether an email/user identity has verified active administrator status
 */
export function isVerifiedAdmin(emailOrId?: string): boolean {
  const email = (emailOrId || getCurrentUser().email || '').toLowerCase().trim();
  if (email === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()) return true;
  const auth = getAdminAuthorization(email);
  return Boolean(auth && (auth.status === 'ACTIVE' || auth.active));
}

