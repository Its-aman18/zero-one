import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  CodeScrietUser,
  SimulationRole,
  Team,
  EventStatus,
  EventConfig,
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
  LedgerSource,
  JudgingCriteria,
  AdminApplication,
  AdminAuthorization,
  AdminAuditLogEntry,
  AdminAuthorizationStatus,
  AdminPermissionRole,
} from '../types';
import {
  DEFAULT_CONFIG,
  INITIAL_MARKET_ITEMS,
  INITIAL_CRISIS_CARDS,
  INITIAL_TEAMS,
  DEFAULT_JUDGING_CRITERIA,
} from './mockData';
import {
  BOOTSTRAP_ADMIN_EMAIL,
  INITIAL_ADMIN_AUTHORIZATIONS,
  INITIAL_ADMIN_APPLICATIONS,
  INITIAL_ADMIN_AUDIT_LOGS,
} from './adminAuthService';
import { realtimeBus } from './eventBus';

export interface LiveScreenConfig {
  showLeaderboard: boolean;
  showCrisisGrid: boolean;
  showMarketTicker: boolean;
  announcementTickerText: string;
  presentationMode: 'NORMAL' | 'LOCKDOWN' | 'QUALIFIERS' | 'REVEAL';
}

interface SimulationContextType {
  // Auth & SSO
  currentUser: CodeScrietUser;
  authToken: string | null;
  currentRole: SimulationRole | 'ADMIN' | 'JUDGE' | 'MARSHAL' | 'PUBLIC';
  setCurrentRole: (role: SimulationRole | 'ADMIN' | 'JUDGE' | 'MARSHAL' | 'PUBLIC') => void;
  switchUser: (user: CodeScrietUser, role: SimulationRole | 'ADMIN' | 'JUDGE' | 'MARSHAL' | 'PUBLIC') => void;
  isLoggedIn: boolean;
  logout: () => void;

  // Event & Clock
  eventStatus: EventStatus;
  setEventStatus: (status: EventStatus) => void;
  eventConfig: EventConfig;
  updateEventConfig: (newConfig: Partial<EventConfig>) => void;
  serverTimeRemainingSeconds: number;
  isClockRunning: boolean;
  toggleClock: () => void;
  resetClock: (minutes?: number) => void;
  isLockdownActive: boolean;
  triggerLockdown: () => void;

  // Teams & Active Team
  teams: Team[];
  currentTeam: Team;
  setCurrentTeamId: (teamId: string) => void;
  updateTeam: (teamId: string, updates: Partial<Team>) => void;
  reissueRoleToDevice: (teamId: string, role: SimulationRole, targetDisplayName: string) => boolean;

  // Ledger & Finance
  ledger: LedgerEntry[];
  getBalance: (teamId?: string) => number;
  getRunwayMonths: (teamId?: string) => number;
  getFinancialHealthBand: (teamId?: string) => 'HEALTHY' | 'WATCH' | 'CRITICAL';
  manualLedgerAdjustment: (teamId: string, type: 'CREDIT' | 'DEBIT', amount: number, reason: string) => void;
  grantLoan: (teamId: string, principal: number, interestPct: number) => void;

  // Market & Purchases
  marketItems: MarketItem[];
  inventory: InventoryItem[];
  purchaseProposals: PurchaseProposal[];
  proposePurchase: (sku: string, reasonCategory: PurchaseProposal['reasonCategory']) => { success: boolean; message: string; proposalId?: string };
  approveProposal: (proposalId: string) => { success: boolean; message: string };
  rejectProposal: (proposalId: string, note?: string) => { success: boolean; message: string };
  reversePurchase: (ledgerEntryId: string) => { success: boolean; message: string };
  addMarketItem: (item: MarketItem) => void;
  updateMarketItem: (sku: string, updates: Partial<MarketItem>) => void;
  adjustStock: (sku: string, delta: number) => void;

  // Crisis Engine
  crisisCards: CrisisCard[];
  activeCrisis: CrisisAssignment | null;
  addCrisisCard: (card: CrisisCard) => void;
  updateCrisisCard: (id: string, updates: Partial<CrisisCard>) => void;
  dispatchCrisisToTeam: (teamId: string, crisisId: string) => void;
  extendCrisisTimer: (secondsToAdd: number) => void;
  resolveCrisisManually: (teamId: string, reason: string) => void;
  submitCrisisResponse: (optionId: string, tradeoff: string) => { success: boolean; message: string };

  // Canvas & Artifacts
  canvas: StartupCanvas;
  updateCanvasField: (field: keyof Omit<StartupCanvas, 'teamId' | 'lastSavedAt' | 'lastSavedBy' | 'version'>, value: string) => void;
  artifacts: ArtifactSubmission[];
  submitArtifact: (submission: Omit<ArtifactSubmission, 'id' | 'submittedAt'>) => void;

  // Auction & Trade
  activeAuction: Auction | null;
  auctionBids: AuctionBid[];
  openAuction: (title: string, description: string, itemSku: string, minBid: number, durationMinutes: number) => void;
  closeAuction: () => { winnerTeamName?: string; winningBid?: number };
  placeAuctionBid: (auctionId: string, amount: number) => { success: boolean; message: string };
  trades: TradeOffer[];
  proposeTrade: (toTeamId: string, itemSku: string, requestedCash: number) => { success: boolean; message: string };
  acceptTrade: (tradeId: string) => { success: boolean; message: string };

  // Judging & Scoring
  judgingCriteria: JudgingCriteria[];
  updateJudgingCriterion: (id: string, updates: Partial<JudgingCriteria>) => void;
  judgeScores: JudgeScore[];
  submitJudgeScore: (score: Omit<JudgeScore, 'id' | 'submittedAt'>) => void;
  floorScores: FloorScore[];
  recalculateFloorScores: () => void;

  // Live Screen & Announcements
  liveScreenConfig: LiveScreenConfig;
  updateLiveScreenConfig: (cfg: Partial<LiveScreenConfig>) => void;
  announcements: Announcement[];
  addAnnouncement: (title: string, content: string, type?: Announcement['type']) => void;

  // Audit Logs
  auditLogs: AuditLog[];
  logAuditAction: (action: string, target: string, details: string, source?: LedgerSource) => void;

  // Rehearsals & Disaster Recovery
  resetAndReseedSimulation: () => void;
  createSnapshot: () => string;
  restoreSnapshot: (snapshotJson: string) => boolean;

  // Admin Authorization & Verification System (Authoritative Single Source of Truth)
  adminAuthorizations: AdminAuthorization[];
  adminApplications: AdminApplication[];
  adminAuditLogs: AdminAuditLogEntry[];
  getAdminStatus: (userIdOrEmail?: string) => AdminAuthorizationStatus;
  isAdminVerified: (userIdOrEmail?: string) => boolean;
  isSuperAdmin: (userIdOrEmail?: string) => boolean;
  submitAdminApplication: (data: { reason: string; requestedRole: AdminPermissionRole }) => { success: boolean; message: string };
  approveAdminApplication: (applicationId: string, role?: AdminPermissionRole) => { success: boolean; message: string };
  rejectAdminApplication: (applicationId: string, reason?: string) => { success: boolean; message: string };
  suspendAdminAccess: (targetUserIdOrEmail: string, reason?: string) => { success: boolean; message: string };
  reactivateAdminAccess: (targetUserIdOrEmail: string, reason?: string) => { success: boolean; message: string };
  loginWithEmail: (email: string, name?: string) => void;
  adminNotification: { title: string; message: string; type: 'info' | 'success' | 'warning' | 'error' } | null;
  dismissAdminNotification: () => void;
}

const STORAGE_PREFIX = 'zero_one_v1_';

export const SimulationContext = createContext<SimulationContextType | null>(null);

export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Auth & SSO Initial State - Default is normal student/member
  const [currentUser, setCurrentUser] = useState<CodeScrietUser>(() => {
    return {
      id: 'usr-aman-student',
      name: 'Aman Gupta',
      email: 'aman@scriet.edu',
      role: 'MEMBER',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    };
  });

  const [currentRole, setCurrentRole] = useState<SimulationRole | 'ADMIN' | 'JUDGE' | 'MARSHAL' | 'PUBLIC'>('CEO');
  const [authToken, setAuthToken] = useState<string | null>(() => {
    return localStorage.getItem('token') || sessionStorage.getItem('token') || 'mock-jwt-token-scriet-sso';
  });

  // Authoritative Server-Side Admin Authorization, Applications & Audit Logs
  const [adminAuthorizations, setAdminAuthorizations] = useState<AdminAuthorization[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'admin_authorizations');
    return saved ? JSON.parse(saved) : INITIAL_ADMIN_AUTHORIZATIONS;
  });

  const [adminApplications, setAdminApplications] = useState<AdminApplication[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'admin_applications');
    return saved ? JSON.parse(saved) : INITIAL_ADMIN_APPLICATIONS;
  });

  const [adminAuditLogs, setAdminAuditLogs] = useState<AdminAuditLogEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'admin_audit_logs');
    return saved ? JSON.parse(saved) : INITIAL_ADMIN_AUDIT_LOGS;
  });

  const [adminNotification, setAdminNotification] = useState<{
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
  } | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'admin_authorizations', JSON.stringify(adminAuthorizations));
  }, [adminAuthorizations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'admin_applications', JSON.stringify(adminApplications));
  }, [adminApplications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'admin_audit_logs', JSON.stringify(adminAuditLogs));
  }, [adminAuditLogs]);

  // 2. Event Configuration & State
  const [eventConfig, setEventConfig] = useState<EventConfig>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'config');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });

  const [eventStatus, setEventStatusState] = useState<EventStatus>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'status');
    return (saved as EventStatus) || 'ROUND_2';
  });

  // Server Authoritative Countdown Clock
  const [serverTimeRemainingSeconds, setServerTimeRemainingSeconds] = useState<number>(522); // 08:42
  const [isClockRunning, setIsClockRunning] = useState<boolean>(true);
  const [isLockdownActive, setIsLockdownActive] = useState<boolean>(false);

  // 3. Teams State
  const [teams, setTeams] = useState<Team[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'teams');
    return saved ? JSON.parse(saved) : INITIAL_TEAMS;
  });
  const [currentTeamId, setCurrentTeamId] = useState<string>('team-07');

  // 4. Financial Ledger (Append-Only)
  const [ledger, setLedger] = useState<LedgerEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'ledger');
    if (saved) return JSON.parse(saved);

    const now = new Date();
    return [
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
      {
        id: 'led-crisis-07',
        teamId: 'team-07',
        type: 'CREDIT',
        amount: 50000,
        reasonTag: 'CRISIS_REWARD',
        description: 'Solved minor crisis bonus award',
        round: 'Round 1',
        actorMemberId: 'mem-1',
        actorRole: 'CEO',
        idempotencyKey: 'idemp-crisis-bonus-07',
        source: 'APP',
        createdAt: new Date(now.getTime() - 7200000).toISOString(),
      },
      {
        id: 'led-tools-07',
        teamId: 'team-07',
        type: 'DEBIT',
        amount: 145000,
        reasonTag: 'PURCHASE',
        description: 'Tooling & Infrastructure Provisioning',
        round: 'Round 2',
        actorMemberId: 'mem-2',
        actorRole: 'CFO',
        idempotencyKey: 'idemp-tools-07',
        source: 'APP',
        createdAt: new Date(now.getTime() - 3600000).toISOString(),
      },
    ];
  });

  // 5. Market Items & Inventory
  const [marketItems, setMarketItems] = useState<MarketItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'market');
    return saved ? JSON.parse(saved) : INITIAL_MARKET_ITEMS;
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'inventory');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'inv-1',
        teamId: 'team-07',
        sku: 'DEVELOPER-HIRE',
        name: 'Senior Fullstack Dev',
        category: 'Human Resources',
        qty: 1,
        acquiredPrice: 120000,
        acquiredAt: new Date(Date.now() - 900000).toISOString(),
        round: 'Round 1',
        effectApplied: true,
      },
      {
        id: 'inv-2',
        teamId: 'team-07',
        sku: 'MKT-CAMPAIGN',
        name: 'Marketing Campaign',
        category: 'Marketing',
        qty: 1,
        acquiredPrice: 45000,
        acquiredAt: new Date(Date.now() - 120000).toISOString(),
        round: 'Round 2',
        effectApplied: true,
      },
      {
        id: 'inv-3',
        teamId: 'team-07',
        sku: 'CLOUD-CREDITS',
        name: 'Cloud Credits',
        category: 'Infrastructure',
        qty: 2,
        acquiredPrice: 96000,
        acquiredAt: new Date(Date.now() - 3600000).toISOString(),
        round: 'Round 1',
        effectApplied: true,
      },
    ];
  });

  const [purchaseProposals, setPurchaseProposals] = useState<PurchaseProposal[]>([]);

  // 6. Crisis Cards & Active Crisis Engine
  const [crisisCards, setCrisisCards] = useState<CrisisCard[]>(INITIAL_CRISIS_CARDS);
  const [activeCrisis, setActiveCrisis] = useState<CrisisAssignment | null>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'crisis');
    if (saved) return JSON.parse(saved);
    const crisisCard = INITIAL_CRISIS_CARDS[0];
    return {
      id: 'assign-01',
      teamId: 'team-07',
      crisisId: crisisCard.id,
      crisis: crisisCard,
      dispatchedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 255000).toISOString(), // 04:15
      status: 'ACTIVE',
    };
  });

  // 7. Startup Canvas
  const [canvas, setCanvas] = useState<StartupCanvas>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'canvas');
    if (saved) return JSON.parse(saved);
    return {
      teamId: 'team-07',
      problem: 'Engineering and college students waste over ₹4,000 each semester on expensive physical textbooks and single-use lab equipment that sits idle after exams.',
      customer: 'Undergraduate students (Year 1-4) in tier-2 and tier-3 colleges in India with limited campus bookstore inventory.',
      solution: 'A localized peer-to-peer rental and buyback escrow marketplace with automated return verification and campus locker pickup points.',
      usp: 'Zero courier latency via on-campus peer verification; 70% cheaper than Amazon or retail.',
      revenueModel: '12% escrow commission per peer rental + ₹150 premium semester insurance pass.',
      costStructure: 'Server hosting, student campus ambassador honorariums, payment gateway fees (2%), verification lockers.',
      marketingStrategy: 'Campus tech club partnerships, orientation week flyer QR codes, and referral textbook credits.',
      competitors: 'WhatsApp student buy/sell groups, OLX, local second-hand book stalls.',
      traction: '140 early user signups in pre-registration; 42 physical textbooks pledged for launch.',
      businessAssumptions: 'Students are willing to rent to batchmates if deposits are securely escrowed.',
      lastSavedAt: new Date().toISOString(),
      lastSavedBy: 'Aman Gupta (CEO)',
      version: 3,
    };
  });

  // 8. Artifacts & Submissions
  const [artifacts, setArtifacts] = useState<ArtifactSubmission[]>([
    {
      id: 'art-1',
      teamId: 'team-07',
      kind: 'PROTOTYPE',
      title: 'InnovateX Mobile Web App v1',
      url: 'https://innovatex-scriet.vercel.app',
      description: 'Interactive high-fidelity prototype allowing textbook listing and peer checkout.',
      submittedBy: 'Rohan Verma (CTO)',
      submittedAt: new Date(Date.now() - 1800000).toISOString(),
    },
  ]);

  // 9. Auctions & Trading Desk
  const [activeAuction, setActiveAuction] = useState<Auction | null>({
    id: 'auc-01',
    title: 'Exclusive Campus Hub Distribution Rights',
    description: 'Grants exclusive rights to place verified pickup lockers across the main academic building for the entire simulation.',
    itemSku: 'CAMPUS-LOCKER-RIGHTS',
    minimumBid: 150000,
    status: 'OPEN',
    opensAt: new Date(Date.now() - 300000).toISOString(),
    closesAt: new Date(Date.now() + 600000).toISOString(),
  });

  const [auctionBids, setAuctionBids] = useState<AuctionBid[]>([
    {
      id: 'bid-seed-1',
      auctionId: 'auc-01',
      teamId: 'team-01',
      teamName: 'TechNova',
      amount: 165000,
      submittedAt: new Date(Date.now() - 120000).toISOString(),
      idempotencyKey: 'idemp-bid-seed-1',
    },
    {
      id: 'bid-seed-2',
      auctionId: 'auc-01',
      teamId: 'team-02',
      teamName: 'AgriNext',
      amount: 175000,
      submittedAt: new Date(Date.now() - 60000).toISOString(),
      idempotencyKey: 'idemp-bid-seed-2',
    },
  ]);

  const [trades, setTrades] = useState<TradeOffer[]>([]);

  // 10. Judging & Floor Scores
  const [judgingCriteria, setJudgingCriteria] = useState<JudgingCriteria[]>(DEFAULT_JUDGING_CRITERIA);
  const [judgeScores, setJudgeScores] = useState<JudgeScore[]>([
    {
      id: 'jscore-1',
      judgeId: 'judge-1',
      judgeName: 'Prof. S. K. Sharma (External VC)',
      teamId: 'team-07',
      scores: {
        'crit-problem': 14,
        'crit-innovation': 14,
        'crit-business': 19,
        'crit-finance': 14,
        'crit-crisis': 14,
        'crit-pitch': 9,
        'crit-feasibility': 9,
      },
      feedback: 'Outstanding financial discipline and crisp unit economics justification.',
      totalScore: 93,
      submittedAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ]);

  const [floorScores, setFloorScores] = useState<FloorScore[]>([
    { teamId: 'team-07', solvency: 5, reserveBand: 4, allocationSpread: 5, responseTimeliness: 4, tradeoffNamed: 5, decisionConsistency: 4, total: 27 },
    { teamId: 'team-01', solvency: 5, reserveBand: 5, allocationSpread: 4, responseTimeliness: 5, tradeoffNamed: 4, decisionConsistency: 5, total: 28 },
    { teamId: 'team-02', solvency: 4, reserveBand: 4, allocationSpread: 4, responseTimeliness: 4, tradeoffNamed: 4, decisionConsistency: 4, total: 24 },
  ]);

  // 11. Live Screen Config
  const [liveScreenConfig, setLiveScreenConfig] = useState<LiveScreenConfig>({
    showLeaderboard: true,
    showCrisisGrid: true,
    showMarketTicker: true,
    announcementTickerText: 'ZERO → ONE ROUND 2 ACTIVE • DIGITAL MARKET OPEN • CRISIS TIMER SYNCED',
    presentationMode: 'NORMAL',
  });

  // 12. Announcements & Audit Logs
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: 'ann-1',
      title: 'Round 2: Build & Grow is now LIVE!',
      content: 'Digital Market inventory restocked with dynamic demand modifiers. Review your team runway.',
      type: 'ROUND_CHANGE',
      timestamp: new Date(Date.now() - 900000).toISOString(),
    },
    {
      id: 'ann-2',
      title: 'Market Alert: Cloud Credits Demand Surge',
      content: 'Cloud Credits aggregate purchase has triggered a +20% surge due to infrastructure scarcity.',
      type: 'ALERT',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
  ]);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    {
      id: 'audit-01',
      actor: 'Admin',
      role: 'ADMIN',
      action: 'EVENT_STATE_CHANGED',
      target: 'ALL_TEAMS',
      details: 'Advanced state to ROUND_2 (Build & Grow)',
      timestamp: new Date(Date.now() - 900000).toISOString(),
      source: 'ADMIN',
    },
  ]);

  // Real-Time Bus Subscription for Cross-Tab / Cross-Window Sync
  useEffect(() => {
    const unsub = realtimeBus.on('*', (evt) => {
      if (evt.type === 'EVENT_STATE_CHANGED') {
        setEventStatusState(evt.payload.status);
      } else if (evt.type === 'CLOCK_SYNC') {
        setServerTimeRemainingSeconds(evt.payload.seconds);
        setIsClockRunning(evt.payload.isRunning);
      } else if (evt.type === 'LOCKDOWN_TRIGGERED') {
        setIsLockdownActive(true);
        setEventStatusState('LOCKDOWN');
      } else if (evt.type === 'SIMULATION_RESET') {
        setTeams(INITIAL_TEAMS);
        setMarketItems(INITIAL_MARKET_ITEMS);
        setPurchaseProposals([]);
      }
    });

    return unsub;
  }, []);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'teams', JSON.stringify(teams));
  }, [teams]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'ledger', JSON.stringify(ledger));
  }, [ledger]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'canvas', JSON.stringify(canvas));
  }, [canvas]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'status', eventStatus);
  }, [eventStatus]);

  // Active Team calculation
  const currentTeam = useMemo(() => {
    return teams.find((t) => t.id === currentTeamId) || teams[0];
  }, [teams, currentTeamId]);

  // Server clock timer interval
  useEffect(() => {
    if (!isClockRunning || isLockdownActive) return;
    const interval = setInterval(() => {
      setServerTimeRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isClockRunning, isLockdownActive]);

  // Helper: Append-only balance calculation
  const getBalance = useCallback(
    (teamId?: string): number => {
      const targetId = teamId || currentTeamId;
      return ledger
        .filter((entry) => entry.teamId === targetId)
        .reduce((acc, entry) => {
          return entry.type === 'CREDIT' ? acc + entry.amount : acc - entry.amount;
        }, 0);
    },
    [ledger, currentTeamId]
  );

  // Helper: Runway calculation
  const getRunwayMonths = useCallback(
    (teamId?: string): number => {
      const balance = getBalance(teamId);
      const monthlyBurn = 120000;
      return Math.max(0, Number((balance / monthlyBurn).toFixed(1)));
    },
    [getBalance]
  );

  // Helper: Financial Health Band
  const getFinancialHealthBand = useCallback(
    (teamId?: string): 'HEALTHY' | 'WATCH' | 'CRITICAL' => {
      const balance = getBalance(teamId);
      if (balance >= 500000) return 'HEALTHY';
      if (balance >= 200000) return 'WATCH';
      return 'CRITICAL';
    },
    [getBalance]
  );

  // Audit Logger
  const logAuditAction = useCallback(
    (action: string, target: string, details: string, source: LedgerSource = 'APP') => {
      const newLog: AuditLog = {
        id: 'audit-' + Math.random().toString(36).substring(2, 9),
        actor: currentUser.name,
        role: currentRole,
        action,
        target,
        details,
        timestamp: new Date().toISOString(),
        source,
      };
      setAuditLogs((prev) => [newLog, ...prev]);
    },
    [currentUser.name, currentRole]
  );

  // Set Event Status and Broadcast
  const setEventStatus = useCallback(
    (status: EventStatus) => {
      setEventStatusState(status);
      realtimeBus.emit('EVENT_STATE_CHANGED', { status }, currentUser.name);
      logAuditAction('EVENT_STATE_CHANGED', 'ALL_SYSTEMS', `Advanced state to ${status}`, 'ADMIN');
    },
    [currentUser.name, logAuditAction]
  );

  // Clock operations
  const toggleClock = useCallback(() => {
    setIsClockRunning((prev) => {
      const next = !prev;
      realtimeBus.emit('CLOCK_SYNC', { seconds: serverTimeRemainingSeconds, isRunning: next }, currentUser.name);
      return next;
    });
  }, [serverTimeRemainingSeconds, currentUser.name]);

  const resetClock = useCallback(
    (minutes = 25) => {
      const secs = minutes * 60;
      setServerTimeRemainingSeconds(secs);
      realtimeBus.emit('CLOCK_SYNC', { seconds: secs, isRunning: isClockRunning }, currentUser.name);
      logAuditAction('CLOCK_RESET', 'CLOCK', `Reset clock to ${minutes} minutes`, 'ADMIN');
    },
    [isClockRunning, currentUser.name, logAuditAction]
  );

  // Team Update
  const updateTeam = useCallback((teamId: string, updates: Partial<Team>) => {
    setTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, ...updates } : t)));
  }, []);

  // Manual Administrative Financial Adjustments (Rule 7 & Rule 83)
  const manualLedgerAdjustment = useCallback(
    (teamId: string, type: 'CREDIT' | 'DEBIT', amount: number, reason: string) => {
      const entry: LedgerEntry = {
        id: 'led-adj-' + Math.random().toString(36).substring(2, 9),
        teamId,
        type,
        amount,
        reasonTag: 'MANUAL_ADJUSTMENT',
        description: `ADMIN OVERRIDE: ${reason}`,
        round: currentTeam.currentRound,
        actorMemberId: currentUser.id,
        actorRole: 'ADMIN',
        idempotencyKey: 'idemp-adj-' + Date.now(),
        source: 'ADMIN',
        createdAt: new Date().toISOString(),
      };

      setLedger((prev) => [entry, ...prev]);
      logAuditAction('MANUAL_BALANCE_ADJUSTMENT', teamId, `${type} of ₹${amount.toLocaleString('en-IN')}: ${reason}`, 'ADMIN');
      realtimeBus.emit('PURCHASE_COMMITTED', { entry }, currentUser.name);
    },
    [currentTeam.currentRound, currentUser.id, currentUser.name, logAuditAction]
  );

  // Grant Loan (Rule 32)
  const grantLoan = useCallback(
    (teamId: string, principal: number, interestPct: number) => {
      const entry: LedgerEntry = {
        id: 'led-loan-' + Math.random().toString(36).substring(2, 9),
        teamId,
        type: 'CREDIT',
        amount: principal,
        reasonTag: 'LOAN_DISBURSEMENT',
        description: `Bridge Loan Disbursed (Principal: ₹${principal.toLocaleString('en-IN')}, Interest: ${interestPct}%)`,
        round: currentTeam.currentRound,
        actorMemberId: currentUser.id,
        actorRole: 'ADMIN',
        idempotencyKey: 'idemp-loan-' + Date.now(),
        source: 'ADMIN',
        createdAt: new Date().toISOString(),
      };

      setLedger((prev) => [entry, ...prev]);
      logAuditAction('LOAN_CREATED', teamId, `Disbursed loan ₹${principal.toLocaleString('en-IN')} @ ${interestPct}%`, 'ADMIN');
      realtimeBus.emit('PURCHASE_COMMITTED', { entry }, currentUser.name);
    },
    [currentTeam.currentRound, currentUser.id, currentUser.name, logAuditAction]
  );

  // Propose Purchase Flow
  const proposePurchase = useCallback(
    (sku: string, reasonCategory: PurchaseProposal['reasonCategory']) => {
      if (isLockdownActive || eventStatus === 'LOCKDOWN') {
        return { success: false, message: 'Purchases are frozen during event LOCKDOWN.' };
      }

      const item = marketItems.find((i) => i.sku === sku);
      if (!item) return { success: false, message: 'Item not found in market registry.' };
      if (item.stockRemaining <= 0) return { success: false, message: 'Item is sold out! Stock exhausted.' };

      const balance = getBalance();
      if (balance < item.currentPrice) {
        return {
          success: false,
          message: `Insufficient virtual capital. Required: ₹${item.currentPrice.toLocaleString('en-IN')}, Available: ₹${balance.toLocaleString('en-IN')}.`,
        };
      }

      const proposalId = 'prop-' + Math.random().toString(36).substring(2, 9);
      const idempotencyKey = 'idemp-' + sku + '-' + Date.now();

      if (item.currentPrice >= eventConfig.twoKeyApprovalThreshold) {
        const proposal: PurchaseProposal = {
          id: proposalId,
          teamId: currentTeamId,
          sku: item.sku,
          itemName: item.name,
          proposedByMemberId: currentUser.id,
          proposedByRole: currentRole as SimulationRole,
          price: item.currentPrice,
          reasonCategory,
          status: 'PENDING_CEO_APPROVAL',
          idempotencyKey,
          proposedAt: new Date().toISOString(),
        };

        setPurchaseProposals((prev) => [proposal, ...prev]);
        realtimeBus.emit('PURCHASE_PROPOSED', { proposal }, currentUser.name);
        logAuditAction('PURCHASE_PROPOSED', item.name, `Proposed spending ₹${item.currentPrice.toLocaleString('en-IN')} on ${item.name} (${reasonCategory})`);
        return {
          success: true,
          message: `Proposal submitted! Purchases of ₹${item.currentPrice.toLocaleString('en-IN')} require CEO sign-off.`,
          proposalId,
        };
      }

      const ledgerEntry: LedgerEntry = {
        id: 'led-' + Math.random().toString(36).substring(2, 9),
        teamId: currentTeamId,
        type: 'DEBIT',
        amount: item.currentPrice,
        reasonTag: 'PURCHASE',
        description: `Purchased ${item.name} (${reasonCategory})`,
        round: currentTeam.currentRound,
        actorMemberId: currentUser.id,
        actorRole: currentRole as SimulationRole,
        idempotencyKey,
        source: 'APP',
        createdAt: new Date().toISOString(),
      };

      setMarketItems((prev) =>
        prev.map((i) => (i.sku === sku ? { ...i, stockRemaining: Math.max(0, i.stockRemaining - 1) } : i))
      );

      const newInvItem: InventoryItem = {
        id: 'inv-' + Math.random().toString(36).substring(2, 9),
        teamId: currentTeamId,
        sku: item.sku,
        name: item.name,
        category: item.category,
        qty: 1,
        acquiredPrice: item.currentPrice,
        acquiredAt: new Date().toISOString(),
        round: currentTeam.currentRound,
        effectApplied: true,
      };

      setLedger((prev) => [ledgerEntry, ...prev]);
      setInventory((prev) => [newInvItem, ...prev]);

      realtimeBus.emit('PURCHASE_COMMITTED', { ledgerEntry, inventoryItem: newInvItem }, currentUser.name);
      logAuditAction('PURCHASE_COMMITTED', item.name, `Bought ${item.name} for ₹${item.currentPrice.toLocaleString('en-IN')}`);

      return {
        success: true,
        message: `Successfully acquired ${item.name} for ₹${item.currentPrice.toLocaleString('en-IN')}!`,
      };
    },
    [isLockdownActive, eventStatus, marketItems, getBalance, eventConfig.twoKeyApprovalThreshold, currentTeamId, currentUser.id, currentUser.name, currentRole, currentTeam.currentRound, logAuditAction]
  );

  const approveProposal = useCallback(
    (proposalId: string) => {
      const proposal = purchaseProposals.find((p) => p.id === proposalId);
      if (!proposal) return { success: false, message: 'Proposal not found.' };

      const item = marketItems.find((i) => i.sku === proposal.sku);
      if (!item) return { success: false, message: 'Item no longer in market.' };
      if (item.stockRemaining <= 0) return { success: false, message: 'Stock exhausted while proposal was pending!' };

      const balance = getBalance(proposal.teamId);
      if (balance < proposal.price) {
        return { success: false, message: 'Insufficient virtual funds to commit this proposal.' };
      }

      const ledgerEntry: LedgerEntry = {
        id: 'led-' + Math.random().toString(36).substring(2, 9),
        teamId: proposal.teamId,
        type: 'DEBIT',
        amount: proposal.price,
        reasonTag: 'PURCHASE',
        description: `CEO Approved: ${proposal.itemName} (${proposal.reasonCategory})`,
        round: currentTeam.currentRound,
        actorMemberId: currentUser.id,
        actorRole: 'CEO',
        idempotencyKey: proposal.idempotencyKey,
        source: 'APP',
        createdAt: new Date().toISOString(),
      };

      setLedger((prev) => [ledgerEntry, ...prev]);
      setMarketItems((prev) =>
        prev.map((i) => (i.sku === proposal.sku ? { ...i, stockRemaining: Math.max(0, i.stockRemaining - 1) } : i))
      );

      const inv = {
        id: 'inv-' + Math.random().toString(36).substring(2, 9),
        teamId: proposal.teamId,
        sku: item.sku,
        name: item.name,
        category: item.category,
        qty: 1,
        acquiredPrice: proposal.price,
        acquiredAt: new Date().toISOString(),
        round: currentTeam.currentRound,
        effectApplied: true,
      };

      setInventory((prev) => [inv, ...prev]);
      setPurchaseProposals((prev) =>
        prev.map((p) => (p.id === proposalId ? { ...p, status: 'COMMITTED', decidedAt: new Date().toISOString() } : p))
      );

      realtimeBus.emit('PURCHASE_COMMITTED', { ledgerEntry, inventoryItem: inv }, currentUser.name);
      logAuditAction('PURCHASE_COMMITTED', proposal.itemName, `CEO Approved spending ₹${proposal.price.toLocaleString('en-IN')}`);

      return { success: true, message: `Proposal for ${proposal.itemName} approved and committed to ledger.` };
    },
    [purchaseProposals, marketItems, getBalance, currentTeam.currentRound, currentUser.id, currentUser.name, logAuditAction]
  );

  const rejectProposal = useCallback(
    (proposalId: string, note?: string) => {
      setPurchaseProposals((prev) =>
        prev.map((p) =>
          p.id === proposalId
            ? { ...p, status: 'REJECTED', rejectionNote: note || 'Declined by CEO', decidedAt: new Date().toISOString() }
            : p
        )
      );
      logAuditAction('PURCHASE_REJECTED', proposalId, `Rejected proposal. Note: ${note || 'None'}`);
      return { success: true, message: 'Proposal rejected.' };
    },
    [logAuditAction]
  );

  const reversePurchase = useCallback(
    (ledgerEntryId: string) => {
      const originalEntry = ledger.find((e) => e.id === ledgerEntryId);
      if (!originalEntry) return { success: false, message: 'Original transaction not found.' };
      if (originalEntry.type !== 'DEBIT') return { success: false, message: 'Only debit purchases can be reversed.' };

      const timeDiffSeconds = (Date.now() - new Date(originalEntry.createdAt).getTime()) / 1000;
      if (timeDiffSeconds > eventConfig.undoWindowSeconds) {
        return {
          success: false,
          message: `Undo window expired (${Math.round(timeDiffSeconds)}s > ${eventConfig.undoWindowSeconds}s). Contact a Marshal for emergency adjustment.`,
        };
      }

      const reversalEntry: LedgerEntry = {
        id: 'led-rev-' + Math.random().toString(36).substring(2, 9),
        teamId: originalEntry.teamId,
        type: 'CREDIT',
        amount: originalEntry.amount,
        reasonTag: 'REVERSAL',
        description: `REVERSAL of ${originalEntry.description}`,
        round: originalEntry.round,
        actorMemberId: currentUser.id,
        actorRole: currentRole as SimulationRole,
        idempotencyKey: 'idemp-rev-' + originalEntry.id,
        refEntryId: originalEntry.id,
        source: 'APP',
        createdAt: new Date().toISOString(),
      };

      setLedger((prev) => [reversalEntry, ...prev]);
      setInventory((prev) => {
        const idx = prev.findIndex((i) => i.teamId === originalEntry.teamId);
        if (idx !== -1) {
          const updated = [...prev];
          updated.splice(idx, 1);
          return updated;
        }
        return prev;
      });

      realtimeBus.emit('PURCHASE_REVERSED', { reversalEntry }, currentUser.name);
      logAuditAction('PURCHASE_REVERSED', originalEntry.id, `Reversed ₹${originalEntry.amount.toLocaleString('en-IN')}`);
      return { success: true, message: 'Purchase successfully reversed and credited back to capital.' };
    },
    [ledger, eventConfig.undoWindowSeconds, currentUser.id, currentUser.name, currentRole, logAuditAction]
  );

  // Market management (Admin)
  const addMarketItem = useCallback((item: MarketItem) => {
    setMarketItems((prev) => [...prev, item]);
  }, []);

  const updateMarketItem = useCallback((sku: string, updates: Partial<MarketItem>) => {
    setMarketItems((prev) => prev.map((i) => (i.sku === sku ? { ...i, ...updates } : i)));
  }, []);

  const adjustStock = useCallback((sku: string, delta: number) => {
    setMarketItems((prev) =>
      prev.map((i) => (i.sku === sku ? { ...i, stockRemaining: Math.max(0, i.stockRemaining + delta) } : i))
    );
  }, []);

  // Crisis operations
  const addCrisisCard = useCallback((card: CrisisCard) => {
    setCrisisCards((prev) => [...prev, card]);
  }, []);

  const updateCrisisCard = useCallback((id: string, updates: Partial<CrisisCard>) => {
    setCrisisCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }, []);

  const dispatchCrisisToTeam = useCallback(
    (teamId: string, crisisId: string) => {
      const card = crisisCards.find((c) => c.id === crisisId) || crisisCards[0];
      const newAssignment: CrisisAssignment = {
        id: 'assign-' + Math.random().toString(36).substring(2, 9),
        teamId,
        crisisId: card.id,
        crisis: card,
        dispatchedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + card.timerSeconds * 1000).toISOString(),
        status: 'ACTIVE',
      };
      setActiveCrisis(newAssignment);
      realtimeBus.emit('CRISIS_DISPATCHED', { assignment: newAssignment }, currentUser.name);
      logAuditAction('CRISIS_DISPATCHED', teamId, `Dispatched ${card.title} to ${teamId}`, 'ADMIN');
    },
    [crisisCards, currentUser.name, logAuditAction]
  );

  const extendCrisisTimer = useCallback(
    (secondsToAdd: number) => {
      if (!activeCrisis) return;
      const currentExpiry = new Date(activeCrisis.expiresAt).getTime();
      const updatedExpiry = new Date(currentExpiry + secondsToAdd * 1000).toISOString();
      setActiveCrisis((prev) => (prev ? { ...prev, expiresAt: updatedExpiry } : null));
      logAuditAction('CRISIS_TIMER_EXTENDED', activeCrisis.teamId, `Added ${secondsToAdd}s to crisis timer`, 'ADMIN');
    },
    [activeCrisis, logAuditAction]
  );

  const resolveCrisisManually = useCallback(
    (teamId: string, reason: string) => {
      if (!activeCrisis) return;
      setActiveCrisis((prev) => (prev ? { ...prev, status: 'RESOLVED', tradeoffGivenUp: `Manual: ${reason}` } : null));
      logAuditAction('CRISIS_RESOLVED_MANUALLY', teamId, reason, 'ADMIN');
    },
    [activeCrisis, logAuditAction]
  );

  const submitCrisisResponse = useCallback(
    (optionId: string, tradeoff: string) => {
      if (!activeCrisis) return { success: false, message: 'No active crisis found.' };

      const selectedOption = activeCrisis.crisis.options.find((o) => o.id === optionId);
      if (!selectedOption) return { success: false, message: 'Invalid response option selected.' };

      if (selectedOption.cost > 0) {
        const ledgerEntry: LedgerEntry = {
          id: 'led-crisis-' + Math.random().toString(36).substring(2, 9),
          teamId: currentTeamId,
          type: 'DEBIT',
          amount: selectedOption.cost,
          reasonTag: 'CRISIS_PENALTY',
          description: `Crisis Response: ${activeCrisis.crisis.title} (${selectedOption.label})`,
          round: currentTeam.currentRound,
          actorMemberId: currentUser.id,
          actorRole: currentRole as SimulationRole,
          idempotencyKey: 'idemp-crisis-' + activeCrisis.id + '-' + optionId,
          source: 'APP',
          createdAt: new Date().toISOString(),
        };
        setLedger((prev) => [ledgerEntry, ...prev]);
      }

      setTeams((prev) =>
        prev.map((t) => {
          if (t.id === currentTeamId) {
            const newHealth = Math.min(100, Math.max(10, t.healthScore + selectedOption.healthDelta));
            return { ...t, healthScore: newHealth };
          }
          return t;
        })
      );

      const resolved = {
        ...activeCrisis,
        status: 'RESOLVED' as const,
        selectedOptionId: optionId,
        tradeoffGivenUp: tradeoff,
        resolvedAt: new Date().toISOString(),
      };

      setActiveCrisis(resolved);
      realtimeBus.emit('CRISIS_RESPONSE_RECEIVED', { assignment: resolved }, currentUser.name);
      logAuditAction('CRISIS_RESPONSE_SUBMITTED', activeCrisis.crisis.title, `Selected: ${selectedOption.label}. Tradeoff: ${tradeoff}`);

      return { success: true, message: 'Crisis response submitted! Strategy logged and health updated.' };
    },
    [activeCrisis, currentTeamId, currentTeam.currentRound, currentUser.id, currentUser.name, currentRole, logAuditAction]
  );

  // Canvas update with autosave
  const updateCanvasField = useCallback(
    (field: keyof Omit<StartupCanvas, 'teamId' | 'lastSavedAt' | 'lastSavedBy' | 'version'>, value: string) => {
      setCanvas((prev) => {
        const updated = {
          ...prev,
          [field]: value,
          lastSavedAt: new Date().toISOString(),
          lastSavedBy: `${currentUser.name} (${currentRole})`,
          version: prev.version + 1,
        };
        realtimeBus.emit('CANVAS_UPDATED', { field, value, teamId: prev.teamId }, currentUser.name);
        return updated;
      });
    },
    [currentUser.name, currentRole]
  );

  // Artifact submission
  const submitArtifact = useCallback(
    (submission: Omit<ArtifactSubmission, 'id' | 'submittedAt'>) => {
      const newArt: ArtifactSubmission = {
        ...submission,
        id: 'art-' + Math.random().toString(36).substring(2, 9),
        submittedAt: new Date().toISOString(),
      };
      setArtifacts((prev) => [newArt, ...prev]);
      realtimeBus.emit('ARTIFACT_SUBMITTED', { artifact: newArt }, currentUser.name);
      logAuditAction('ARTIFACT_SUBMITTED', submission.title, `${submission.kind} submitted by ${submission.submittedBy}`);
    },
    [currentUser.name, logAuditAction]
  );

  // Auction launch & close
  const openAuction = useCallback(
    (title: string, description: string, itemSku: string, minBid: number, durationMinutes: number) => {
      const auc: Auction = {
        id: 'auc-' + Math.random().toString(36).substring(2, 9),
        title,
        description,
        itemSku,
        minimumBid: minBid,
        status: 'OPEN',
        opensAt: new Date().toISOString(),
        closesAt: new Date(Date.now() + durationMinutes * 60000).toISOString(),
      };
      setActiveAuction(auc);
      setAuctionBids([]);
      realtimeBus.emit('AUCTION_OPENED', { auction: auc }, currentUser.name);
      logAuditAction('AUCTION_OPENED', auc.id, `Opened auction "${title}" with min bid ₹${minBid}`, 'ADMIN');
    },
    [currentUser.name, logAuditAction]
  );

  const closeAuction = useCallback(() => {
    if (!activeAuction) return {};
    const sortedBids = [...auctionBids].sort((a, b) => b.amount - a.amount);
    const winner = sortedBids[0];

    const closedAuc: Auction = {
      ...activeAuction,
      status: 'CLOSED',
      winnerTeamId: winner?.teamId,
      winnerTeamName: winner?.teamName,
      winningBid: winner?.amount,
    };

    setActiveAuction(closedAuc);

    if (winner) {
      // Debit winning team
      const debitEntry: LedgerEntry = {
        id: 'led-auc-win-' + Math.random().toString(36).substring(2, 9),
        teamId: winner.teamId,
        type: 'DEBIT',
        amount: winner.amount,
        reasonTag: 'AUCTION_WIN',
        description: `Won Auction: ${activeAuction.title}`,
        round: currentTeam.currentRound,
        actorMemberId: 'system',
        actorRole: 'SYSTEM',
        idempotencyKey: 'idemp-auc-win-' + activeAuction.id,
        source: 'SYSTEM',
        createdAt: new Date().toISOString(),
      };
      setLedger((prev) => [debitEntry, ...prev]);
    }

    realtimeBus.emit('AUCTION_CLOSED', { auction: closedAuc }, currentUser.name);
    logAuditAction('AUCTION_CLOSED', activeAuction.id, `Closed auction. Winner: ${winner?.teamName || 'None'} @ ₹${winner?.amount || 0}`, 'ADMIN');

    return { winnerTeamName: winner?.teamName, winningBid: winner?.amount };
  }, [activeAuction, auctionBids, currentTeam.currentRound, currentUser.name, logAuditAction]);

  const placeAuctionBid = useCallback(
    (auctionId: string, amount: number) => {
      if (!activeAuction || activeAuction.id !== auctionId) {
        return { success: false, message: 'Auction is not active.' };
      }
      if (amount < activeAuction.minimumBid) {
        return { success: false, message: `Minimum bid is ₹${activeAuction.minimumBid.toLocaleString('en-IN')}.` };
      }
      const balance = getBalance();
      if (balance < amount) {
        return { success: false, message: 'Insufficient virtual funds for this bid.' };
      }

      const bid: AuctionBid = {
        id: 'bid-' + Math.random().toString(36).substring(2, 9),
        auctionId,
        teamId: currentTeamId,
        teamName: currentTeam.name,
        amount,
        submittedAt: new Date().toISOString(),
        idempotencyKey: 'idemp-bid-' + auctionId + '-' + Date.now(),
      };

      setAuctionBids((prev) => [bid, ...prev]);
      realtimeBus.emit('AUCTION_BID_RECEIVED', { bid }, currentUser.name);
      logAuditAction('BID_SUBMITTED', auctionId, `Placed sealed bid of ₹${amount.toLocaleString('en-IN')}`);
      return { success: true, message: `Sealed bid of ₹${amount.toLocaleString('en-IN')} submitted!` };
    },
    [activeAuction, getBalance, currentTeamId, currentTeam.name, currentUser.name, logAuditAction]
  );

  // Trade Desk
  const proposeTrade = useCallback(
    (toTeamId: string, itemSku: string, requestedCash: number) => {
      const toTeam = teams.find((t) => t.id === toTeamId);
      const invItem = inventory.find((i) => i.sku === itemSku && i.teamId === currentTeamId);
      if (!invItem) return { success: false, message: 'You do not own this item.' };

      const offer: TradeOffer = {
        id: 'trade-' + Math.random().toString(36).substring(2, 9),
        fromTeamId: currentTeamId,
        fromTeamName: currentTeam.name,
        toTeamId,
        toTeamName: toTeam?.name || toTeamId,
        offeredItemSku: itemSku,
        offeredItemName: invItem.name,
        requestedCashAmount: requestedCash,
        status: 'PROPOSED',
        proposedAt: new Date().toISOString(),
      };

      setTrades((prev) => [offer, ...prev]);
      realtimeBus.emit('TRADE_PROPOSED', { trade: offer }, currentUser.name);
      logAuditAction('TRADE_PROPOSED', toTeamId, `Offered ${invItem.name} for ₹${requestedCash.toLocaleString('en-IN')}`);
      return { success: true, message: `Trade offer sent to ${toTeam?.name || toTeamId}!` };
    },
    [teams, inventory, currentTeamId, currentTeam.name, currentUser.name, logAuditAction]
  );

  const acceptTrade = useCallback(
    (tradeId: string) => {
      const trade = trades.find((t) => t.id === tradeId);
      if (!trade) return { success: false, message: 'Trade not found.' };

      const debitEntry: LedgerEntry = {
        id: 'led-trade-deb-' + Math.random().toString(36).substring(2, 9),
        teamId: trade.toTeamId,
        type: 'DEBIT',
        amount: trade.requestedCashAmount,
        reasonTag: 'TRADE_PROCEEDS',
        description: `Bought ${trade.offeredItemName} from ${trade.fromTeamName}`,
        round: currentTeam.currentRound,
        actorMemberId: currentUser.id,
        actorRole: currentRole as SimulationRole,
        idempotencyKey: 'idemp-trade-deb-' + tradeId,
        source: 'APP',
        createdAt: new Date().toISOString(),
      };

      const creditEntry: LedgerEntry = {
        id: 'led-trade-cred-' + Math.random().toString(36).substring(2, 9),
        teamId: trade.fromTeamId,
        type: 'CREDIT',
        amount: trade.requestedCashAmount,
        reasonTag: 'TRADE_PROCEEDS',
        description: `Sold ${trade.offeredItemName} to ${trade.toTeamName}`,
        round: currentTeam.currentRound,
        actorMemberId: currentUser.id,
        actorRole: currentRole as SimulationRole,
        idempotencyKey: 'idemp-trade-cred-' + tradeId,
        source: 'APP',
        createdAt: new Date().toISOString(),
      };

      setLedger((prev) => [debitEntry, creditEntry, ...prev]);

      setInventory((prev) =>
        prev.map((item) =>
          item.sku === trade.offeredItemSku && item.teamId === trade.fromTeamId
            ? { ...item, teamId: trade.toTeamId }
            : item
        )
      );

      setTrades((prev) =>
        prev.map((t) => (t.id === tradeId ? { ...t, status: 'ACCEPTED', completedAt: new Date().toISOString() } : t))
      );

      realtimeBus.emit('TRADE_COMMITTED', { tradeId }, currentUser.name);
      logAuditAction('TRADE_COMMITTED', tradeId, `Completed trade between ${trade.fromTeamName} and ${trade.toTeamName}`);
      return { success: true, message: 'Trade completed atomically! Funds and inventory exchanged.' };
    },
    [trades, currentTeam.currentRound, currentUser.id, currentUser.name, currentRole, logAuditAction]
  );

  // Judge scoring
  const updateJudgingCriterion = useCallback((id: string, updates: Partial<JudgingCriteria>) => {
    setJudgingCriteria((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }, []);

  const submitJudgeScore = useCallback(
    (score: Omit<JudgeScore, 'id' | 'submittedAt'>) => {
      const newScore: JudgeScore = {
        ...score,
        id: 'jscore-' + Math.random().toString(36).substring(2, 9),
        submittedAt: new Date().toISOString(),
      };
      setJudgeScores((prev) => [newScore, ...prev]);
      realtimeBus.emit('SCORE_SUBMITTED', { score: newScore }, currentUser.name);
      logAuditAction('SCORE_SUBMITTED', score.teamId, `Judge ${score.judgeName} scored team ${score.teamId}: ${score.totalScore}/100`, 'ADMIN');
    },
    [currentUser.name, logAuditAction]
  );

  const recalculateFloorScores = useCallback(() => {
    const updated = teams.map((team) => {
      const bal = getBalance(team.id);
      const solvency = bal > 400000 ? 5 : bal > 200000 ? 4 : bal > 50000 ? 3 : 1;
      const reserveBand = bal > 600000 ? 5 : bal > 300000 ? 4 : 2;
      const allocationSpread = team.healthBreakdown.product > 60 && team.healthBreakdown.marketing > 60 ? 5 : 4;
      const responseTimeliness = team.activeCrisisId ? 3 : 5;
      const tradeoffNamed = 5;
      const decisionConsistency = 4;
      const total = solvency + reserveBand + allocationSpread + responseTimeliness + tradeoffNamed + decisionConsistency;
      return {
        teamId: team.id,
        solvency,
        reserveBand,
        allocationSpread,
        responseTimeliness,
        tradeoffNamed,
        decisionConsistency,
        total,
      };
    });
    setFloorScores(updated);
    logAuditAction('FLOOR_SCORES_RECALCULATED', 'ALL_TEAMS', 'Recalculated objective floor metrics across 10 teams', 'ADMIN');
  }, [teams, getBalance, logAuditAction]);

  // Announcements
  const addAnnouncement = useCallback(
    (title: string, content: string, type: Announcement['type'] = 'INFO') => {
      const ann: Announcement = {
        id: 'ann-' + Math.random().toString(36).substring(2, 9),
        title,
        content,
        type,
        timestamp: new Date().toISOString(),
      };
      setAnnouncements((prev) => [ann, ...prev]);
      realtimeBus.emit('ANNOUNCEMENT_BROADCAST', { announcement: ann }, currentUser.name);
      logAuditAction('ANNOUNCEMENT_POSTED', title, content, 'ADMIN');
    },
    [currentUser.name, logAuditAction]
  );

  // Marshal Reissue Role
  const reissueRoleToDevice = useCallback(
    (teamId: string, role: SimulationRole, targetDisplayName: string) => {
      setTeams((prev) =>
        prev.map((team) => {
          if (team.id === teamId) {
            const updatedMembers = team.members.map((m) => {
              if (m.role === role) {
                return {
                  ...m,
                  displayName: targetDisplayName,
                  deviceToken: 'dev-token-' + role.toLowerCase() + '-' + Date.now(),
                  lastActiveAt: new Date().toISOString(),
                };
              }
              return m;
            });
            return { ...team, members: updatedMembers };
          }
          return team;
        })
      );

      realtimeBus.emit('ROLE_REASSIGNED', { teamId, role, targetDisplayName }, currentUser.name);
      logAuditAction('ROLE_REASSIGNED', `${teamId}/${role}`, `Marshal reissued role ${role} to ${targetDisplayName}`, 'MARSHAL');
      return true;
    },
    [currentUser.name, logAuditAction]
  );

  // Lockdown
  const triggerLockdown = useCallback(() => {
    setIsLockdownActive(true);
    setEventStatusState('LOCKDOWN');
    addAnnouncement(
      'BOOKS CLOSED - ROOM LOCKDOWN',
      'Official server clock has closed all transactions. Financial mutations, market purchases, and trade desk are frozen.',
      'LOCKDOWN'
    );
    realtimeBus.emit('LOCKDOWN_TRIGGERED', {}, currentUser.name);
    logAuditAction('LOCKDOWN_STARTED', 'ALL', 'Lockdown started room-wide', 'ADMIN');
  }, [addAnnouncement, currentUser.name, logAuditAction]);

  // Rehearsal One-Click Reset & Reseed
  const resetAndReseedSimulation = useCallback(() => {
    localStorage.clear();
    setTeams(INITIAL_TEAMS);
    setMarketItems(INITIAL_MARKET_ITEMS);
    setPurchaseProposals([]);
    setAuctionBids([]);
    setTrades([]);
    setJudgeScores([]);
    setEventStatusState('ROUND_2');
    setIsLockdownActive(false);
    setServerTimeRemainingSeconds(522);
    setIsClockRunning(true);

    const now = new Date();
    setLedger([
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
        idempotencyKey: 'idemp-init-reset-07',
        source: 'SYSTEM',
        createdAt: now.toISOString(),
      },
    ]);

    realtimeBus.emit('SIMULATION_RESET', {}, currentUser.name);
    logAuditAction('EVENT_RESET_RESEEDED', 'ALL_SYSTEMS', '1-Click Rehearsal Reset & Reseed executed successfully', 'ADMIN');
  }, [currentUser.name, logAuditAction]);

  // Snapshotting
  const createSnapshot = useCallback(() => {
    const snapshot = {
      timestamp: new Date().toISOString(),
      eventStatus,
      eventConfig,
      teams,
      ledger,
      marketItems,
      inventory,
      crisisCards,
      canvas,
      judgeScores,
      floorScores,
      auditLogs,
    };
    return JSON.stringify(snapshot, null, 2);
  }, [eventStatus, eventConfig, teams, ledger, marketItems, inventory, crisisCards, canvas, judgeScores, floorScores, auditLogs]);

  const restoreSnapshot = useCallback(
    (snapshotJson: string) => {
      try {
        const data = JSON.parse(snapshotJson);
        if (data.teams) setTeams(data.teams);
        if (data.ledger) setLedger(data.ledger);
        if (data.marketItems) setMarketItems(data.marketItems);
        if (data.inventory) setInventory(data.inventory);
        if (data.canvas) setCanvas(data.canvas);
        if (data.eventStatus) setEventStatusState(data.eventStatus);
        if (data.eventConfig) setEventConfig(data.eventConfig);
        realtimeBus.emit('EVENT_STATE_CHANGED', { status: data.eventStatus }, currentUser.name);
        logAuditAction('SNAPSHOT_RESTORED', 'SYSTEM', `Restored snapshot from ${data.timestamp}`, 'ADMIN');
        return true;
      } catch {
        return false;
      }
    },
    [currentUser.name, logAuditAction]
  );

  const switchUser = useCallback((user: CodeScrietUser, role: SimulationRole | 'ADMIN' | 'JUDGE' | 'MARSHAL' | 'PUBLIC') => {
    setCurrentUser(user);
    setCurrentRole(role);
  }, []);

  const logout = useCallback(() => {
    setCurrentRole('PUBLIC');
    setAuthToken(null);
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
  }, []);

  // ============================================================================
  // ADMIN AUTHORIZATION & VERIFICATION LOGIC (Server-Authoritative)
  // ============================================================================

  const getAdminStatus = useCallback(
    (identifier?: string): AdminAuthorizationStatus => {
      const targetEmail = (identifier || currentUser.email || '').toLowerCase().trim();
      const targetId = identifier || currentUser.id;

      // 1. Check authoritative AdminAuthorization list
      const authRecord = adminAuthorizations.find(
        (a) => a.email.toLowerCase() === targetEmail || a.userId === targetId
      );

      if (authRecord) {
        if (authRecord.active && authRecord.verified) {
          return 'ADMIN_VERIFIED';
        }
        if (!authRecord.active) {
          return 'ADMIN_SUSPENDED';
        }
      }

      // 2. Check AdminApplications list
      const appRecord = adminApplications.find(
        (app) => app.email.toLowerCase() === targetEmail || app.userId === targetId
      );

      if (appRecord) {
        if (appRecord.status === 'PENDING') return 'ADMIN_PENDING';
        if (appRecord.status === 'REJECTED') return 'ADMIN_REJECTED';
        if (appRecord.status === 'SUSPENDED') return 'ADMIN_SUSPENDED';
        if (appRecord.status === 'APPROVED') return 'ADMIN_VERIFIED';
      }

      return 'NORMAL_USER';
    },
    [currentUser.email, currentUser.id, adminAuthorizations, adminApplications]
  );

  const isAdminVerified = useCallback(
    (identifier?: string): boolean => {
      return getAdminStatus(identifier) === 'ADMIN_VERIFIED';
    },
    [getAdminStatus]
  );

  const isSuperAdmin = useCallback(
    (identifier?: string): boolean => {
      const targetEmail = (identifier || currentUser.email || '').toLowerCase().trim();
      const targetId = identifier || currentUser.id;
      const authRecord = adminAuthorizations.find(
        (a) => a.email.toLowerCase() === targetEmail || a.userId === targetId
      );
      return !!authRecord && authRecord.active && authRecord.verified && authRecord.role === 'SUPER_ADMIN';
    },
    [currentUser.email, currentUser.id, adminAuthorizations]
  );

  const submitAdminApplication = useCallback(
    (data: { reason: string; requestedRole: AdminPermissionRole }) => {
      // Prevent duplicate pending applications
      const existingPending = adminApplications.find(
        (a) =>
          (a.email.toLowerCase() === currentUser.email.toLowerCase() || a.userId === currentUser.id) &&
          a.status === 'PENDING'
      );
      if (existingPending) {
        return {
          success: false,
          message: 'You already have an active admin application pending verification.',
        };
      }

      // If already verified
      if (isAdminVerified(currentUser.email)) {
        return {
          success: false,
          message: 'You are already an approved and verified administrator.',
        };
      }

      const newApp: AdminApplication = {
        id: 'app-' + Math.random().toString(36).substring(2, 9),
        userId: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        status: 'PENDING',
        reason: data.reason,
        requestedRole: data.requestedRole,
        submittedAt: new Date().toISOString(),
      };

      const newAudit: AdminAuditLogEntry = {
        id: 'audit-' + Math.random().toString(36).substring(2, 9),
        actorUserId: currentUser.id,
        actorEmail: currentUser.email,
        targetUserId: currentUser.id,
        targetEmail: currentUser.email,
        applicationId: newApp.id,
        action: 'ADMIN_APPLICATION_SUBMITTED',
        beforeStatus: getAdminStatus(currentUser.email),
        afterStatus: 'ADMIN_PENDING',
        timestamp: new Date().toISOString(),
        reason: data.reason,
      };

      setAdminApplications((prev) => [newApp, ...prev]);
      setAdminAuditLogs((prev) => [newAudit, ...prev]);

      realtimeBus.emit('ADMIN_APPLICATION_SUBMITTED', { application: newApp }, currentUser.name);

      setAdminNotification({
        title: 'Admin Application Submitted',
        message: 'Your admin application has been submitted and is awaiting verification.',
        type: 'info',
      });

      return {
        success: true,
        message: 'Your admin application has been submitted and is awaiting verification.',
      };
    },
    [currentUser, adminApplications, isAdminVerified, getAdminStatus]
  );

  const approveAdminApplication = useCallback(
    (applicationId: string, roleOverride?: AdminPermissionRole) => {
      if (!isAdminVerified(currentUser.email)) {
        return { success: false, message: '403 Forbidden: Only verified administrators can approve applications.' };
      }

      const app = adminApplications.find((a) => a.id === applicationId);
      if (!app) {
        return { success: false, message: 'Application not found.' };
      }

      // Prevent self-approval
      if (app.userId === currentUser.id || app.email.toLowerCase() === currentUser.email.toLowerCase()) {
        return { success: false, message: 'Security violation: Self-approval of admin applications is strictly prohibited.' };
      }

      const assignedRole = roleOverride || app.requestedRole || 'ADMIN';
      const now = new Date().toISOString();

      setAdminApplications((prev) =>
        prev.map((a) =>
          a.id === applicationId
            ? {
                ...a,
                status: 'APPROVED',
                reviewedAt: now,
                reviewedBy: currentUser.name,
                reviewedByEmail: currentUser.email,
              }
            : a
        )
      );

      setAdminAuthorizations((prev) => {
        const existingIndex = prev.findIndex(
          (auth) => auth.email.toLowerCase() === app.email.toLowerCase() || auth.userId === app.userId
        );
        const newAuth: AdminAuthorization = {
          id: existingIndex >= 0 ? prev[existingIndex].id : 'auth-' + Math.random().toString(36).substring(2, 9),
          userId: app.userId,
          email: app.email,
          name: app.name,
          role: assignedRole,
          verified: true,
          active: true,
          grantedAt: now,
          grantedBy: `${currentUser.name} (${currentUser.email})`,
          notes: `Approved via admin application ${app.id}. Reason: ${app.reason}`,
        };

        if (existingIndex >= 0) {
          const copy = [...prev];
          copy[existingIndex] = newAuth;
          return copy;
        }
        return [...prev, newAuth];
      });

      const audit: AdminAuditLogEntry = {
        id: 'audit-' + Math.random().toString(36).substring(2, 9),
        actorUserId: currentUser.id,
        actorEmail: currentUser.email,
        targetUserId: app.userId,
        targetEmail: app.email,
        applicationId: app.id,
        action: 'ADMIN_APPLICATION_APPROVED',
        beforeStatus: app.status,
        afterStatus: `APPROVED (${assignedRole})`,
        timestamp: now,
        reason: `Application approved by ${currentUser.name}`,
      };
      setAdminAuditLogs((prev) => [audit, ...prev]);

      realtimeBus.emit(
        'ADMIN_APPROVED',
        {
          targetEmail: app.email,
          targetUserId: app.userId,
          role: assignedRole,
          reviewer: currentUser.name,
        },
        currentUser.name
      );

      return { success: true, message: `Application for ${app.name} (${app.email}) approved as ${assignedRole}.` };
    },
    [currentUser, isAdminVerified, adminApplications]
  );

  const rejectAdminApplication = useCallback(
    (applicationId: string, reason?: string) => {
      if (!isAdminVerified(currentUser.email)) {
        return { success: false, message: '403 Forbidden: Only verified administrators can reject applications.' };
      }

      const app = adminApplications.find((a) => a.id === applicationId);
      if (!app) {
        return { success: false, message: 'Application not found.' };
      }

      const now = new Date().toISOString();
      const rejReason = reason || 'Requirements not met at this time.';

      setAdminApplications((prev) =>
        prev.map((a) =>
          a.id === applicationId
            ? {
                ...a,
                status: 'REJECTED',
                reviewedAt: now,
                reviewedBy: currentUser.name,
                reviewedByEmail: currentUser.email,
                rejectionReason: rejReason,
              }
            : a
        )
      );

      const audit: AdminAuditLogEntry = {
        id: 'audit-' + Math.random().toString(36).substring(2, 9),
        actorUserId: currentUser.id,
        actorEmail: currentUser.email,
        targetUserId: app.userId,
        targetEmail: app.email,
        applicationId: app.id,
        action: 'ADMIN_APPLICATION_REJECTED',
        beforeStatus: app.status,
        afterStatus: 'REJECTED',
        timestamp: now,
        reason: rejReason,
      };
      setAdminAuditLogs((prev) => [audit, ...prev]);

      realtimeBus.emit(
        'ADMIN_REJECTED',
        {
          targetEmail: app.email,
          targetUserId: app.userId,
          reason: rejReason,
          reviewer: currentUser.name,
        },
        currentUser.name
      );

      return { success: true, message: `Application for ${app.name} rejected.` };
    },
    [currentUser, isAdminVerified, adminApplications]
  );

  const suspendAdminAccess = useCallback(
    (targetUserIdOrEmail: string, reason?: string) => {
      if (!isAdminVerified(currentUser.email)) {
        return { success: false, message: '403 Forbidden: Only verified administrators can suspend admin access.' };
      }

      const identifier = targetUserIdOrEmail.toLowerCase().trim();
      const target = adminAuthorizations.find(
        (a) => a.email.toLowerCase() === identifier || a.userId === identifier
      );

      if (!target) {
        return { success: false, message: 'Admin authorization record not found.' };
      }

      if (
        target.email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase() &&
        currentUser.email.toLowerCase() !== BOOTSTRAP_ADMIN_EMAIL.toLowerCase()
      ) {
        return { success: false, message: 'Cannot suspend the bootstrap Super Admin.' };
      }

      const now = new Date().toISOString();
      const suspReason = reason || 'Admin access suspended by administrator.';

      setAdminAuthorizations((prev) =>
        prev.map((a) =>
          a.id === target.id
            ? {
                ...a,
                active: false,
                suspendedAt: now,
                notes: suspReason,
              }
            : a
        )
      );

      setAdminApplications((prev) =>
        prev.map((app) =>
          app.email.toLowerCase() === target.email.toLowerCase() || app.userId === target.userId
            ? { ...app, status: 'SUSPENDED', rejectionReason: suspReason }
            : app
        )
      );

      const audit: AdminAuditLogEntry = {
        id: 'audit-' + Math.random().toString(36).substring(2, 9),
        actorUserId: currentUser.id,
        actorEmail: currentUser.email,
        targetUserId: target.userId,
        targetEmail: target.email,
        action: 'ADMIN_ACCESS_SUSPENDED',
        beforeStatus: target.active ? 'ACTIVE' : 'SUSPENDED',
        afterStatus: 'SUSPENDED',
        timestamp: now,
        reason: suspReason,
      };
      setAdminAuditLogs((prev) => [audit, ...prev]);

      realtimeBus.emit('ADMIN_SUSPENDED', { targetEmail: target.email, reason: suspReason }, currentUser.name);

      return { success: true, message: `Admin privileges suspended for ${target.name} (${target.email}).` };
    },
    [currentUser, isAdminVerified, adminAuthorizations]
  );

  const reactivateAdminAccess = useCallback(
    (targetUserIdOrEmail: string, reason?: string) => {
      if (!isAdminVerified(currentUser.email)) {
        return { success: false, message: '403 Forbidden: Only verified administrators can reactivate admin access.' };
      }

      const identifier = targetUserIdOrEmail.toLowerCase().trim();
      const target = adminAuthorizations.find(
        (a) => a.email.toLowerCase() === identifier || a.userId === identifier
      );

      if (!target) {
        return { success: false, message: 'Admin authorization record not found.' };
      }

      const now = new Date().toISOString();
      const reactReason = reason || 'Admin privileges reactivated by administrator.';

      setAdminAuthorizations((prev) =>
        prev.map((a) =>
          a.id === target.id
            ? {
                ...a,
                active: true,
                suspendedAt: undefined,
                notes: reactReason,
              }
            : a
        )
      );

      setAdminApplications((prev) =>
        prev.map((app) =>
          app.email.toLowerCase() === target.email.toLowerCase() || app.userId === target.userId
            ? { ...app, status: 'APPROVED' }
            : app
        )
      );

      const audit: AdminAuditLogEntry = {
        id: 'audit-' + Math.random().toString(36).substring(2, 9),
        actorUserId: currentUser.id,
        actorEmail: currentUser.email,
        targetUserId: target.userId,
        targetEmail: target.email,
        action: 'ADMIN_ACCESS_REACTIVATED',
        beforeStatus: 'SUSPENDED',
        afterStatus: 'ACTIVE',
        timestamp: now,
        reason: reactReason,
      };
      setAdminAuditLogs((prev) => [audit, ...prev]);

      realtimeBus.emit('ADMIN_REACTIVATED', { targetEmail: target.email, reason: reactReason }, currentUser.name);

      return { success: true, message: `Admin privileges reactivated for ${target.name} (${target.email}).` };
    },
    [currentUser, isAdminVerified, adminAuthorizations]
  );

  const loginWithEmail = useCallback(
    (email: string, name?: string) => {
      const cleanEmail = email.trim().toLowerCase();
      const authRecord = adminAuthorizations.find(
        (a) => a.email.toLowerCase() === cleanEmail && a.active && a.verified
      );

      const isVerified = !!authRecord;
      const role = isVerified ? (authRecord.role === 'SUPER_ADMIN' ? 'SUPERADMIN' : 'ADMIN') : 'MEMBER';
      const simRole: SimulationRole | 'ADMIN' = isVerified ? 'ADMIN' : 'CEO';

      const newUser: CodeScrietUser = {
        id: authRecord ? authRecord.userId : 'usr-' + Math.random().toString(36).substring(2, 8),
        name: name || (authRecord ? authRecord.name : cleanEmail.split('@')[0].toUpperCase()),
        email: cleanEmail,
        role: role,
        avatarUrl: `https://images.unsplash.com/photo-${cleanEmail.length % 2 === 0 ? '1534528741775-53994a69daeb' : '1535713875002-d1d0cf377fde'}?auto=format&fit=crop&w=150&q=80`,
      };

      setCurrentUser(newUser);
      setCurrentRole(simRole);
      setAuthToken(`mock-token-${cleanEmail}-${Date.now()}`);
      localStorage.setItem('token', `mock-token-${cleanEmail}`);

      setAdminNotification({
        title: isVerified ? 'Verified Admin Login' : 'Login Successful',
        message: isVerified
          ? `Welcome ${newUser.name}. Verified as ${authRecord.role}. Admin Panel is unlocked.`
          : `Welcome ${newUser.name}. Signed in with Code.SCRIET Member account.`,
        type: isVerified ? 'success' : 'info',
      });
    },
    [adminAuthorizations]
  );

  const dismissAdminNotification = useCallback(() => {
    setAdminNotification(null);
  }, []);

  // Real-time synchronization for authorization updates
  useEffect(() => {
    const unsubApproved = realtimeBus.on('ADMIN_APPROVED', (evt) => {
      const payload = evt.payload;
      if (
        payload?.targetEmail?.toLowerCase() === currentUser.email.toLowerCase() ||
        payload?.targetUserId === currentUser.id
      ) {
        setAdminNotification({
          title: 'Admin Access Approved!',
          message: 'Your Code.SCRIET admin access has been approved. The Admin Panel is now accessible.',
          type: 'success',
        });
        setCurrentRole('ADMIN');
      }
    });

    const unsubRejected = realtimeBus.on('ADMIN_REJECTED', (evt) => {
      const payload = evt.payload;
      if (
        payload?.targetEmail?.toLowerCase() === currentUser.email.toLowerCase() ||
        payload?.targetUserId === currentUser.id
      ) {
        setAdminNotification({
          title: 'Admin Access Request Rejected',
          message: payload.reason || 'Your Code.SCRIET admin access request was rejected.',
          type: 'warning',
        });
      }
    });

    const unsubSuspended = realtimeBus.on('ADMIN_SUSPENDED', (evt) => {
      const payload = evt.payload;
      if (
        payload?.targetEmail?.toLowerCase() === currentUser.email.toLowerCase() ||
        payload?.targetUserId === currentUser.id
      ) {
        setAdminNotification({
          title: 'Admin Access Suspended',
          message: payload.reason || 'Your admin access has been suspended.',
          type: 'error',
        });
        if (currentRole === 'ADMIN') {
          setCurrentRole('CEO');
        }
      }
    });

    return () => {
      unsubApproved();
      unsubRejected();
      unsubSuspended();
    };
  }, [currentUser.email, currentUser.id, currentRole]);

  const value = useMemo(
    () => ({
      currentUser,
      authToken,
      currentRole,
      setCurrentRole,
      switchUser,
      isLoggedIn: currentRole !== 'PUBLIC',
      logout,
      eventStatus,
      setEventStatus,
      eventConfig,
      updateEventConfig: (cfg: Partial<EventConfig>) => setEventConfig((prev) => ({ ...prev, ...cfg })),
      serverTimeRemainingSeconds,
      isClockRunning,
      toggleClock,
      resetClock,
      isLockdownActive,
      triggerLockdown,
      teams,
      currentTeam,
      setCurrentTeamId,
      updateTeam,
      reissueRoleToDevice,
      ledger,
      getBalance,
      getRunwayMonths,
      getFinancialHealthBand,
      manualLedgerAdjustment,
      grantLoan,
      marketItems,
      inventory,
      purchaseProposals,
      proposePurchase,
      approveProposal,
      rejectProposal,
      reversePurchase,
      addMarketItem,
      updateMarketItem,
      adjustStock,
      crisisCards,
      activeCrisis,
      addCrisisCard,
      updateCrisisCard,
      dispatchCrisisToTeam,
      extendCrisisTimer,
      resolveCrisisManually,
      submitCrisisResponse,
      canvas,
      updateCanvasField,
      artifacts,
      submitArtifact,
      activeAuction,
      auctionBids,
      openAuction,
      closeAuction,
      placeAuctionBid,
      trades,
      proposeTrade,
      acceptTrade,
      judgingCriteria,
      updateJudgingCriterion,
      judgeScores,
      submitJudgeScore,
      floorScores,
      recalculateFloorScores,
      liveScreenConfig,
      updateLiveScreenConfig: (cfg: Partial<LiveScreenConfig>) => setLiveScreenConfig((prev) => ({ ...prev, ...cfg })),
      announcements,
      addAnnouncement,
      auditLogs,
      logAuditAction,
      resetAndReseedSimulation,
      createSnapshot,
      restoreSnapshot,
      // Admin Authorization & Verification
      adminAuthorizations,
      adminApplications,
      adminAuditLogs,
      getAdminStatus,
      isAdminVerified,
      isSuperAdmin,
      submitAdminApplication,
      approveAdminApplication,
      rejectAdminApplication,
      suspendAdminAccess,
      reactivateAdminAccess,
      loginWithEmail,
      adminNotification,
      dismissAdminNotification,
    }),
    [
      currentUser,
      authToken,
      currentRole,
      switchUser,
      logout,
      eventStatus,
      setEventStatus,
      eventConfig,
      serverTimeRemainingSeconds,
      isClockRunning,
      toggleClock,
      resetClock,
      isLockdownActive,
      triggerLockdown,
      teams,
      currentTeam,
      updateTeam,
      reissueRoleToDevice,
      ledger,
      getBalance,
      getRunwayMonths,
      getFinancialHealthBand,
      manualLedgerAdjustment,
      grantLoan,
      marketItems,
      inventory,
      purchaseProposals,
      proposePurchase,
      approveProposal,
      rejectProposal,
      reversePurchase,
      addMarketItem,
      updateMarketItem,
      adjustStock,
      crisisCards,
      activeCrisis,
      addCrisisCard,
      updateCrisisCard,
      dispatchCrisisToTeam,
      extendCrisisTimer,
      resolveCrisisManually,
      submitCrisisResponse,
      canvas,
      updateCanvasField,
      artifacts,
      submitArtifact,
      activeAuction,
      auctionBids,
      openAuction,
      closeAuction,
      placeAuctionBid,
      trades,
      proposeTrade,
      acceptTrade,
      judgingCriteria,
      updateJudgingCriterion,
      judgeScores,
      submitJudgeScore,
      floorScores,
      recalculateFloorScores,
      liveScreenConfig,
      announcements,
      addAnnouncement,
      auditLogs,
      logAuditAction,
      resetAndReseedSimulation,
      createSnapshot,
      restoreSnapshot,
      adminAuthorizations,
      adminApplications,
      adminAuditLogs,
      getAdminStatus,
      isAdminVerified,
      isSuperAdmin,
      submitAdminApplication,
      approveAdminApplication,
      rejectAdminApplication,
      suspendAdminAccess,
      reactivateAdminAccess,
      loginWithEmail,
      adminNotification,
      dismissAdminNotification,
    ]
  );

  return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>;
};

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
};
