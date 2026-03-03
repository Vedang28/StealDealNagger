import { useState, useEffect } from "react";
import { teamAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { SkeletonTeamMembers } from "../components/Skeleton";
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
} from "lucide-react";

const ROLE_META = {
  admin: {
    label: "Admin",
    bg: "bg-purple-100",
    text: "text-purple-700",
    icon: ShieldCheck,
  },
  manager: {
    label: "Manager",
    bg: "bg-blue-100",
    text: "text-blue-700",
    icon: Shield,
  },
  rep: { label: "Rep", bg: "bg-gray-100", text: "text-gray-600", icon: User },
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="h-7 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-28 bg-gray-200 rounded animate-pulse mt-2" />
        </div>
        <SkeletonTeamMembers />
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark">Team Management</h1>
          <p className="text-muted text-sm mt-1">
            {activeCount} active member{activeCount !== 1 ? "s" : ""}
          </p>
        </div>
        {canInvite && (
          <button
            onClick={() => {
              setShowInvite(true);
              setInviteResult(null);
            }}
            className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Invite Member
          </button>
        )}
      </div>

      {/* Members list */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        {members.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-muted font-medium">No team members yet</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-gray-50/50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                      Member
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                      Role
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                      Joined
                    </th>
                    {isAdmin && <th className="px-6 py-3" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {members.map((member) => {
                    const isSelf = member.id === user?.id;
                    return (
                      <tr
                        key={member.id}
                        className={`${!member.isActive ? "opacity-60" : ""} hover:bg-gray-50/50`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                              {initials(member.name)}
                            </div>
                            <div>
                              <p className="font-medium text-dark">
                                {member.name}
                                {isSelf && (
                                  <span className="ml-2 text-xs text-muted">
                                    (you)
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-muted">
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
                                className="appearance-none pl-2 pr-6 py-1 border border-border rounded-lg text-xs font-medium text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white disabled:opacity-50 cursor-pointer"
                              >
                                <option value="admin">Admin</option>
                                <option value="manager">Manager</option>
                                <option value="rep">Rep</option>
                              </select>
                              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted pointer-events-none" />
                            </div>
                          ) : (
                            <RoleBadge role={member.role} />
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              member.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {member.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted text-xs">
                          {formatDate(member.createdAt)}
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-4">
                            {!isSelf && (
                              <button
                                onClick={() => handleToggleActive(member)}
                                disabled={togglingId === member.id}
                                title={
                                  member.isActive ? "Deactivate" : "Reactivate"
                                }
                                className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                                  member.isActive
                                    ? "text-muted hover:text-danger hover:bg-red-50"
                                    : "text-muted hover:text-green-600 hover:bg-green-50"
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
            <div className="sm:hidden divide-y divide-border">
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
                          <p className="font-medium text-dark text-sm">
                            {member.name}
                            {isSelf && (
                              <span className="ml-1 text-xs text-muted">
                                (you)
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted">{member.email}</p>
                        </div>
                      </div>
                      <RoleBadge role={member.role} />
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${member.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                      >
                        {member.isActive ? "Active" : "Inactive"}
                      </span>
                      <span className="text-xs text-muted">
                        Joined {formatDate(member.createdAt)}
                      </span>
                    </div>
                    {isAdmin && !isSelf && (
                      <div className="mt-3 flex gap-2">
                        <select
                          value={member.role}
                          onChange={(e) =>
                            handleRoleChange(member.id, e.target.value)
                          }
                          disabled={changingRoleId === member.id}
                          className="flex-1 px-2 py-1.5 border border-border rounded-lg text-xs text-dark focus:outline-none bg-white"
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
                              ? "bg-red-50 text-danger hover:bg-red-100"
                              : "bg-green-50 text-green-700 hover:bg-green-100"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-dark text-lg">
                Invite Team Member
              </h3>
              <button
                onClick={() => {
                  setShowInvite(false);
                  setInviteResult(null);
                }}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {inviteResult ? (
              /* Success state */
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-dark">
                      {inviteResult.user?.name} invited!
                    </p>
                    <p className="text-sm text-muted">
                      {inviteResult.user?.email}
                    </p>
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                  <p className="text-xs font-semibold text-amber-800 mb-1">
                    Temporary Password
                  </p>
                  <p className="font-mono text-sm text-amber-900 break-all">
                    {inviteResult.tempPassword}
                  </p>
                  <p className="text-xs text-amber-700 mt-2">
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
                  <label className="block text-xs font-medium text-muted mb-1">
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
                    className="w-full px-3 py-2.5 border border-border rounded-lg text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
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
                    className="w-full px-3 py-2.5 border border-border rounded-lg text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
                    Role
                  </label>
                  <select
                    value={invite.role}
                    onChange={(e) =>
                      setInvite({ ...invite, role: e.target.value })
                    }
                    className="w-full px-3 py-2.5 border border-border rounded-lg text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
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
                    className="flex-1 border border-border py-2.5 rounded-lg text-sm text-dark hover:bg-gray-50 transition-colors"
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
  );
}
