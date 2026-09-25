import React, { useState } from 'react';
import { useSimulation } from '../services/simulationContext';
import { RequestAdminModal } from '../components/RequestAdminModal';
import {
  ShieldAlert,
  Lock,
  Clock,
  Ban,
  ArrowLeft,
  UserCheck,
  Send,
  Sparkles,
} from 'lucide-react';
import { BOOTSTRAP_ADMIN_EMAIL } from '../services/adminAuthService';

interface AdminAccessDeniedPageProps {
  onNavigate: (view: string) => void;
  targetPath?: string;
}

export const AdminAccessDeniedPage: React.FC<AdminAccessDeniedPageProps> = ({
  onNavigate,
  targetPath = '/admin/control-center',
}) => {
  const {
    currentUser,
    getAdminStatus,
    adminApplications,
    loginWithEmail,
  } = useSimulation();

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const status = getAdminStatus(currentUser.email);

  const existingApp = adminApplications.find(
    (a) =>
      (a.email.toLowerCase() === currentUser.email.toLowerCase() ||
        a.userId === currentUser.id) &&
      a.status === 'PENDING'
  );

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-xl w-full card p-7 sm:p-9 space-y-6 text-center shadow-2xl border-red-500/20 relative overflow-hidden">
        {/* Top Watermark Badge */}
        <div className="absolute top-4 right-4">
          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 border border-red-500/20">
            HTTP 403 FORBIDDEN
          </span>
        </div>

        {/* Dynamic Icon Based on Status */}
        <div className="mx-auto w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg transition-transform hover:scale-105 duration-200">
          {status === 'ADMIN_PENDING' ? (
            <div className="w-full h-full rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center">
              <Clock className="w-10 h-10 animate-spin" />
            </div>
          ) : status === 'ADMIN_SUSPENDED' ? (
            <div className="w-full h-full rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-600 flex items-center justify-center">
              <Ban className="w-10 h-10" />
            </div>
          ) : (
            <div className="w-full h-full rounded-3xl bg-red-500/10 border border-red-500/20 text-red-600 flex items-center justify-center">
              <ShieldAlert className="w-10 h-10" />
            </div>
          )}
        </div>

        {/* Error Title & Status */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-stone-900 dark:text-stone-100">
            {status === 'ADMIN_PENDING'
              ? 'Admin Verification Pending'
              : status === 'ADMIN_SUSPENDED'
              ? 'Administrative Access Suspended'
              : status === 'ADMIN_REJECTED'
              ? 'Admin Application Rejected'
              : 'Access Denied: Admin Verification Required'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto">
            {status === 'ADMIN_PENDING'
              ? 'Your admin access application has been submitted and is waiting for review by active Code.SCRIET administrators.'
              : status === 'ADMIN_SUSPENDED'
              ? 'Your administrative authority has been suspended by platform operations. Contact Code.SCRIET leads for reinstatement.'
              : status === 'ADMIN_REJECTED'
              ? 'Your application for administrator credentials was not approved. You may submit an updated request.'
              : 'Direct navigation to the ZERO → ONE Master Control Center requires authoritative server-side administrator authorization.'}
          </p>
        </div>

        {/* Server-Side Identity Diagnostic Card */}
        <div className="p-4 rounded-2xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-left text-xs space-y-2 font-mono">
          <div className="flex items-center justify-between text-[11px] text-stone-400 font-sans font-bold uppercase tracking-wider pb-1 border-b border-stone-200 dark:border-stone-800">
            <span>Server Authorization Diagnostic</span>
            <span className="text-red-500 font-bold">403 Blocked</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-stone-400">Authenticated User:</span>{' '}
              <span className="font-bold text-stone-800 dark:text-stone-200">{currentUser.name}</span>
            </div>
            <div>
              <span className="text-stone-400">Identity Email:</span>{' '}
              <span className="font-bold text-stone-800 dark:text-stone-200 truncate block">{currentUser.email}</span>
            </div>
            <div>
              <span className="text-stone-400">Server Status:</span>{' '}
              <span
                className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                  status === 'ADMIN_PENDING'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                }`}
              >
                {status}
              </span>
            </div>
            <div>
              <span className="text-stone-400">Requested Endpoint:</span>{' '}
              <span className="font-bold text-stone-700 dark:text-stone-300 truncate block">{targetPath}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => onNavigate('team-dashboard')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-xs font-bold text-stone-700 dark:text-stone-200 flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Team Hub</span>
          </button>

          {status !== 'ADMIN_PENDING' && (
            <button
              onClick={() => setIsApplyModalOpen(true)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Apply for Admin Access</span>
            </button>
          )}
        </div>

        {/* Quick Bootstrap Admin Switcher for Testing Verification Workflow */}
        <div className="pt-4 border-t border-stone-200 dark:border-stone-800">
          <p className="text-[11px] text-stone-400 mb-2">
            Platform Testing Helper: Log in as Initial Bootstrap Administrator
          </p>
          <button
            onClick={() => loginWithEmail(BOOTSTRAP_ADMIN_EMAIL, 'Code.SCRIET Master Admin')}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Login as {BOOTSTRAP_ADMIN_EMAIL} (Super Admin)</span>
          </button>
        </div>
      </div>

      <RequestAdminModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onNavigateToAdmin={() => onNavigate('admin-control')}
      />
    </div>
  );
};
