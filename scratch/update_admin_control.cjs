const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'pages', 'AdminControlCenter.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// The replacement for activeTab === 'ADMIN_VERIFICATION'
const newVerificationTab = `{/* ========================================================================= */}
        {/* TAB: ADMIN VERIFICATION (SUPER ADMIN ONLY) */}
        {/* ========================================================================= */}
        {activeTab === 'ADMIN_VERIFICATION' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {!isSuperAdmin() ? (
              <div className="card p-8 text-center space-y-4 border-amber-500/30">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-black font-heading text-stone-900 dark:text-stone-100">
                  Super Admin Authority Required
                </h2>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  Admin verification is strictly restricted to the primary bootstrap Super Administrator ({BOOTSTRAP_ADMIN_EMAIL}). Standard administrators cannot verify, suspend, or revoke other administrators.
                </p>
              </div>
            ) : (
              <>
                {/* 1. Header Card */}
                <div className="card p-6 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-black font-heading text-stone-900 dark:text-stone-100">
                        ADMIN VERIFICATION
                      </h2>
                      <span className="badge badge-orange text-[10px] font-mono">
                        SUPER ADMIN EXCLUSIVE
                      </span>
                    </div>
                    <span className="text-xs font-mono text-stone-400">
                      Bootstrap Account: {BOOTSTRAP_ADMIN_EMAIL}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">
                    Verify Code.SCRIET users as active administrators by email address. Manage authorization status (Active, Suspended, Revoked).
                  </p>
                </div>

                {/* 2. Search Code.SCRIET User Card */}
                <div className="card p-6 space-y-4">
                  <h3 className="font-heading font-black text-sm uppercase tracking-wider text-stone-800 dark:text-stone-200">
                    Search Code.SCRIET User
                  </h3>
                  <form onSubmit={handleSearchUser} className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="input-search-admin-email"
                        type="email"
                        placeholder="Enter Email Address (e.g. student@example.com)"
                        value={searchEmailInput}
                        onChange={(e) => setSearchEmailInput(e.target.value)}
                        className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <button
                      id="btn-search-user"
                      type="submit"
                      disabled={isSearchingUser}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSearchingUser ? <Clock className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      <span>SEARCH USER</span>
                    </button>
                  </form>

                  {/* Search Error Alert */}
                  {searchError && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{searchError}</span>
                    </div>
                  )}

                  {/* USER RESULT CARD */}
                  {searchedUser && (
                    <div className="mt-4 p-5 rounded-2xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-800">
                        <span className="font-heading font-black text-xs uppercase tracking-wider text-orange-600 dark:text-orange-400">
                          USER RESULT
                        </span>
                        <span className="text-[10px] text-stone-400 font-mono">
                          Verified Code.SCRIET Member
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                        <div>
                          <span className="text-stone-400 block text-[11px]">Name:</span>
                          <span className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                            {searchedUser.name}
                          </span>
                        </div>
                        <div>
                          <span className="text-stone-400 block text-[11px]">Email:</span>
                          <span className="font-bold font-mono text-stone-800 dark:text-stone-200">
                            {searchedUser.email}
                          </span>
                        </div>
                        <div>
                          <span className="text-stone-400 block text-[11px]">Code.SCRIET User ID:</span>
                          <span className="font-mono text-stone-600 dark:text-stone-400 text-[11px]">
                            {searchedUser.id}
                          </span>
                        </div>
                        <div>
                          <span className="text-stone-400 block text-[11px]">Current Role:</span>
                          <span className="font-bold text-stone-800 dark:text-stone-200">
                            {searchedUser.role}
                          </span>
                        </div>
                        <div>
                          <span className="text-stone-400 block text-[11px]">Admin Status:</span>
                          <span
                            className={\`font-bold px-2 py-0.5 rounded text-[10px] uppercase inline-block \${
                              searchedUser.adminStatus === 'ACTIVE'
                                ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                                : searchedUser.adminStatus === 'SUSPENDED'
                                ? 'bg-rose-500/15 text-rose-600 border border-rose-500/30'
                                : searchedUser.adminStatus === 'REVOKED'
                                ? 'bg-red-500/15 text-red-600 border border-red-500/30'
                                : 'bg-stone-500/15 text-stone-500 border border-stone-500/30'
                            }\`}
                          >
                            {searchedUser.adminStatus === 'ACTIVE'
                              ? \`VERIFIED ADMIN (\${searchedUser.adminRole || 'ADMIN'})\`
                              : searchedUser.adminStatus === 'SUSPENDED'
                              ? 'SUSPENDED ADMIN'
                              : searchedUser.adminStatus === 'REVOKED'
                              ? 'REVOKED ADMIN'
                              : 'NOT VERIFIED'}
                          </span>
                        </div>
                        <div>
                          <span className="text-stone-400 block text-[11px]">Grant Role:</span>
                          <select
                            value={selectedVerifyRole}
                            onChange={(e) => setSelectedVerifyRole(e.target.value as AdminPermissionRole)}
                            className="text-xs p-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-bold"
                          >
                            <option value="ADMIN">ADMIN (Full Simulator Ops)</option>
                            <option value="EVENT_ADMIN">EVENT_ADMIN (Scarcity & Crisis)</option>
                            <option value="EVENT_OPERATOR">EVENT_OPERATOR (Floor Ops)</option>
                          </select>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-3">
                        <button
                          id="btn-verify-admin"
                          onClick={() => handleVerify(searchedUser.email)}
                          disabled={actionLoadingEmail === searchedUser.email}
                          className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>{searchedUser.adminStatus === 'ACTIVE' ? 'UPDATE / RE-VERIFY ADMIN' : 'VERIFY ADMIN'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. VERIFIED ADMINS Card */}
                <div className="card p-6 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-800">
                    <div>
                      <h3 className="font-heading font-black text-sm uppercase tracking-wider text-stone-800 dark:text-stone-200">
                        VERIFIED ADMINS
                      </h3>
                      <p className="text-xs text-stone-500">
                        Authoritative administrator accounts recognized by server
                      </p>
                    </div>
                    <span className="badge badge-orange text-[10px] font-mono">
                      {adminAuthorizations.filter((a) => a.status === 'ACTIVE' || a.active).length} Active Admins
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-400 font-semibold uppercase text-[10px]">
                          <th className="py-2.5 px-3">Name</th>
                          <th className="py-2.5 px-3">Email</th>
                          <th className="py-2.5 px-3">Role</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Verified By</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                        {adminAuthorizations.map((auth) => {
                          const isMaster = auth.email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
                          const isActive = auth.status === 'ACTIVE' || (auth.active && auth.status !== 'SUSPENDED' && auth.status !== 'REVOKED');
                          const isSuspended = auth.status === 'SUSPENDED';
                          const isRevoked = auth.status === 'REVOKED';

                          return (
                            <tr key={auth.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-900/50 transition-colors">
                              <td className="py-3 px-3 font-bold text-stone-900 dark:text-stone-100">
                                {auth.name}
                                {isMaster && (
                                  <span className="ml-2 text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-500 font-bold">
                                    PRIMARY BOOTSTRAP
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 font-mono text-stone-700 dark:text-stone-300">
                                {auth.email}
                              </td>
                              <td className="py-3 px-3">
                                <span className="font-bold text-stone-800 dark:text-stone-200">
                                  {auth.role}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                <span
                                  className={\`px-2 py-0.5 rounded text-[10px] font-bold uppercase \${
                                    isActive
                                      ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                                      : isSuspended
                                      ? 'bg-rose-500/15 text-rose-600 border border-rose-500/30'
                                      : 'bg-stone-500/15 text-stone-400 border border-stone-500/30'
                                  }\`}
                                >
                                  {auth.status || (isActive ? 'ACTIVE' : 'INACTIVE')}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-[11px] text-stone-500 truncate max-w-[140px]">
                                {auth.verifiedBy || 'SYSTEM'}
                              </td>
                              <td className="py-3 px-3 text-right">
                                {isMaster ? (
                                  <span className="text-[10px] text-stone-400 font-mono italic">
                                    Permanent Super Admin
                                  </span>
                                ) : (
                                  <div className="flex items-center justify-end gap-1.5">
                                    {/* Suspend Action */}
                                    {isActive && (
                                      <button
                                        id={\`btn-suspend-admin-\${auth.email}\`}
                                        onClick={() => handleSuspend(auth.email)}
                                        disabled={actionLoadingEmail === auth.email}
                                        className="px-2 py-1 rounded-lg text-[10px] font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 transition-colors"
                                      >
                                        Suspend
                                      </button>
                                    )}

                                    {/* Reactivate Action */}
                                    {(isSuspended || isRevoked) && (
                                      <button
                                        id={\`btn-reactivate-admin-\${auth.email}\`}
                                        onClick={() => handleReactivate(auth.email)}
                                        disabled={actionLoadingEmail === auth.email}
                                        className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 transition-colors"
                                      >
                                        Reactivate
                                      </button>
                                    )}

                                    {/* Revoke Action */}
                                    {!isRevoked && (
                                      <button
                                        id={\`btn-revoke-admin-\${auth.email}\`}
                                        onClick={() => handleRevoke(auth.email)}
                                        disabled={actionLoadingEmail === auth.email}
                                        className="px-2 py-1 rounded-lg text-[10px] font-bold bg-stone-200 dark:bg-stone-800 hover:bg-red-500/20 hover:text-red-500 text-stone-600 dark:text-stone-400 transition-colors"
                                      >
                                        Revoke
                                      </button>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 4. AUTHORIZATION AUDIT LOG */}
                <div className="card p-6 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-800">
                    <div>
                      <h3 className="font-heading font-black text-sm uppercase tracking-wider text-stone-800 dark:text-stone-200">
                        AUTHORIZATION AUDIT TRAIL
                      </h3>
                      <p className="text-xs text-stone-500">
                        Immutable log of administrative authorizations, suspensions, and revocations
                      </p>
                    </div>
                    <span className="badge badge-orange text-[10px] font-mono">
                      {adminAuditLogs.length} Records
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-400 font-semibold uppercase text-[10px]">
                          <th className="py-2.5 px-3">Actor</th>
                          <th className="py-2.5 px-3">Target Admin</th>
                          <th className="py-2.5 px-3">Action</th>
                          <th className="py-2.5 px-3">Status Transition</th>
                          <th className="py-2.5 px-3">Reason</th>
                          <th className="py-2.5 px-3 text-right">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200 dark:divide-stone-800 font-mono text-[11px]">
                        {adminAuditLogs.slice(0, 15).map((log) => (
                          <tr key={log.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-900/50">
                            <td className="py-2.5 px-3 font-bold text-orange-500">
                              {log.actorEmail}
                            </td>
                            <td className="py-2.5 px-3 text-stone-800 dark:text-stone-200">
                              {log.targetEmail}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                                {log.action}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-stone-500">
                              {log.beforeStatus} → <span className="font-bold text-stone-900 dark:text-stone-100">{log.afterStatus}</span>
                            </td>
                            <td className="py-2.5 px-3 font-sans text-xs text-stone-600 dark:text-stone-400 max-w-[200px] truncate">
                              {log.reason || 'Operational security update'}
                            </td>
                            <td className="py-2.5 px-3 text-right text-stone-400 text-[10px]">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}`;

// Find start of old tab
const startIdx = code.indexOf("{/* ========================================================================= */}\r\n        {/* TAB: ADMIN VERIFICATION") !== -1
  ? code.indexOf("{/* ========================================================================= */}\r\n        {/* TAB: ADMIN VERIFICATION")
  : code.indexOf("{/* ========================================================================= */}\n        {/* TAB: ADMIN VERIFICATION");

// Find end of old tab (before BACKUP tab)
const endIdx = code.indexOf("{/* ========================================================================= */}\r\n        {/* TAB: EXPORT & BACKUP") !== -1
  ? code.indexOf("{/* ========================================================================= */}\r\n        {/* TAB: EXPORT & BACKUP")
  : code.indexOf("{/* ========================================================================= */}\n        {/* TAB: EXPORT & BACKUP");

if (startIdx === -1 || endIdx === -1) {
  console.error("Could not find markers for ADMIN_VERIFICATION tab:", { startIdx, endIdx });
  process.exit(1);
}

// Replace the tab
code = code.substring(0, startIdx) + newVerificationTab + "\n\n        " + code.substring(endIdx);

// Also remove old approval/rejection modals at the bottom
const modalStartIdx = code.indexOf("{/* Approval Confirmation Modal */}") !== -1
  ? code.indexOf("{/* Approval Confirmation Modal */}")
  : code.indexOf("{/* Approval Role Assignment Modal */}");

if (modalStartIdx !== -1) {
  const modalEndIdx = code.indexOf("</div>\n  );\n};", modalStartIdx) !== -1
    ? code.indexOf("</div>\n  );\n};", modalStartIdx)
    : code.indexOf("</div>\r\n  );\r\n};", modalStartIdx);

  if (modalEndIdx !== -1) {
    code = code.substring(0, modalStartIdx) + code.substring(modalEndIdx);
  }
}

fs.writeFileSync(filePath, code, 'utf8');
console.log("Successfully updated AdminControlCenter.tsx!");
