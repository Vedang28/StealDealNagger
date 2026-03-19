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
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    icon: ShieldCheck,
  },
  manager: {
    label: "Manager",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    icon: Shield,
  },
  rep: {
    label: "Rep",
    bg: "bg-[#1e1e1e]",
    text: "text-[#888]",
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
            <div className="h-7 w-48 bg-[#1e1e1e] rounded animate-pulse" />
            <div className="h-4 w-28 bg-[#1e1e1e] rounded animate-pulse mt-2" />
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
              className="flex items-center gap-1.5 border border-[#e8a87c] text-[#e8a87c] hover:bg-[#e8a87c] hover:text-[#0a0a0a] bg-transparent px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              Invite Member
            </button>
          )}
        </PageHeader>

        {/* Members list */}
        <div className="bg-[#161616] rounded-xl border border-[rgba(255,255,255,0.07)] overflow-hidden">
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
                    <tr className="border-b border-[rgba(255,255,255,0.07)] bg-[#111]">
                      <th className="text-left px-6 py-3 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-[#555]">
                        Member
                      </th>
                      <th className="text-left px-6 py-3 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-[#555]">
                        Role
                      </th>
                      <th className="text-left px-6 py-3 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-[#555]">
                        Status
                      </th>
                      <th className="text-left px-6 py-3 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-[#555]">
                        Slack ID
                      </th>
                      <th className="text-left px-6 py-3 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-[#555]">
                        Notifications
                      </th>
                      <th className="text-left px-6 py-3 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-[#555]">
                        Joined
                      </th>
                      {isAdmin && <th className="px-6 py-3" />}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(255,255,255,0.07)]">
                    {members.map((member) => {
                      const isSelf = member.id === user?.id;
                      return (
                        <tr
                          key={member.id}
                          className={`${!member.isActive ? "opacity-60" : ""} hover:bg-[rgba(255,255,255,0.03)]`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#e8a87c]/10 text-[#e8a87c] flex items-center justify-center text-xs font-bold shrink-0">
                                {initials(member.name)}
                              </div>
                              <div>
                                <p className="font-medium text-[#f0ede8]">
                                  {member.name}
                                  {isSelf && (
                                    <span className="ml-2 text-xs text-[#888]">
                                      (you)
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-[#888]">
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
                                  className="appearance-none pl-2 pr-6 py-1 border border-[rgba(255,255,255,0.1)] rounded-lg text-xs font-medium text-[#f0ede8] focus:outline-none focus:ring-2 focus:ring-[#e8a87c]/20 focus:border-[#e8a87c] bg-[#111] disabled:opacity-50 cursor-pointer"
                                >
                                  <option value="admin">Admin</option>
                                  <option value="manager">Manager</option>
                                  <option value="rep">Rep</option>
                                </select>
                                <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#555] pointer-events-none" />
                              </div>
                            ) : (
                              <RoleBadge role={member.role} />
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                member.inviteStatus === "pending"
                                  ? "bg-[#f59e0b]/10 text-[#f59e0b]"
                                  : member.isActive
                                    ? "bg-[#4ade80]/10 text-[#4ade80]"
                                    : "bg-[#1e1e1e] text-[#555]"
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
                              <span className="inline-flex items-center gap-1 text-xs font-mono text-[#f0ede8] bg-[#1e1e1e] px-2 py-0.5 rounded">
                                <MessageSquare className="w-3 h-3 text-[#888]" />
                                {member.slackUserId}
                              </span>
                            ) : (
                              <span className="text-xs text-[#555] italic">
                                Not set
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              {member.notificationPrefs?.slack ? (
                                <span
                                  className="inline-flex items-center gap-0.5 text-xs text-[#4ade80]"
                                  title="Slack enabled"
                                >
                                  <Bell className="w-3 h-3" /> Slack
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center gap-0.5 text-xs text-[#555] line-through"
                                  title="Slack disabled"
                                >
                                  <BellOff className="w-3 h-3" /> Slack
                                </span>
                              )}
                              {member.notificationPrefs?.email ? (
                                <span
                                  className="inline-flex items-center gap-0.5 text-xs text-[#4ade80]"
                                  title="Email enabled"
                                >
                                  <Bell className="w-3 h-3" /> Email
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center gap-0.5 text-xs text-[#555] line-through"
                                  title="Email disabled"
                                >
                                  <BellOff className="w-3 h-3" /> Email
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-[#888] text-xs">
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
                                      ? "text-[#888] hover:text-[#ef4444] hover:bg-[#ef4444]/10"
                                      : "text-[#888] hover:text-[#4ade80] hover:bg-[#4ade80]/10"
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
              <div className="sm:hidden divide-y divide-[rgba(255,255,255,0.07)]">
                {members.map((member) => {
                  const isSelf = member.id === user?.id;
                  return (
                    <div
                      key={member.id}
                      className={`px-4 py-4 ${!member.isActive ? "opacity-60" : ""}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#e8a87c]/10 text-[#e8a87c] flex items-center justify-center text-xs font-bold shrink-0">
                            {initials(member.name)}
                          </div>
                          <div>
                            <p className="font-medium text-[#f0ede8] text-sm">
                              {member.name}
                              {isSelf && (
                                <span className="ml-1 text-xs text-[#888]">
                                  (you)
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-[#888]">
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
                              ? "bg-[#f59e0b]/10 text-[#f59e0b]"
                              : member.isActive
                                ? "bg-[#4ade80]/10 text-[#4ade80]"
                                : "bg-[#1e1e1e] text-[#555]"
                          }`}
                        >
                          {member.inviteStatus === "pending"
                            ? "Pending Invite"
                            : member.isActive
                              ? "Active"
                              : "Inactive"}
                        </span>
                        {member.slackUserId && (
                          <span className="inline-flex items-center gap-0.5 text-xs font-mono text-[#888] bg-[#1e1e1e] px-1.5 py-0.5 rounded">
                            <MessageSquare className="w-3 h-3" />
                            {member.slackUserId}
                          </span>
                        )}
                        <span className="text-xs text-[#888]">
                          Joined {formatDate(member.createdAt)}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        {member.notificationPrefs?.slack ? (
                          <span className="inline-flex items-center gap-0.5 text-xs text-[#4ade80]">
                            <Bell className="w-3 h-3" /> Slack
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-xs text-[#555] line-through">
                            <BellOff className="w-3 h-3" /> Slack
                          </span>
                        )}
                        {member.notificationPrefs?.email ? (
                          <span className="inline-flex items-center gap-0.5 text-xs text-[#4ade80]">
                            <Bell className="w-3 h-3" /> Email
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-xs text-[#555] line-through">
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
                            className="flex-1 px-2 py-1.5 border border-[rgba(255,255,255,0.1)] rounded-lg text-xs text-[#f0ede8] focus:outline-none bg-[#111]"
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
                                ? "bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444]/15"
                                : "bg-[#4ade80]/10 text-[#4ade80] hover:bg-[#4ade80]/15"
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
            <div className="bg-[#161616] rounded-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-[#f0ede8] text-lg">
                  Invite Team Member
                </h3>
                <button
                  onClick={() => {
                    setShowInvite(false);
                    setInviteResult(null);
                  }}
                  className="p-1.5 rounded-lg hover:bg-[#1e1e1e] text-[#888] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {inviteResult ? (
                /* Success state */
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-[#4ade80]/10 flex items-center justify-center">
                      <Check className="w-5 h-5 text-[#4ade80]" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#f0ede8]">
                        {inviteResult.user?.name} invited!
                      </p>
                      <p className="text-sm text-[#888]">
                        {inviteResult.user?.email}
                      </p>
                    </div>
                  </div>
                  <div className="bg-[#111] border border-[rgba(255,255,255,0.07)] rounded-xl p-4 mb-4">
                    <p className="text-xs font-semibold text-[#888] mb-2">
                      Temporary Password
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 font-mono text-sm text-[#f0ede8] bg-[#0d0d0d] border border-[rgba(255,255,255,0.07)] rounded-lg px-3 py-2 break-all">
                        {inviteResult.tempPassword}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(inviteResult.tempPassword);
                        }}
                        className="p-2 rounded-lg border border-[rgba(255,255,255,0.07)] text-[#888] hover:text-[#e8a87c] hover:bg-[#e8a87c]/5 transition-colors shrink-0"
                        title="Copy password"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-[#555] mt-2">
                      Share this securely. They can change it in Settings.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setInviteResult(null);
                      setShowInvite(false);
                    }}
                    className="w-full border border-[#e8a87c] text-[#e8a87c] hover:bg-[#e8a87c] hover:text-[#0a0a0a] bg-transparent py-2.5 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Done
                  </button>
                </div>
              ) : (
                /* Invite form */
                <form onSubmit={handleInvite} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[#888] mb-1">
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
                      className="w-full px-3 py-2.5 border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-[#f0ede8] bg-[#111] focus:outline-none focus:ring-2 focus:ring-[#e8a87c]/20 focus:border-[#e8a87c]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#888] mb-1">
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
                      className="w-full px-3 py-2.5 border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-[#f0ede8] bg-[#111] focus:outline-none focus:ring-2 focus:ring-[#e8a87c]/20 focus:border-[#e8a87c]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#888] mb-1">
                      Role
                    </label>
                    <select
                      value={invite.role}
                      onChange={(e) =>
                        setInvite({ ...invite, role: e.target.value })
                      }
                      className="w-full px-3 py-2.5 border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-[#f0ede8] focus:outline-none focus:ring-2 focus:ring-[#e8a87c]/20 focus:border-[#e8a87c] bg-[#111]"
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
                      className="flex-1 flex items-center justify-center gap-1.5 border border-[#e8a87c] text-[#e8a87c] hover:bg-[#e8a87c] hover:text-[#0a0a0a] bg-transparent py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      <UserPlus className="w-4 h-4" />
                      {inviting ? "Inviting…" : "Send Invite"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowInvite(false)}
                      className="flex-1 border border-[rgba(255,255,255,0.07)] py-2.5 rounded-lg text-sm text-[#f0ede8] hover:bg-[#1e1e1e] transition-colors"
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
