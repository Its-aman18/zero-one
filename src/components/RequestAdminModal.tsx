import React, { useState } from 'react';
import { useSimulation } from '../services/simulationContext';
import { AdminPermissionRole } from '../types';
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  X,
  Send,
  CheckCircle,
  FileText,
  UserCheck,
  Lock,
} from 'lucide-react';

interface RequestAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToAdmin?: () => void;
}

export const RequestAdminModal: React.FC<RequestAdminModalProps> = ({
  isOpen,
  onClose,
  onNavigateToAdmin,
}) => {
  const {
    currentUser,
    getAdminStatus,
    adminApplications,
    submitAdminApplication,
  } = useSimulation();

  const [requestedRole, setRequestedRole] = useState<AdminPermissionRole>('EVENT_OPERATOR');
  const [reason, setReason] = useState('');
  const [agreedNda, setAgreedNda] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentStatus = getAdminStatus(currentUser.email);
  const existingApp = adminApplications.find(
    (a) =>
      (a.email.toLowerCase() === currentUser.email.toLowerCase() ||
        a.userId === currentUser.id) &&
      (a.status === 'PENDING' || a.status === 'REJECTED' || a.status === 'APPROVED')
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!reason.trim() || reason.trim().length < 15) {
      setErrorMsg('Please provide a specific operational reason (at least 15 characters).');
      return;
    }

    if (!agreedNda) {
      setErrorMsg('You must agree to the Code.SCRIET event operations confidentiality policy.');
      return;
    }

    const result = submitAdminApplication({
      reason: reason.trim(),
      requestedRole,
    });

    if (result.success) {
      setSuccessMsg(result.message);
    } else {
      setErrorMsg(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-[#FAF8F5] dark:bg-[#0E111A] border border-[#EFE8DD] dark:border-[#202432] rounded-3xl shadow-2xl p-6 sm:p-7 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black font-heading tracking-tight text-stone-900 dark:text-stone-100">
              Apply for Admin Access
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Code.SCRIET Flagship Event Master Operations
            </p>
          </div>
        </div>

        {/* Status: Already Verified */}
        {currentStatus === 'ADMIN_VERIFIED' ? (
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>You are already a Verified Administrator</span>
              </div>
              <p>
                Your account ({currentUser.email}) has active server-side authorization. You can access the complete Control Center.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800"
              >
                Close
              </button>
              {onNavigateToAdmin && (
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToAdmin();
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-md transition-all"
                >
                  Open Admin Panel
                </button>
              )}
            </div>
          </div>
        ) : currentStatus === 'ADMIN_PENDING' || successMsg ? (
          /* Status: Pending Review */
          <div className="space-y-4 py-3">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Clock className="w-4 h-4 text-amber-500 animate-spin" />
                <span>Application Pending Verification</span>
              </div>
              <p>
                {successMsg ||
                  'Your admin application has been submitted and is awaiting verification by verified administrators.'}
              </p>
              {existingApp && (
                <div className="mt-2 pt-2 border-t border-amber-500/20 text-[11px] font-mono">
                  <div><strong>Requested Role:</strong> {existingApp.requestedRole}</div>
                  <div><strong>Submitted:</strong> {new Date(existingApp.submittedAt).toLocaleString()}</div>
                  <div className="truncate"><strong>Reason:</strong> {existingApp.reason}</div>
                </div>
              )}
            </div>

            <p className="text-xs text-stone-500">
              Per Code.SCRIET security policy, admin capabilities and the Admin button remain locked until an active administrator approves your credentials in the Admin Verification dashboard.
            </p>

            <div className="flex justify-end pt-2">
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-stone-800 text-white dark:bg-stone-700 hover:bg-stone-900 transition-colors"
              >
                Understood
              </button>
            </div>
          </div>
        ) : (
          /* Form for Normal User or Re-applying */
          <form onSubmit={handleSubmit} className="space-y-4">
            {existingApp?.status === 'REJECTED' && (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Previous Application Rejected</span>
                </div>
                <p>
                  {existingApp.rejectionReason || 'Please review requirements and update your reason.'}
                </p>
              </div>
            )}

            {/* Applicant Profile Information (Read-Only Identity) */}
            <div className="p-3 rounded-2xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs space-y-1">
              <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                Authenticated Account
              </div>
              <div className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                <UserCheck className="w-3.5 h-3.5 text-orange-500" />
                <span>{currentUser.name}</span>
                <span className="text-stone-400 font-normal">({currentUser.email})</span>
              </div>
              <div className="text-[10px] text-stone-500">
                Verified through central Code.SCRIET identity service
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                Requested Operational Responsibility
              </label>
              <select
                value={requestedRole}
                onChange={(e) => setRequestedRole(e.target.value as AdminPermissionRole)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
              >
                <option value="EVENT_OPERATOR">Event Operator (Floor control, scoring tally verification)</option>
                <option value="MODERATOR">Moderator (Announcements, public ticker, crisis oversight)</option>
                <option value="EVENT_ADMIN">Event Admin (Crisis dispatch, auction controls, loan authorizer)</option>
                <option value="ADMIN">Full Administrator (Simulation state, ledger reconciliation)</option>
              </select>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                Reason for Requesting Admin Access <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Explain your specific duties (e.g., student coordinator for Round 2 floor operations, judging assistance)..."
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-xs placeholder:text-stone-400 focus:ring-2 focus:ring-orange-500 focus:outline-none resize-none"
              />
              <span className="text-[10px] text-stone-400">Minimum 15 characters required.</span>
            </div>

            {/* NDA Checkbox */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-stone-600 dark:text-stone-400">
                <input
                  type="checkbox"
                  checked={agreedNda}
                  onChange={(e) => setAgreedNda(e.target.checked)}
                  className="mt-0.5 rounded border-stone-300 text-orange-600 focus:ring-orange-500"
                />
                <span>
                  I agree not to disclose crisis card answers, scoring formulas, or tamper with team balances. I understand all admin actions are permanently audit-logged.
                </span>
              </label>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200 dark:border-stone-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-md flex items-center gap-1.5 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Apply for Admin Access</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
