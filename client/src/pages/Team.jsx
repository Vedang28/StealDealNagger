import { useState, useEffect } from "react";
import { teamAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { SkeletonTeamMembers } from "../components/Skeleton";
import PageWrapper from "../components/PageWrapper";
import EmptyState from "../components/EmptyState";
import {
  Users,
  UserPlus,
  X,
  Check,
  ShieldCheck,
  Shield,
  User,
  Power,
  PowerOff,
  ChevronDown,
  Bell,
  BellOff,
  MessageSquare,
  Copy,
} from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import SharedRoleBadge from "../components/ui/RoleBadge";

const ROLE_META = {
  admin: {
    label: "Admin",
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-700 dark:text-purple-300",
    icon: ShieldCheck,
  },
  manager: {
    label: "Manager",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-300",
    icon: Shield,
  },
  rep: {
    label: "Rep",
    bg: "bg-gray-100 dark:bg-gray-700",
    text: "text-gray-600 dark:text-gray-300",
    icon: User,
  },
};

function RoleBadge({ role }) {
  const meta = ROLE_META[role] ?? ROLE_META.rep;
  const Icon = meta.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${meta.bg} ${meta.text}`}
    >
      <Icon className="w-3 h-3" />
      {meta.label}
    </span>
  );
}

function initials(name = "") {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const EMPTY_INVITE = { name: "", email: "", role: "rep" };

export default function Team() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Invite modal
  const [showInvite, setShowInvite] = useState(false);
  const [invite, setInvite] = useState(EMPTY_INVITE);
  const [inviting, setSaving] = useState(false);
  const [inviteResult, setInviteResult] = useState(null); // { user, tempPassword }

  // Role change
  const [changingRoleId, setChangingRoleId] = useState(null);

  // Deactivate / reactivate
  const [togglingId, setTogglingId] = useState(null);

  const isAdmin = user?.role === "admin";
  const canInvite = user?.role === "admin" || user?.role === "manager";

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const res = await teamAPI.getMembers();
      setMembers(res.data?.data ?? []);
    } catch (err) {
      console.error("Failed to load members", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setSaving(true);
    setInviteResult(null);
    try {
      const res = await teamAPI.inviteUser(invite);
      setInviteResult(res.data?.data);
      setInvite(EMPTY_INVITE);
      await loadMembers();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to invite user");
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    setChangingRoleId(memberId);
    try {
      await teamAPI.updateRole(memberId, newRole);
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)),
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update role");
    } finally {
      setChangingRoleId(null);
    }
  };

  const handleToggleActive = async (member) => {
    setTogglingId(member.id);
    try {
      if (member.isActive) {
        await teamAPI.deactivateUser(member.id);
        setMembers((prev) =>
          prev.map((m) => (m.id === member.id ? { ...m, isActive: false } : m)),
        );
      } else {
        await teamAPI.reactivateUser(member.id);
        setMembers((prev) =>
          prev.map((m) => (m.id === member.id ? { ...m, isActive: true } : m)),
        );
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status");
    } finally {
      setTogglingId(null);
    }
  };

  const activeCount = members.filter((m) => m.isActive).length;

  if (loading)
    return (
      <PageWrapper>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <div className="h-7 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-2" />
          </div>
          <SkeletonTeamMembers />
        </div>
      </PageWrapper>
    );

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader title="Team Management" description={`${activeCount} active member${activeCount !== 1 ? "s" : ""}`}>
          {canInvite && (
            <button
              onClick={() => {
                setShowInvite(true);
                setInviteResult(null);
              }}
              className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              Invite Member
            </button>
          )}
        </PageHeader>

        {/* Members list */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-border dark:border-gray-700 shadow-sm overflow-hidden">
          {members.length === 0 ? (
            <EmptyState
              variant="team"
              title="No team members yet"
              subtitle="Invite your team to start collaborating on deals"
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted dark:text-gray-400 uppercase tracking-wider">
                        Member
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted dark:text-gray-400 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted dark:text-gray-400 uppercase tracking-wider">
                        Slack ID
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted dark:text-gray-400 uppercase tracking-wider">
                        Notifications
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted dark:text-gray-400 uppercase tracking-wider">
                        Joined
                      </th>
                      {isAdmin && <th className="px-6 py-3" />}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border dark:divide-gray-700">
                    {members.map((member) => {
                      const isSelf = member.id === user?.id;
                      return (
                        <tr
                          key={member.id}
                          className={`${!member.isActive ? "opacity-60" : ""} hover:bg-gray-50/50 dark:hover:bg-gray-700/30`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                                {initials(member.name)}
                              </div>
                              <div>
                                <p className="font-medium text-dark dark:text-white">
                                  {member.name}
                                  {isSelf && (
                                    <span className="ml-2 text-xs text-muted dark:text-gray-400">
                                      (you)
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-muted dark:text-gray-400">
                                  {member.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {isAdmin && !isSelf ? (
                              <div className="relative inline-block">
                                <select
                                  value={member.role}
                                  onChange={(e) =>
                                    handleRoleChange(member.id, e.target.value)
                                  }
                                  disabled={changingRoleId === member.id}
                                  className="appearance-none pl-2 pr-6 py-1 border border-border dark:border-gray-600 rounded-lg text-xs font-medium text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white dark:bg-gray-700 disabled:opacity-50 cursor-pointer"
                                >
                                  <option value="admin">Admin</option>
                                  <option value="manager">Manager</option>
                                  <option value="rep">Rep</option>
                                </select>
                                <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted dark:text-gray-400 pointer-events-none" />
                              </div>
                            ) : (
                              <RoleBadge role={member.role} />
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                member.inviteStatus === "pending"
                                  ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                                  : member.isActive
                                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                              }`}
                            >
                              {member.inviteStatus === "pending"
                                ? "Pending Invite"
                                : member.isActive
                                  ? "Active"
                                  : "Inactive"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {member.slackUserId ? (
                              <span className="inline-flex items-center gap-1 text-xs font-mono text-dark dark:text-gray-300 bg-gray-50 dark:bg-gray-700 px-2 py-0.5 rounded">
                                <MessageSquare className="w-3 h-3 text-muted dark:text-gray-400" />
                                {member.slackUserId}
                              </span>
                            ) : (
                              <span className="text-xs text-muted dark:text-gray-500 italic">
                                Not set
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              {member.notificationPrefs?.slack ? (
                                <span
                                  className="inline-flex items-center gap-0.5 text-xs text-green-600 dark:text-green-400"
                                  title="Slack enabled"
                                >
                                  <Bell className="w-3 h-3" /> Slack
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center gap-0.5 text-xs text-gray-400 dark:text-gray-500 line-through"
                                  title="Slack disabled"
                                >
                                  <BellOff className="w-3 h-3" /> Slack
                                </span>
                              )}
                              {member.notificationPrefs?.email ? (
                                <span
                                  className="inline-flex items-center gap-0.5 text-xs text-green-600 dark:text-green-400"
                                  title="Email enabled"
                                >
                                  <Bell className="w-3 h-3" /> Email
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center gap-0.5 text-xs text-gray-400 dark:text-gray-500 line-through"
                                  title="Email disabled"
                                >
                                  <BellOff className="w-3 h-3" /> Email
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-muted dark:text-gray-400 text-xs">
                            {formatDate(member.createdAt)}
                          </td>
                          {isAdmin && (
                            <td className="px-6 py-4">
                              {!isSelf && (
                                <button
                                  onClick={() => handleToggleActive(member)}
                                  disabled={togglingId === member.id}
                                  title={
                                    member.isActive
                                      ? "Deactivate"
                                      : "Reactivate"
                                  }
                                  className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                                    member.isActive
                                      ? "text-muted dark:text-gray-400 hover:text-danger hover:bg-red-50 dark:hover:bg-red-900/20"
                                      : "text-muted dark:text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                                  }`}
                                >
                                  {member.isActive ? (
                                    <PowerOff className="w-4 h-4" />
                                  ) : (
                                    <Power className="w-4 h-4" />
                                  )}
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className="sm:hidden divide-y divide-border dark:divide-gray-700">
                {members.map((member) => {
                  const isSelf = member.id === user?.id;
                  return (
                    <div
                      key={member.id}
                      className={`px-4 py-4 ${!member.isActive ? "opacity-60" : ""}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                            {initials(member.name)}
                          </div>
                          <div>
                            <p className="font-medium text-dark dark:text-white text-sm">
                              {member.name}
                              {isSelf && (
                                <span className="ml-1 text-xs text-muted dark:text-gray-400">
                                  (you)
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-muted dark:text-gray-400">
                              {member.email}
                            </p>
                          </div>
                        </div>
                        <RoleBadge role={member.role} />
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            member.inviteStatus === "pending"
                              ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                              : member.isActive
                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {member.inviteStatus === "pending"
                            ? "Pending Invite"
                            : member.isActive
                              ? "Active"
                              : "Inactive"}
                        </span>
                        {member.slackUserId && (
                          <span className="inline-flex items-center gap-0.5 text-xs font-mono text-muted dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                            <MessageSquare className="w-3 h-3" />
                            {member.slackUserId}
                          </span>
                        )}
                        <span className="text-xs text-muted dark:text-gray-400">
                          Joined {formatDate(member.createdAt)}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        {member.notificationPrefs?.slack ? (
                          <span className="inline-flex items-center gap-0.5 text-xs text-green-600 dark:text-green-400">
                            <Bell className="w-3 h-3" /> Slack
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-xs text-gray-400 dark:text-gray-500 line-through">
                            <BellOff className="w-3 h-3" /> Slack
                          </span>
                        )}
                        {member.notificationPrefs?.email ? (
                          <span className="inline-flex items-center gap-0.5 text-xs text-green-600 dark:text-green-400">
                            <Bell className="w-3 h-3" /> Email
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-xs text-gray-400 dark:text-gray-500 line-through">
                            <BellOff className="w-3 h-3" /> Email
                          </span>
                        )}
                      </div>
                      {isAdmin && !isSelf && (
                        <div className="mt-3 flex gap-2">
                          <select
                            value={member.role}
                            onChange={(e) =>
                              handleRoleChange(member.id, e.target.value)
                            }
                            disabled={changingRoleId === member.id}
                            className="flex-1 px-2 py-1.5 border border-border dark:border-gray-600 rounded-lg text-xs text-dark dark:text-white focus:outline-none bg-white dark:bg-gray-700"
                          >
                            <option value="admin">Admin</option>
                            <option value="manager">Manager</option>
                            <option value="rep">Rep</option>
                          </select>
                          <button
                            onClick={() => handleToggleActive(member)}
                            disabled={togglingId === member.id}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 ${
                              member.isActive
                                ? "bg-red-50 dark:bg-red-900/20 text-danger hover:bg-red-100 dark:hover:bg-red-900/30"
                                : "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30"
                            }`}
                          >
                            {member.isActive ? "Deactivate" : "Reactivate"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Invite modal */}
        {showInvite && (
          <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-dark dark:text-white text-lg">
                  Invite Team Member
                </h3>
                <button
                  onClick={() => {
                    setShowInvite(false);
                    setInviteResult(null);
                  }}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-muted dark:text-gray-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {inviteResult ? (
                /* Success state */
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-dark dark:text-white">
                        {inviteResult.user?.name} invited!
                      </p>
                      <p className="text-sm text-muted dark:text-gray-400">
                        {inviteResult.user?.email}
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 border border-border dark:border-gray-700 rounded-xl p-4 mb-4">
                    <p className="text-xs font-semibold text-muted dark:text-gray-400 mb-2">
                      Temporary Password
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 font-mono text-sm text-dark dark:text-white bg-white dark:bg-gray-800 border border-border dark:border-gray-700 rounded-lg px-3 py-2 break-all">
                        {inviteResult.tempPassword}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(inviteResult.tempPassword);
                        }}
                        className="p-2 rounded-lg border border-border dark:border-gray-700 text-muted hover:text-primary hover:bg-primary/5 transition-colors shrink-0"
                        title="Copy password"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-muted dark:text-gray-500 mt-2">
                      Share this securely. They can change it in Settings.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setInviteResult(null);
                      setShowInvite(false);
                    }}
                    className="w-full bg-primary hover:bg-primary-hover text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Done
                  </button>
                </div>
              ) : (
                /* Invite form */
                <form onSubmit={handleInvite} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-muted dark:text-gray-400 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={invite.name}
                      onChange={(e) =>
                        setInvite({ ...invite, name: e.target.value })
                      }
                      placeholder="Jane Smith"
                      className="w-full px-3 py-2.5 border border-border dark:border-gray-600 rounded-lg text-sm text-dark dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted dark:text-gray-400 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={invite.email}
                      onChange={(e) =>
                        setInvite({ ...invite, email: e.target.value })
                      }
                      placeholder="jane@company.com"
                      className="w-full px-3 py-2.5 border border-border dark:border-gray-600 rounded-lg text-sm text-dark dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted dark:text-gray-400 mb-1">
                      Role
                    </label>
                    <select
                      value={invite.role}
                      onChange={(e) =>
                        setInvite({ ...invite, role: e.target.value })
                      }
                      className="w-full px-3 py-2.5 border border-border dark:border-gray-600 rounded-lg text-sm text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white dark:bg-gray-700"
                    >
                      <option value="rep">
                        Rep — View and manage their own deals
                      </option>
                      <option value="manager">
                        Manager — View all deals, manage team
                      </option>
                      <option value="admin">
                        Admin — Full access including billing
                      </option>
                    </select>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={inviting}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-hover text-white py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      <UserPlus className="w-4 h-4" />
                      {inviting ? "Inviting…" : "Send Invite"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowInvite(false)}
                      className="flex-1 border border-border dark:border-gray-700 py-2.5 rounded-lg text-sm text-dark dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
