// ZERO → ONE Server-Authoritative Backend Engine
// Handles:
// - Server State & Authoritative Clock
// - Strict Server-Side Authorization (403 Forbidden for unauthorized admin access)
// - Super Admin Only Verification System (Verify, Suspend, Revoke, Reactivate by Email)
// - Real-Time Server-Sent Events (SSE) Transport across different browser contexts & devices
// - Financial Ledger with Double-Submit Idempotency Protection
// - Atomic Market Stock Constraints (cannot become negative)
// - Crisis, Auction, Judging, Canvas, and Audit Trail APIs

import type { IncomingMessage, ServerResponse } from 'http';
import {
  EventStatus,
  EventConfig,
  Team,
  LedgerEntry,
  MarketItem,
  InventoryItem,
  PurchaseProposal,
  CrisisAssignment,
  CrisisCard,
  Auction,
  AuctionBid,
  TradeOffer,
  StartupCanvas,
  ArtifactSubmission,
  JudgeScore,
  FloorScore,
  AuditLog,
  Announcement,
  JudgingCriteria,
  AdminAuthorization,
  AdminAuditLogEntry,
  AdminAuthorizationStatus,
  AdminPermissionRole,
  CrisisOption,
  CodeScrietUser,
} from '../src/types/index.ts';

import {
  DEFAULT_CONFIG,
  INITIAL_MARKET_ITEMS,
  INITIAL_CRISIS_CARDS,
  INITIAL_TEAMS,
  DEFAULT_JUDGING_CRITERIA,
} from '../src/services/mockData.ts';

import {
  BOOTSTRAP_ADMIN_EMAIL,
  INITIAL_ADMIN_AUTHORIZATIONS,
  INITIAL_ADMIN_AUDIT_LOGS,
} from '../src/services/adminAuthService.ts';

export interface CodeScrietUserRecord extends CodeScrietUser {
  accountStatus: 'ACTIVE' | 'SUSPENDED';
  joinedAt: string;
}

// Authoritative Code.SCRIET User Registry (Single Source of Truth)
export const CODE_SCRIET_USERS: CodeScrietUserRecord[] = [
  {
    id: 'usr-bootstrap-admin',
    name: 'Code.SCRIET Master Admin',
    email: BOOTSTRAP_ADMIN_EMAIL,
    role: 'SUPERADMIN',
    accountStatus: 'ACTIVE',
    joinedAt: '2025-01-01T00:00:00.000Z',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  },
  {
    id: 'usr-aman-student',
    name: 'Aman Gupta',
    email: 'aman@scriet.edu',
    role: 'MEMBER',
    accountStatus: 'ACTIVE',
    joinedAt: '2025-08-15T00:00:00.000Z',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
  },
  {
    id: 'usr-kavita',
    name: 'Kavita Rao',
    email: 'kavita@scriet.ac.in',
    role: 'ADMIN',
    accountStatus: 'ACTIVE',
    joinedAt: '2025-09-01T00:00:00.000Z',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80',
  },
  {
    id: 'usr-rohan',
    name: 'Rohan Mehta',
    email: 'rohan@scriet.ac.in',
    role: 'USER',
    accountStatus: 'ACTIVE',
    joinedAt: '2025-09-10T00:00:00.000Z',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
  },
  {
    id: 'usr-vikram',
    name: 'Vikram Singh',
    email: 'vikram@scriet.ac.in',
    role: 'USER',
    accountStatus: 'ACTIVE',
    joinedAt: '2025-09-12T00:00:00.000Z',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
  },
  {
    id: 'usr-priya',
    name: 'Priya Sharma',
    email: 'priya@scriet.ac.in',
    role: 'USER',
    accountStatus: 'ACTIVE',
    joinedAt: '2025-09-15T00:00:00.000Z',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
  },
  {
    id: 'usr-rahul',
    name: 'Rahul Verma',
    email: 'rahul@scriet.ac.in',
    role: 'USER',
    accountStatus: 'ACTIVE',
    joinedAt: '2025-09-20T00:00:00.000Z',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80',
  },
  {
    id: 'usr-neha',
    name: 'Neha Patel',
    email: 'neha@scriet.ac.in',
    role: 'MEMBER',
    accountStatus: 'ACTIVE',
    joinedAt: '2025-09-22T00:00:00.000Z',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
  },
  {
    id: 'usr-arjun',
    name: 'Arjun Kumar',
    email: 'arjun@scriet.ac.in',
    role: 'MEMBER',
    accountStatus: 'ACTIVE',
    joinedAt: '2025-09-25T00:00:00.000Z',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80',
  },
];

export interface AuthoritativeServerState {
  eventStatus: EventStatus;
  eventConfig: EventConfig;
  serverClock: {
    timeRemainingSeconds: number;
    isClockRunning: boolean;
    lastTickTimestamp: number;
  };
  isLockdownActive: boolean;
  teams: Team[];
  ledger: LedgerEntry[];
  marketItems: MarketItem[];
  inventory: InventoryItem[];
  purchaseProposals: PurchaseProposal[];
  crisisCards: CrisisCard[];
  activeCrisis: CrisisAssignment | null;
  activeAuction: Auction | null;
  auctionBids: AuctionBid[];
  trades: TradeOffer[];
  canvas: StartupCanvas;
  artifacts: ArtifactSubmission[];
  judgingCriteria: JudgingCriteria[];
  judgeScores: JudgeScore[];
  floorScores: FloorScore[];
  announcements: Announcement[];
  auditLogs: AuditLog[];
  adminAuthorizations: AdminAuthorization[];
  adminAuditLogs: AdminAuditLogEntry[];
  liveScreenConfig: {
    showLeaderboard: boolean;
    showCrisisGrid: boolean;
    showMarketTicker: boolean;
    announcementTickerText: string;
    presentationMode: 'NORMAL' | 'LOCKDOWN' | 'QUALIFIERS' | 'REVEAL';
  };
}

class ZeroOneBackendEngine {
  private state: AuthoritativeServerState;
  private sseClients: Set<ServerResponse> = new Set();
  private processedIdempotencyKeys: Set<string> = new Set();
  private clockInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.state = this.getInitialState();
    this.startClock();
  }

  private getInitialState(): AuthoritativeServerState {
    const now = new Date();
    return {
      eventStatus: 'ROUND_2',
      eventConfig: { ...DEFAULT_CONFIG },
      serverClock: {
        timeRemainingSeconds: 522, // 08:42
        isClockRunning: true,
        lastTickTimestamp: Date.now(),
      },
      isLockdownActive: false,
      teams: JSON.parse(JSON.stringify(INITIAL_TEAMS)),
      ledger: [
        {
          id: 'led-init-07',
          teamId: 'team-07',
          type: 'CREDIT',
          amount: 1000000,
          reasonTag: 'INITIAL_CAPITAL',
          description: 'Allocated Virtual Startup Capital',
          round: 'Round 1',
          actorMemberId: 'system',
          actorRole: 'SYSTEM',
          idempotencyKey: 'idemp-init-capital-07',
          source: 'SYSTEM',
          createdAt: new Date(now.getTime() - 7200000).toISOString(),
        },
        {
          id: 'led-hire-07',
          teamId: 'team-07',
          type: 'DEBIT',
          amount: 120000,
          reasonTag: 'PURCHASE',
          description: 'CTO Hire Approved (Developer Talent)',
          round: 'Round 1',
          actorMemberId: 'mem-2',
          actorRole: 'CFO',
          idempotencyKey: 'idemp-hire-dev-07',
          source: 'APP',
          createdAt: new Date(now.getTime() - 900000).toISOString(),
        },
        {
          id: 'led-ad-07',
          teamId: 'team-07',
          type: 'DEBIT',
          amount: 45000,
          reasonTag: 'PURCHASE',
          description: 'Purchased Ad Campaign (Multi-channel boost)',
          round: 'Round 2',
          actorMemberId: 'mem-2',
          actorRole: 'CFO',
          idempotencyKey: 'idemp-ad-campaign-07',
          source: 'APP',
          createdAt: new Date(now.getTime() - 120000).toISOString(),
        },
      ],
      marketItems: JSON.parse(JSON.stringify(INITIAL_MARKET_ITEMS)),
      inventory: [
        {
          id: 'inv-1',
          teamId: 'team-07',
          sku: 'CLOUD-CREDITS',
          name: 'Cloud Credits',
          category: 'Infrastructure',
          qty: 1,
          acquiredPrice: 80000,
          acquiredAt: new Date(now.getTime() - 3600000).toISOString(),
          round: 'Round 1',
          effectApplied: true,
        },
      ],
      purchaseProposals: [],
      crisisCards: JSON.parse(JSON.stringify(INITIAL_CRISIS_CARDS)),
      activeCrisis: null,
      activeAuction: null,
      auctionBids: [],
      trades: [],
      canvas: {
        teamId: 'team-07',
        problem: 'Campus student ventures struggle with early validation and scarcity simulation.',
        customer: 'Engineering & Management collegiate teams competing in tech startup festivals.',
        solution: 'ZERO → ONE real-time simulation platform powered by Code.SCRIET.',
        usp: 'Authoritative live economy with crisis events, scarcity dynamics, and board-level role decisions.',
        revenueModel: 'B2B Institutional licensing for university hackathons & incubators.',
        costStructure: 'Server infrastructure, event operations, real-time telemetry.',
        marketingStrategy: 'Campus ambassador activations, open developer hackathons.',
        competitors: 'Traditional static hackathons, paper business plan competitions.',
        traction: '42 squads deployed, ₹10M virtual capital simulated.',
        businessAssumptions: 'Squads require active crisis mitigation to survive past Round 2.',
        lastSavedAt: new Date().toISOString(),
        lastSavedBy: 'Aman Gupta (CEO)',
        version: 3,
      },
      artifacts: [
        {
          id: 'art-1',
          teamId: 'team-07',
          kind: 'PROTOTYPE',
          title: 'V1 Interactive MVP Demo',
          url: 'https://zero-one.codescriet.dev/demo',
          description: 'Operational prototype showcasing the live dashboard.',
          submittedBy: 'Kavita Rao (CTO)',
          submittedAt: new Date(now.getTime() - 600000).toISOString(),
        },
      ],
      judgingCriteria: JSON.parse(JSON.stringify(DEFAULT_JUDGING_CRITERIA)),
      judgeScores: [],
      floorScores: [],
      announcements: [
        {
          id: 'ann-1',
          title: 'Round 2: Build & Grow is LIVE!',
          content: 'Dynamic market pricing is active. Watch for cloud credit demand spikes.',
          type: 'INFO',
          timestamp: new Date().toISOString(),
        },
      ],
      auditLogs: [
        {
          id: 'aud-init',
          actor: 'Code.SCRIET Master Admin',
          role: 'SUPERADMIN',
          action: 'BOOTSTRAP_EVENT_ENGINE',
          target: 'ZERO_ONE_2026',
          details: 'Initialized authoritative simulation state engine.',
          timestamp: new Date().toISOString(),
          source: 'SYSTEM',
        },
      ],
      adminAuthorizations: JSON.parse(JSON.stringify(INITIAL_ADMIN_AUTHORIZATIONS)),
      adminAuditLogs: JSON.parse(JSON.stringify(INITIAL_ADMIN_AUDIT_LOGS)),
      liveScreenConfig: {
        showLeaderboard: true,
        showCrisisGrid: true,
        showMarketTicker: true,
        announcementTickerText: 'ZERO → ONE Official Startup Simulation • Code.SCRIET',
        presentationMode: 'NORMAL',
      },
    };
  }

  // --- Clock Management ---
  private startClock() {
    if (this.clockInterval) clearInterval(this.clockInterval);
    this.clockInterval = setInterval(() => {
      if (this.state.serverClock.isClockRunning && this.state.serverClock.timeRemainingSeconds > 0) {
        this.state.serverClock.timeRemainingSeconds -= 1;
        this.state.serverClock.lastTickTimestamp = Date.now();

        // Broadcast clock sync every 10 seconds or when expiring
        if (
          this.state.serverClock.timeRemainingSeconds % 10 === 0 ||
          this.state.serverClock.timeRemainingSeconds <= 5
        ) {
          this.broadcastEvent('CLOCK_SYNC', {
            timeRemainingSeconds: this.state.serverClock.timeRemainingSeconds,
            isClockRunning: this.state.serverClock.isClockRunning,
            timestamp: Date.now(),
          }, 'SERVER_CLOCK');
        }
      }
    }, 1000);
  }

  public getAuthoritativeState(): AuthoritativeServerState {
    return this.state;
  }

  // --- Real-time SSE Management ---
  public registerSseClient(res: ServerResponse) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', serverTimestamp: Date.now() })}\n\n`);
    this.sseClients.add(res);

    res.on('close', () => {
      this.sseClients.delete(res);
    });
  }

  public broadcastEvent(type: string, payload: any, actor = 'SYSTEM') {
    const event = {
      id: 'evt-' + Math.random().toString(36).substring(2, 9),
      type,
      payload,
      actor,
      timestamp: new Date().toISOString(),
      authoritativeServerTimestamp: Date.now(),
    };

    const message = `data: ${JSON.stringify(event)}\n\n`;
    for (const client of this.sseClients) {
      try {
        client.write(message);
      } catch (err) {
        this.sseClients.delete(client);
      }
    }
    return event;
  }

  // --- Server Authorization & Verification ---
  public getUserAdminStatus(email?: string): AdminAuthorizationStatus {
    if (!email) return 'NONE';
    const normalized = email.toLowerCase().trim();

    // Bootstrap Master Admin always ACTIVE
    if (normalized === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()) {
      return 'ACTIVE';
    }

    const auth = this.state.adminAuthorizations.find(
      (a) => a.email.toLowerCase() === normalized
    );
    if (auth) {
      return auth.status;
    }

    return 'NONE';
  }

  public isUserAdmin(email?: string): boolean {
    const status = this.getUserAdminStatus(email);
    return status === 'ACTIVE';
  }

  public isUserSuperAdmin(email?: string): boolean {
    if (!email) return false;
    const normalized = email.toLowerCase().trim();
    if (normalized === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()) return true;
    const auth = this.state.adminAuthorizations.find(
      (a) => a.email.toLowerCase() === normalized
    );
    return Boolean(auth && auth.role === 'SUPER_ADMIN' && auth.status === 'ACTIVE');
  }

  public requireAdmin(req: IncomingMessage, res: ServerResponse): boolean {
    if (res.headersSent) return false;
    const userEmail = (req.headers['x-user-email'] as string) || '';
    const status = this.getUserAdminStatus(userEmail);
    if (status !== 'ACTIVE') {
      if (!res.headersSent) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: '403 Forbidden: Verified active administrator authorization required',
          statusCode: 403,
          authenticatedEmail: userEmail,
          serverStatus: status,
        }));
      }
      return false;
    }
    return true;
  }

  public requireSuperAdmin(req: IncomingMessage, res: ServerResponse): boolean {
    if (res.headersSent) return false;
    const userEmail = (req.headers['x-user-email'] as string) || '';
    if (!this.isUserSuperAdmin(userEmail)) {
      if (!res.headersSent) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: '403 Forbidden: Only the Super Administrator can execute this operation',
          statusCode: 403,
          authenticatedEmail: userEmail,
          isSuperAdmin: false,
        }));
      }
      return false;
    }
    return true;
  }

  // --- Super Admin User Search ---
  public handleSearchUser(email: string) {
    const normalized = (email || '').toLowerCase().trim();
    const user = CODE_SCRIET_USERS.find((u) => u.email.toLowerCase() === normalized);
    if (!user) {
      return { found: false, error: 'User does not exist in Code.SCRIET registry' };
    }
    const auth = this.state.adminAuthorizations.find((a) => a.email.toLowerCase() === normalized);
    return {
      found: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        accountStatus: user.accountStatus,
        role: user.role,
        adminStatus: auth ? auth.status : 'NONE',
        adminRole: auth ? auth.role : null,
        verifiedAt: auth ? auth.verifiedAt : null,
        verifiedBy: auth ? auth.verifiedBy : null,
      },
    };
  }

  // --- Super Admin Verification Actions ---
  public handleVerifyAdminByEmail(targetEmail: string, role: AdminPermissionRole = 'ADMIN', superAdminEmail: string) {
    const normalized = (targetEmail || '').toLowerCase().trim();
    const user = CODE_SCRIET_USERS.find((u) => u.email.toLowerCase() === normalized);
    if (!user) {
      return { success: false, message: 'User does not exist in Code.SCRIET database registry' };
    }

    let auth = this.state.adminAuthorizations.find((a) => a.email.toLowerCase() === normalized);
    const prevStatus = auth ? auth.status : 'NONE';
    const now = new Date().toISOString();

    if (auth) {
      auth.role = role || 'ADMIN';
      auth.status = 'ACTIVE';
      auth.active = true;
      auth.verified = true;
      auth.verifiedBy = superAdminEmail;
      auth.verifiedAt = now;
      auth.updatedAt = now;
      delete auth.suspendedAt;
      delete auth.revokedAt;
    } else {
      auth = {
        id: 'auth-' + Date.now(),
        userId: user.id,
        email: user.email,
        name: user.name,
        role: role || 'ADMIN',
        status: 'ACTIVE',
        active: true,
        verified: true,
        verifiedBy: superAdminEmail,
        verifiedAt: now,
        createdAt: now,
        updatedAt: now,
        notes: `Verified by Super Admin ${superAdminEmail}`,
      };
      this.state.adminAuthorizations.unshift(auth);
    }

    this.state.adminAuditLogs.unshift({
      id: 'audit-' + Date.now(),
      actorUserId: 'usr-superadmin',
      actorEmail: superAdminEmail,
      targetUserId: user.id,
      targetEmail: user.email,
      action: 'ADMIN_VERIFIED',
      beforeStatus: prevStatus,
      afterStatus: `ACTIVE (${auth.role})`,
      timestamp: now,
      reason: `Verified administrator by Super Admin ${superAdminEmail}`,
    });

    this.broadcastEvent('ADMIN_AUTH_UPDATED', {
      email: user.email,
      status: 'ACTIVE',
      role: auth.role,
      authorizations: this.state.adminAuthorizations,
    }, superAdminEmail);

    return {
      success: true,
      message: `Successfully verified ${user.name} (${user.email}) as ${auth.role}`,
      authorization: auth,
    };
  }

  public handleSuspendAdmin(targetEmail: string, reason: string, superAdminEmail: string) {
    const normalized = (targetEmail || '').toLowerCase().trim();
    if (normalized === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()) {
      return { success: false, message: 'Permanent Super Administrator cannot be suspended' };
    }
    const auth = this.state.adminAuthorizations.find((a) => a.email.toLowerCase() === normalized);
    if (!auth) return { success: false, message: 'Admin authorization record not found' };

    const prevStatus = auth.status;
    const now = new Date().toISOString();
    auth.status = 'SUSPENDED';
    auth.active = false;
    auth.verified = false;
    auth.suspendedAt = now;
    auth.updatedAt = now;

    this.state.adminAuditLogs.unshift({
      id: 'audit-' + Date.now(),
      actorUserId: 'usr-superadmin',
      actorEmail: superAdminEmail,
      targetUserId: auth.userId,
      targetEmail: auth.email,
      action: 'ADMIN_SUSPENDED',
      beforeStatus: prevStatus,
      afterStatus: 'SUSPENDED',
      timestamp: now,
      reason: reason || 'Suspended by Super Admin',
    });

    this.broadcastEvent('ADMIN_AUTH_UPDATED', {
      email: auth.email,
      status: 'SUSPENDED',
      authorizations: this.state.adminAuthorizations,
    }, superAdminEmail);

    return { success: true, message: `Suspended admin access for ${auth.name} (${auth.email})`, authorization: auth };
  }

  public handleRevokeAdmin(targetEmail: string, reason: string, superAdminEmail: string) {
    const normalized = (targetEmail || '').toLowerCase().trim();
    if (normalized === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()) {
      return { success: false, message: 'Permanent Super Administrator cannot be revoked' };
    }
    const auth = this.state.adminAuthorizations.find((a) => a.email.toLowerCase() === normalized);
    if (!auth) return { success: false, message: 'Admin authorization record not found' };

    const prevStatus = auth.status;
    const now = new Date().toISOString();
    auth.status = 'REVOKED';
    auth.active = false;
    auth.verified = false;
    auth.revokedAt = now;
    auth.updatedAt = now;

    this.state.adminAuditLogs.unshift({
      id: 'audit-' + Date.now(),
      actorUserId: 'usr-superadmin',
      actorEmail: superAdminEmail,
      targetUserId: auth.userId,
      targetEmail: auth.email,
      action: 'ADMIN_REVOKED',
      beforeStatus: prevStatus,
      afterStatus: 'REVOKED',
      timestamp: now,
      reason: reason || 'Revoked by Super Admin',
    });

    this.broadcastEvent('ADMIN_AUTH_UPDATED', {
      email: auth.email,
      status: 'REVOKED',
      authorizations: this.state.adminAuthorizations,
    }, superAdminEmail);

    return { success: true, message: `Revoked admin authorization for ${auth.name} (${auth.email})`, authorization: auth };
  }

  public handleReactivateAdmin(targetEmail: string, reason: string, superAdminEmail: string) {
    const normalized = (targetEmail || '').toLowerCase().trim();
    const auth = this.state.adminAuthorizations.find((a) => a.email.toLowerCase() === normalized);
    if (!auth) return { success: false, message: 'Admin authorization record not found' };

    const prevStatus = auth.status;
    const now = new Date().toISOString();
    auth.status = 'ACTIVE';
    auth.active = true;
    auth.verified = true;
    delete auth.suspendedAt;
    delete auth.revokedAt;
    auth.updatedAt = now;

    this.state.adminAuditLogs.unshift({
      id: 'audit-' + Date.now(),
      actorUserId: 'usr-superadmin',
      actorEmail: superAdminEmail,
      targetUserId: auth.userId,
      targetEmail: auth.email,
      action: 'ADMIN_REACTIVATED',
      beforeStatus: prevStatus,
      afterStatus: 'ACTIVE',
      timestamp: now,
      reason: reason || 'Reactivated by Super Admin',
    });

    this.broadcastEvent('ADMIN_AUTH_UPDATED', {
      email: auth.email,
      status: 'ACTIVE',
      authorizations: this.state.adminAuthorizations,
    }, superAdminEmail);

    return { success: true, message: `Reactivated admin authorization for ${auth.name} (${auth.email})`, authorization: auth };
  }

  // --- Balance Calculation ---
  public getTeamBalance(teamId: string): number {
    return this.state.ledger
      .filter((entry) => entry.teamId === teamId)
      .reduce((sum, entry) => sum + (entry.type === 'CREDIT' ? entry.amount : -entry.amount), 0);
  }

  // --- API Handlers ---
  public handleStatusChange(status: EventStatus, actor: string) {
    this.state.eventStatus = status;
    this.state.auditLogs.unshift({
      id: 'aud-' + Date.now(),
      actor,
      role: 'ADMIN',
      action: 'EVENT_STATUS_TRANSITION',
      target: status,
      details: `Advanced event status to ${status}`,
      timestamp: new Date().toISOString(),
      source: 'ADMIN',
    });
    this.broadcastEvent('EVENT_STATE_CHANGED', { eventStatus: status }, actor);
  }

  public handleClockToggle(actor: string) {
    this.state.serverClock.isClockRunning = !this.state.serverClock.isClockRunning;
    this.broadcastEvent('CLOCK_SYNC', {
      timeRemainingSeconds: this.state.serverClock.timeRemainingSeconds,
      isClockRunning: this.state.serverClock.isClockRunning,
      timestamp: Date.now(),
    }, actor);
  }

  public handleClockReset(minutes: number, actor: string) {
    this.state.serverClock.timeRemainingSeconds = minutes * 60;
    this.state.serverClock.isClockRunning = true;
    this.broadcastEvent('CLOCK_SYNC', {
      timeRemainingSeconds: this.state.serverClock.timeRemainingSeconds,
      isClockRunning: true,
      timestamp: Date.now(),
    }, actor);
  }

  public handlePriceChange(sku: string, newPrice: number, actor: string) {
    const item = this.state.marketItems.find((i) => i.sku === sku);
    if (!item) return false;
    const oldPrice = item.currentPrice;
    item.currentPrice = newPrice;
    item.priceChangePct = Math.round(((newPrice - item.basePrice) / item.basePrice) * 100);

    this.state.auditLogs.unshift({
      id: 'aud-' + Date.now(),
      actor,
      role: 'ADMIN',
      action: 'MARKET_PRICE_OVERRIDE',
      target: sku,
      details: `Changed ${sku} price from ₹${oldPrice.toLocaleString()} to ₹${newPrice.toLocaleString()}`,
      timestamp: new Date().toISOString(),
      source: 'ADMIN',
    });

    this.broadcastEvent('PRICE_UPDATED', {
      sku,
      currentPrice: newPrice,
      priceChangePct: item.priceChangePct,
      items: this.state.marketItems,
    }, actor);
    return true;
  }

  public handleStockChange(sku: string, delta: number, actor: string) {
    const item = this.state.marketItems.find((i) => i.sku === sku);
    if (!item) return false;
    item.stockRemaining = Math.max(0, item.stockRemaining + delta);
    item.status = item.stockRemaining === 0 ? 'OUT_OF_STOCK' : 'AVAILABLE';

    this.broadcastEvent('STOCK_UPDATED', {
      sku,
      stockRemaining: item.stockRemaining,
      status: item.status,
      items: this.state.marketItems,
    }, actor);
    return true;
  }

  public handlePurchase(
    teamId: string,
    sku: string,
    idempotencyKey: string,
    actorEmail: string,
    actorRole: string
  ): { success: boolean; message: string; balance?: number } {
    // Idempotency check: prevent duplicate charges
    if (this.processedIdempotencyKeys.has(idempotencyKey)) {
      return { success: false, message: 'Transaction already committed (Idempotency conflict prevented duplicate debit)' };
    }

    const item = this.state.marketItems.find((i) => i.sku === sku);
    if (!item) {
      return { success: false, message: 'Item SKU not found in authoritative catalog' };
    }

    // Atomic Stock Constraint
    if (item.stockRemaining <= 0) {
      return { success: false, message: 'SKU is out of stock' };
    }

    // Atomic Financial Balance Constraint
    const currentBalance = this.getTeamBalance(teamId);
    if (currentBalance < item.currentPrice) {
      return { success: false, message: `Insufficient funds: Required ₹${item.currentPrice.toLocaleString()}, available ₹${currentBalance.toLocaleString()}` };
    }

    // Commit Transaction Atomically
    this.processedIdempotencyKeys.add(idempotencyKey);
    item.stockRemaining -= 1;
    if (item.stockRemaining === 0) item.status = 'OUT_OF_STOCK';

    const ledgerEntry: LedgerEntry = {
      id: 'led-' + Date.now(),
      teamId,
      type: 'DEBIT',
      amount: item.currentPrice,
      reasonTag: 'PURCHASE',
      description: `Purchased ${item.name} (${sku})`,
      round: this.state.eventStatus,
      actorMemberId: actorEmail,
      actorRole: (actorRole as any) || 'CFO',
      idempotencyKey,
      source: 'APP',
      createdAt: new Date().toISOString(),
    };
    this.state.ledger.unshift(ledgerEntry);

    const invItem: InventoryItem = {
      id: 'inv-' + Date.now(),
      teamId,
      sku: item.sku,
      name: item.name,
      category: item.category,
      qty: 1,
      acquiredPrice: item.currentPrice,
      acquiredAt: new Date().toISOString(),
      round: this.state.eventStatus,
      effectApplied: true,
    };
    this.state.inventory.unshift(invItem);

    const newBalance = this.getTeamBalance(teamId);

    // Broadcast Realtime Events
    this.broadcastEvent('PURCHASE_COMMITTED', {
      teamId,
      sku,
      item,
      ledgerEntry,
      newBalance,
    }, actorEmail);

    this.broadcastEvent('FUNDS_UPDATED', {
      teamId,
      newBalance,
      entry: ledgerEntry,
    }, actorEmail);

    this.broadcastEvent('STOCK_UPDATED', {
      sku,
      stockRemaining: item.stockRemaining,
      status: item.status,
    }, actorEmail);

    return { success: true, message: `Successfully purchased ${item.name}`, balance: newBalance };
  }

  public handleCrisisDispatch(teamId: string, crisisId: string, actor: string) {
    const card = this.state.crisisCards.find((c) => c.id === crisisId) || this.state.crisisCards[0];
    const assignment: CrisisAssignment = {
      id: 'c-asg-' + Date.now(),
      teamId,
      crisisId: card.id,
      crisis: card,
      dispatchedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + card.timerSeconds * 1000).toISOString(),
      status: 'ACTIVE',
    };
    this.state.activeCrisis = assignment;

    this.state.auditLogs.unshift({
      id: 'aud-' + Date.now(),
      actor,
      role: 'ADMIN',
      action: 'CRISIS_DISPATCHED',
      target: teamId,
      details: `Dispatched crisis "${card.title}" (${card.severity}) to ${teamId}`,
      timestamp: new Date().toISOString(),
      source: 'ADMIN',
    });

    this.broadcastEvent('CRISIS_DISPATCHED', {
      teamId,
      crisis: assignment,
    }, actor);
    return assignment;
  }

  public handleCrisisResponse(teamId: string, optionId: string, tradeoff: string, actor: string) {
    if (!this.state.activeCrisis) return { success: false, message: 'No active crisis to resolve' };
    const opt = this.state.activeCrisis.crisis.options.find(
      (o: CrisisOption) => o.id.toLowerCase() === optionId.toLowerCase()
    ) || this.state.activeCrisis.crisis.options[0];
    if (!opt) return { success: false, message: 'Invalid option selected' };

    this.state.activeCrisis.status = 'RESOLVED';
    this.state.activeCrisis.selectedOptionId = optionId;
    this.state.activeCrisis.tradeoffGivenUp = tradeoff;
    this.state.activeCrisis.resolvedAt = new Date().toISOString();

    if (opt.cost > 0) {
      const led: LedgerEntry = {
        id: 'led-crisis-' + Date.now(),
        teamId,
        type: 'DEBIT',
        amount: opt.cost,
        reasonTag: 'CRISIS_PENALTY',
        description: `Crisis Mitigation: ${opt.label}`,
        round: this.state.eventStatus,
        actorMemberId: actor,
        actorRole: 'CEO',
        idempotencyKey: 'idemp-crisis-' + Date.now(),
        source: 'APP',
        createdAt: new Date().toISOString(),
      };
      this.state.ledger.unshift(led);
    }

    this.broadcastEvent('CRISIS_RESPONSE_RECEIVED', {
      teamId,
      activeCrisis: this.state.activeCrisis,
      newBalance: this.getTeamBalance(teamId),
    }, actor);

    return { success: true, message: 'Crisis resolved successfully' };
  }

  public handleAuctionOpen(title: string, description: string, itemSku: string, minBid: number, durationMinutes: number, actor: string) {
    const auction: Auction = {
      id: 'auc-' + Date.now(),
      title,
      description,
      itemSku,
      minimumBid: minBid,
      status: 'OPEN',
      opensAt: new Date().toISOString(),
      closesAt: new Date(Date.now() + durationMinutes * 60000).toISOString(),
    };
    this.state.activeAuction = auction;
    this.state.auctionBids = [];

    this.broadcastEvent('AUCTION_OPENED', { auction }, actor);
    return auction;
  }

  public handleAuctionBid(teamId: string, teamName: string, amount: number, actor: string) {
    if (!this.state.activeAuction || this.state.activeAuction.status !== 'OPEN') {
      return { success: false, message: 'Auction is not currently open' };
    }
    const currentHigh = this.state.auctionBids.length > 0 ? this.state.auctionBids[0].amount : this.state.activeAuction.minimumBid;
    if (amount <= currentHigh) {
      return { success: false, message: `Bid must be higher than current high bid of ₹${currentHigh.toLocaleString()}` };
    }

    const bid: AuctionBid = {
      id: 'bid-' + Date.now(),
      auctionId: this.state.activeAuction.id,
      teamId,
      teamName,
      amount,
      submittedAt: new Date().toISOString(),
      idempotencyKey: 'bid-' + Date.now(),
    };
    this.state.auctionBids.unshift(bid);

    this.broadcastEvent('AUCTION_BID_RECEIVED', {
      auctionId: this.state.activeAuction.id,
      bid,
      highBid: amount,
      highBidTeamName: teamName,
    }, actor);

    return { success: true, message: 'Bid placed successfully' };
  }

  public handleAuctionClose(actor: string) {
    if (!this.state.activeAuction) return null;
    this.state.activeAuction.status = 'CLOSED';
    if (this.state.auctionBids.length > 0) {
      const win = this.state.auctionBids[0];
      this.state.activeAuction.winnerTeamId = win.teamId;
      this.state.activeAuction.winnerTeamName = win.teamName;
      this.state.activeAuction.winningBid = win.amount;

      // Debit winner
      this.state.ledger.unshift({
        id: 'led-auc-' + Date.now(),
        teamId: win.teamId,
        type: 'DEBIT',
        amount: win.amount,
        reasonTag: 'AUCTION_WIN',
        description: `Won Auction: ${this.state.activeAuction.title}`,
        round: this.state.eventStatus,
        actorMemberId: actor,
        actorRole: 'SYSTEM',
        idempotencyKey: 'idemp-auc-' + Date.now(),
        source: 'SYSTEM',
        createdAt: new Date().toISOString(),
      });
    }

    this.broadcastEvent('AUCTION_CLOSED', {
      auction: this.state.activeAuction,
    }, actor);

    return this.state.activeAuction;
  }

  public handleManualAdjustment(teamId: string, type: 'CREDIT' | 'DEBIT', amount: number, reason: string, actor: string) {
    const entry: LedgerEntry = {
      id: 'led-' + Date.now(),
      teamId,
      type,
      amount,
      reasonTag: 'MANUAL_ADJUSTMENT',
      description: reason,
      round: this.state.eventStatus,
      actorMemberId: actor,
      actorRole: 'ADMIN',
      idempotencyKey: 'idemp-adj-' + Date.now(),
      source: 'ADMIN',
      createdAt: new Date().toISOString(),
    };
    this.state.ledger.unshift(entry);
    const newBalance = this.getTeamBalance(teamId);

    this.broadcastEvent('FUNDS_UPDATED', {
      teamId,
      newBalance,
      entry,
    }, actor);

    return entry;
  }

  public handleLoanGrant(teamId: string, principal: number, interestPct: number, actor: string) {
    const entry: LedgerEntry = {
      id: 'led-loan-' + Date.now(),
      teamId,
      type: 'CREDIT',
      amount: principal,
      reasonTag: 'LOAN_DISBURSEMENT',
      description: `Institutional Venture Debt (+${interestPct}% coupon)`,
      round: this.state.eventStatus,
      actorMemberId: actor,
      actorRole: 'ADMIN',
      idempotencyKey: 'idemp-loan-' + Date.now(),
      source: 'ADMIN',
      createdAt: new Date().toISOString(),
    };
    this.state.ledger.unshift(entry);
    const newBalance = this.getTeamBalance(teamId);

    this.broadcastEvent('FUNDS_UPDATED', {
      teamId,
      newBalance,
      entry,
    }, actor);

    return entry;
  }

  public handleAnnouncement(title: string, content: string, type: Announcement['type'] = 'INFO', actor: string) {
    const ann: Announcement = {
      id: 'ann-' + Date.now(),
      title,
      content,
      type,
      timestamp: new Date().toISOString(),
    };
    this.state.announcements.unshift(ann);
    this.broadcastEvent('ANNOUNCEMENT_BROADCAST', { announcement: ann }, actor);
    return ann;
  }

  public handleJudgeScore(score: Omit<JudgeScore, 'id' | 'submittedAt'>, actor: string) {
    const fullScore: JudgeScore = {
      ...score,
      id: 'scr-' + Date.now(),
      submittedAt: new Date().toISOString(),
    };
    this.state.judgeScores.unshift(fullScore);
    this.broadcastEvent('SCORE_SUBMITTED', { score: fullScore }, actor);
    return fullScore;
  }

  public handleReset() {
    this.state = this.getInitialState();
    this.processedIdempotencyKeys.clear();
    this.startClock();
    this.broadcastEvent('SIMULATION_RESET', { timestamp: Date.now() }, 'SYSTEM');
    return true;
  }
}

export const serverEngine = new ZeroOneBackendEngine();

// Helper to parse JSON body from incoming HTTP request
async function parseJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

// Connect middleware function for Vite dev server & production server
export function zeroOneBackendMiddleware(req: IncomingMessage, res: ServerResponse, next: () => void) {
  const url = req.url || '';

  if (!url.startsWith('/api')) {
    return next();
  }

  // SSE Stream
  if (url === '/api/realtime/stream') {
    return serverEngine.registerSseClient(res);
  }

  res.setHeader('Content-Type', 'application/json');

  // Handle API routes
  (async () => {
    try {
      // 1. Health
      if (url === '/api/health') {
        res.writeHead(200);
        return res.end(JSON.stringify({ status: 'ok', serverTimestamp: Date.now() }));
      }

      // 2. Authoritative State
      if (url === '/api/state') {
        res.writeHead(200);
        return res.end(JSON.stringify(serverEngine.getAuthoritativeState()));
      }

      // 3. Server Clock
      if (url === '/api/clock') {
        const state = serverEngine.getAuthoritativeState();
        res.writeHead(200);
        return res.end(JSON.stringify({
          timeRemainingSeconds: state.serverClock.timeRemainingSeconds,
          isClockRunning: state.serverClock.isClockRunning,
          serverTimestamp: Date.now(),
        }));
      }

      // 4. Auth diagnostic
      if (url.startsWith('/api/auth/me')) {
        const urlParams = new URL(url, 'http://localhost');
        const email = urlParams.searchParams.get('email') || (req.headers['x-user-email'] as string) || '';
        const status = serverEngine.getUserAdminStatus(email);
        const isSuper = serverEngine.isUserSuperAdmin(email);
        res.writeHead(200);
        return res.end(JSON.stringify({
          email,
          adminStatus: status,
          isSuperAdmin: isSuper,
          verified: status === 'ACTIVE',
        }));
      }

      // --- PROTECTED ADMIN APIS ---
      if (url.startsWith('/api/admin/')) {
        const actorEmail = (req.headers['x-user-email'] as string) || 'admin';

        // SUPER ADMIN EXCLUSIVE ROUTES
        if (url.startsWith('/api/admin/search-user') && req.method === 'GET') {
          if (!serverEngine.requireSuperAdmin(req, res)) return;
          const urlParams = new URL(url, 'http://localhost');
          const email = urlParams.searchParams.get('email') || '';
          const result = serverEngine.handleSearchUser(email);
          res.writeHead(result.found ? 200 : 404);
          return res.end(JSON.stringify(result));
        }

        if (url === '/api/admin/verify' && req.method === 'POST') {
          if (!serverEngine.requireSuperAdmin(req, res)) return;
          const body = await parseJsonBody(req);
          const result = serverEngine.handleVerifyAdminByEmail(body.email, body.role || 'ADMIN', actorEmail);
          res.writeHead(result.success ? 200 : 400);
          return res.end(JSON.stringify(result));
        }

        if (url === '/api/admin/suspend' && req.method === 'POST') {
          if (!serverEngine.requireSuperAdmin(req, res)) return;
          const body = await parseJsonBody(req);
          const result = serverEngine.handleSuspendAdmin(body.email || body.targetEmail, body.reason, actorEmail);
          res.writeHead(result.success ? 200 : 400);
          return res.end(JSON.stringify(result));
        }

        if (url === '/api/admin/revoke' && req.method === 'POST') {
          if (!serverEngine.requireSuperAdmin(req, res)) return;
          const body = await parseJsonBody(req);
          const result = serverEngine.handleRevokeAdmin(body.email || body.targetEmail, body.reason, actorEmail);
          res.writeHead(result.success ? 200 : 400);
          return res.end(JSON.stringify(result));
        }

        if (url === '/api/admin/reactivate' && req.method === 'POST') {
          if (!serverEngine.requireSuperAdmin(req, res)) return;
          const body = await parseJsonBody(req);
          const result = serverEngine.handleReactivateAdmin(body.email || body.targetEmail, body.reason, actorEmail);
          res.writeHead(result.success ? 200 : 400);
          return res.end(JSON.stringify(result));
        }

        if (url === '/api/admin/audit-logs' && req.method === 'GET') {
          if (!serverEngine.requireSuperAdmin(req, res)) return;
          res.writeHead(200);
          return res.end(JSON.stringify({ auditLogs: serverEngine.getAuthoritativeState().adminAuditLogs }));
        }

        if (url === '/api/admin/authorizations' && req.method === 'GET') {
          if (!serverEngine.requireSuperAdmin(req, res)) return;
          res.writeHead(200);
          return res.end(JSON.stringify({ authorizations: serverEngine.getAuthoritativeState().adminAuthorizations }));
        }

        // Backward compatibility routes for existing verification handlers (all guarded by requireSuperAdmin)
        if (url === '/api/admin/verification/approve' && req.method === 'POST') {
          if (!serverEngine.requireSuperAdmin(req, res)) return;
          const body = await parseJsonBody(req);
          const result = serverEngine.handleVerifyAdminByEmail(body.email || body.targetEmail, body.role || 'ADMIN', actorEmail);
          res.writeHead(result.success ? 200 : 400);
          return res.end(JSON.stringify(result));
        }

        if (url === '/api/admin/verification/suspend' && req.method === 'POST') {
          if (!serverEngine.requireSuperAdmin(req, res)) return;
          const body = await parseJsonBody(req);
          const result = serverEngine.handleSuspendAdmin(body.email || body.targetEmail, body.reason, actorEmail);
          res.writeHead(result.success ? 200 : 400);
          return res.end(JSON.stringify(result));
        }

        if (url === '/api/admin/verification/reactivate' && req.method === 'POST') {
          if (!serverEngine.requireSuperAdmin(req, res)) return;
          const body = await parseJsonBody(req);
          const result = serverEngine.handleReactivateAdmin(body.email || body.targetEmail, body.reason, actorEmail);
          res.writeHead(result.success ? 200 : 400);
          return res.end(JSON.stringify(result));
        }

        // Standard ADMIN protected routes
        if (!serverEngine.requireAdmin(req, res)) {
          return;
        }

        if (url === '/api/admin/event/status' && req.method === 'POST') {
          const body = await parseJsonBody(req);
          serverEngine.handleStatusChange(body.status, actorEmail);
          res.writeHead(200);
          return res.end(JSON.stringify({ success: true, status: body.status }));
        }

        if (url === '/api/admin/event/clock' && req.method === 'POST') {
          const body = await parseJsonBody(req);
          if (body.action === 'TOGGLE') {
            serverEngine.handleClockToggle(actorEmail);
          } else if (body.action === 'RESET') {
            serverEngine.handleClockReset(body.minutes || 25, actorEmail);
          }
          res.writeHead(200);
          return res.end(JSON.stringify({ success: true }));
        }

        if (url === '/api/admin/market/price' && req.method === 'POST') {
          const body = await parseJsonBody(req);
          const ok = serverEngine.handlePriceChange(body.sku, body.price, actorEmail);
          res.writeHead(ok ? 200 : 400);
          return res.end(JSON.stringify({ success: ok }));
        }

        if (url === '/api/admin/market/stock' && req.method === 'POST') {
          const body = await parseJsonBody(req);
          const ok = serverEngine.handleStockChange(body.sku, body.delta, actorEmail);
          res.writeHead(ok ? 200 : 400);
          return res.end(JSON.stringify({ success: ok }));
        }

        if (url === '/api/admin/crisis/dispatch' && req.method === 'POST') {
          const body = await parseJsonBody(req);
          const crisis = serverEngine.handleCrisisDispatch(body.teamId, body.crisisId, actorEmail);
          res.writeHead(200);
          return res.end(JSON.stringify({ success: true, crisis }));
        }

        if (url === '/api/admin/auction/open' && req.method === 'POST') {
          const body = await parseJsonBody(req);
          const auc = serverEngine.handleAuctionOpen(body.title, body.description, body.itemSku, body.minBid, body.durationMinutes, actorEmail);
          res.writeHead(200);
          return res.end(JSON.stringify({ success: true, auction: auc }));
        }

        if (url === '/api/admin/auction/close' && req.method === 'POST') {
          const auc = serverEngine.handleAuctionClose(actorEmail);
          res.writeHead(200);
          return res.end(JSON.stringify({ success: true, auction: auc }));
        }

        if (url === '/api/admin/finance/adjust' && req.method === 'POST') {
          const body = await parseJsonBody(req);
          const entry = serverEngine.handleManualAdjustment(body.teamId, body.type, body.amount, body.reason, actorEmail);
          res.writeHead(200);
          return res.end(JSON.stringify({ success: true, entry }));
        }

        if (url === '/api/admin/finance/loan' && req.method === 'POST') {
          const body = await parseJsonBody(req);
          const entry = serverEngine.handleLoanGrant(body.teamId, body.principal, body.interestPct, actorEmail);
          res.writeHead(200);
          return res.end(JSON.stringify({ success: true, entry }));
        }

        if (url === '/api/admin/announcements' && req.method === 'POST') {
          const body = await parseJsonBody(req);
          const ann = serverEngine.handleAnnouncement(body.title, body.content, body.type, actorEmail);
          res.writeHead(200);
          return res.end(JSON.stringify({ success: true, announcement: ann }));
        }

        if (url === '/api/admin/reset' && req.method === 'POST') {
          serverEngine.handleReset();
          res.writeHead(200);
          return res.end(JSON.stringify({ success: true }));
        }
      }

      // --- PARTICIPANT & CLIENT APIS ---
      if (url === '/api/participant/admin-apply') {
        res.writeHead(403);
        return res.end(JSON.stringify({
          error: 'Admin self-application is disabled. Administrator authorization is granted directly by the Super Admin.',
        }));
      }

      if (url === '/api/participant/purchase' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const userEmail = (req.headers['x-user-email'] as string) || body.actorEmail || 'participant';
        const userRole = (req.headers['x-user-role'] as string) || body.actorRole || 'CFO';
        const result = serverEngine.handlePurchase(
          body.teamId,
          body.sku,
          body.idempotencyKey || 'idemp-' + Date.now(),
          userEmail,
          userRole
        );
        res.writeHead(result.success ? 200 : 400);
        return res.end(JSON.stringify(result));
      }

      if (url === '/api/participant/crisis/response' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const userEmail = (req.headers['x-user-email'] as string) || 'participant';
        const result = serverEngine.handleCrisisResponse(body.teamId, body.optionId, body.tradeoff, userEmail);
        res.writeHead(result.success ? 200 : 400);
        return res.end(JSON.stringify(result));
      }

      if (url === '/api/participant/auction/bid' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const userEmail = (req.headers['x-user-email'] as string) || 'participant';
        const result = serverEngine.handleAuctionBid(body.teamId, body.teamName, body.amount, userEmail);
        res.writeHead(result.success ? 200 : 400);
        return res.end(JSON.stringify(result));
      }

      if (url === '/api/judge/score' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const userEmail = (req.headers['x-user-email'] as string) || 'judge';
        const score = serverEngine.handleJudgeScore(body, userEmail);
        res.writeHead(200);
        return res.end(JSON.stringify({ success: true, score }));
      }

      // Route not found in /api
      if (!res.headersSent) {
        res.writeHead(404);
        return res.end(JSON.stringify({ error: 'Endpoint not found' }));
      }
    } catch (err: any) {
      if (!res.headersSent) {
        res.writeHead(500);
        return res.end(JSON.stringify({ error: err.message || 'Internal server error' }));
      }
    }
  })();
}
