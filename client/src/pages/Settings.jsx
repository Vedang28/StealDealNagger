import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { teamAPI } from "../services/api";
import PageWrapper from "../components/PageWrapper";
import {
  User,
  Building2,
  ShieldCheck,
  Lock,
  Bell,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import RoleBadge from "../components/ui/RoleBadge";


// Common timezones for the dropdown
const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
];

function initials(name = "") {
  return (
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  );
}

export default function Settings() {
  const { user, team, login: refreshAuth, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  // ── Profile section ──────────────────────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({
    name: user?.name ?? "",
    slackUserId: user?.slackUserId ?? "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // ── Notification preferences ─────────────────────────────────────────────────
  const [notifPrefs, setNotifPrefs] = useState({
    slack: user?.notificationPrefs?.slack ?? true,
    email: user?.notificationPrefs?.email ?? false,
  });
  const [savingNotif, setSavingNotif] = useState(false);

  // ── Change password ───────────────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirm: "",
  });
  const [savingPw, setSavingPw] = useState(false);

  // ── Team settings (admin) ─────────────────────────────────────────────────────
  const [teamForm, setTeamForm] = useState({
    name: team?.name ?? "",
    timezone: team?.timezone ?? "UTC",
    digestTime: team?.digestTime ?? "09:00",
  });
  const [savingTeam, setSavingTeam] = useState(false);

  // ── Danger zone ───────────────────────────────────────────────────────────────
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const showToast = (message, type = "success") => {
    toast[type]?.(message) ?? toast.info(message);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await teamAPI.updateProfile({
        name: profileForm.name,
        slackUserId: profileForm.slackUserId || null,
      });
      showToast("Profile updated successfully.");
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to update profile.",
        "error",
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveNotifPrefs = async () => {
    setSavingNotif(true);
    try {
      await teamAPI.updateProfile({ notificationPrefs: notifPrefs });
      showToast("Notification preferences saved.");
    } catch (err) {
      showToast("Failed to save preferences.", "error");
    } finally {
      setSavingNotif(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) {
      showToast("New passwords do not match.", "error");
      return;
    }
    if (pwForm.newPassword.length < 8) {
      showToast("New password must be at least 8 characters.", "error");
      return;
    }
    setSavingPw(true);
    try {
      await teamAPI.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwForm({ currentPassword: "", newPassword: "", confirm: "" });
      showToast("Password changed successfully.");
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to change password.",
        "error",
      );
    } finally {
      setSavingPw(false);
    }
  };

  const handleSaveTeam = async (e) => {
    e.preventDefault();
    setSavingTeam(true);
    try {
      await teamAPI.updateTeam({
        name: teamForm.name,
        timezone: teamForm.timezone,
        digestTime: teamForm.digestTime,
      });
      showToast("Team settings saved.");
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to save team settings.",
        "error",
      );
    } finally {
      setSavingTeam(false);
    }
  };

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <PageHeader title="Settings" description="Manage your profile and team configuration" />

        {/* ── Profile ──────────────────────────────────────────────────────────── */}
        <section className="bg-[#161616] rounded-xl border border-[rgba(255,255,255,0.07)] p-6">
          <div className="flex items-center gap-2 mb-5">
            <User className="w-4 h-4 text-[#888]" />
            <h2 className="font-semibold text-[#f0ede8]">
              My Profile
            </h2>
          </div>

          {/* Avatar + role */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-bold shrink-0">
              {initials(user?.name)}
            </div>
            <div>
              <p className="text-base font-semibold text-[#f0ede8]">
                {user?.name}
              </p>
              <p className="text-sm text-[#888]">
                {user?.email}
              </p>
            </div>
            <div className="ml-auto">
              <RoleBadge role={user?.role} />
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block font-mono text-[0.65rem] uppercase tracking-[0.12em] text-[#555] mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={profileForm.name}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, name: e.target.value })
                }
                className="w-full px-3 py-2.5 bg-[#111] border border-[rgba(255,255,255,0.1)] text-[#f0ede8] placeholder:text-[#555] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#e8a87c]/20 focus:border-[#e8a87c]"
              />
            </div>
            <div>
              <label className="block font-mono text-[0.65rem] uppercase tracking-[0.12em] text-[#555] mb-1">
                Email
              </label>
              <input
                type="email"
                value={user?.email ?? ""}
                disabled
                className="w-full px-3 py-2.5 border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-[#555] bg-[#0d0d0d] cursor-not-allowed"
              />
              <p className="text-xs text-[#888] mt-1">
                Email cannot be changed.
              </p>
            </div>
            <div>
              <label className="block font-mono text-[0.65rem] uppercase tracking-[0.12em] text-[#555] mb-1">
                Slack User ID <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={profileForm.slackUserId}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    slackUserId: e.target.value,
                  })
                }
                placeholder="e.g. U01ABCDE123"
                className="w-full px-3 py-2.5 bg-[#111] border border-[rgba(255,255,255,0.1)] text-[#f0ede8] placeholder:text-[#555] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#e8a87c]/20 focus:border-[#e8a87c] font-mono"
              />
              <p className="text-xs text-[#888] mt-1">
                Used to send you direct Slack nudges.
              </p>
            </div>
            <div>
              <button
                type="submit"
                disabled={savingProfile}
                className="flex items-center gap-1.5 border border-[#e8a87c] text-[#e8a87c] hover:bg-[#e8a87c] hover:text-[#0a0a0a] bg-transparent px-5 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {savingProfile ? "Saving…" : "Save Profile"}
              </button>
            </div>
          </form>
        </section>

        {/* ── Notification prefs ───────────────────────────────────────────────── */}
        <section className="bg-[#161616] rounded-xl border border-[rgba(255,255,255,0.07)] p-6">
          <div className="flex items-center gap-2 mb-5">
            <Bell className="w-4 h-4 text-[#888]" />
            <h2 className="font-semibold text-[#f0ede8]">
              Notification Preferences
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                key: "slack",
                label: "Slack notifications",
                desc: "Receive nudges via Slack DM",
              },
              {
                key: "email",
                label: "Email notifications",
                desc: "Receive digest emails",
              },
            ].map(({ key, label, desc }) => (
              <div
                key={key}
                className="flex items-center justify-between py-3 border-b border-[rgba(255,255,255,0.07)] last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-[#f0ede8]">
                    {label}
                  </p>
                  <p className="text-xs text-[#888]">
                    {desc}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setNotifPrefs({ ...notifPrefs, [key]: !notifPrefs[key] })
                  }
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    notifPrefs[key]
                      ? "bg-[#e8a87c]"
                      : "bg-[#333]"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      notifPrefs[key] ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleSaveNotifPrefs}
            disabled={savingNotif}
            className="mt-4 flex items-center gap-1.5 border border-[#e8a87c] text-[#e8a87c] hover:bg-[#e8a87c] hover:text-[#0a0a0a] bg-transparent px-5 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {savingNotif ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {savingNotif ? "Saving…" : "Save Preferences"}
          </button>
        </section>

        {/* ── Change Password ──────────────────────────────────────────────────── */}
        <section className="bg-[#161616] rounded-xl border border-[rgba(255,255,255,0.07)] p-6">
          <div className="flex items-center gap-2 mb-5">
            <Lock className="w-4 h-4 text-[#888]" />
            <h2 className="font-semibold text-[#f0ede8]">
              Change Password
            </h2>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            {[
              {
                key: "currentPassword",
                label: "Current Password",
                placeholder: "••••••••",
              },
              {
                key: "newPassword",
                label: "New Password",
                placeholder: "Min. 8 characters",
              },
              {
                key: "confirm",
                label: "Confirm New Password",
                placeholder: "••••••••",
              },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block font-mono text-[0.65rem] uppercase tracking-[0.12em] text-[#555] mb-1">
                  {label}
                </label>
                <input
                  type="password"
                  required
                  value={pwForm[key]}
                  onChange={(e) =>
                    setPwForm({ ...pwForm, [key]: e.target.value })
                  }
                  placeholder={placeholder}
                  className="w-full px-3 py-2.5 bg-[#111] border border-[rgba(255,255,255,0.1)] text-[#f0ede8] placeholder:text-[#555] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#e8a87c]/20 focus:border-[#e8a87c]"
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={savingPw}
              className="flex items-center gap-1.5 border border-[#e8a87c] text-[#e8a87c] hover:bg-[#e8a87c] hover:text-[#0a0a0a] bg-transparent px-5 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {savingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              {savingPw ? "Changing…" : "Change Password"}
            </button>
          </form>
        </section>

        {/* ── Team Settings (admin only) ───────────────────────────────────────── */}
        {isAdmin && (
          <section className="bg-[#161616] rounded-xl border border-[rgba(255,255,255,0.07)] p-6">
            <div className="flex items-center gap-2 mb-5">
              <Building2 className="w-4 h-4 text-[#888]" />
              <h2 className="font-semibold text-[#f0ede8]">
                Team Settings
              </h2>
              <span className="ml-auto text-xs bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full font-medium">
                Admin only
              </span>
            </div>

            <form onSubmit={handleSaveTeam} className="space-y-4">
              <div>
                <label className="block font-mono text-[0.65rem] uppercase tracking-[0.12em] text-[#555] mb-1">
                  Team Name
                </label>
                <input
                  type="text"
                  required
                  value={teamForm.name}
                  onChange={(e) =>
                    setTeamForm({ ...teamForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2.5 bg-[#111] border border-[rgba(255,255,255,0.1)] text-[#f0ede8] placeholder:text-[#555] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#e8a87c]/20 focus:border-[#e8a87c]"
                />
              </div>

              <div>
                <label className="block font-mono text-[0.65rem] uppercase tracking-[0.12em] text-[#555] mb-1">
                  Team Slug <span className="text-gray-400">(read-only)</span>
                </label>
                <input
                  type="text"
                  value={team?.slug ?? ""}
                  disabled
                  className="w-full px-3 py-2.5 border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-[#555] font-mono bg-[#0d0d0d] cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-mono text-[0.65rem] uppercase tracking-[0.12em] text-[#555] mb-1">
                  Timezone
                </label>
                <select
                  value={teamForm.timezone}
                  onChange={(e) =>
                    setTeamForm({ ...teamForm, timezone: e.target.value })
                  }
                  className="w-full px-3 py-2.5 bg-[#111] border border-[rgba(255,255,255,0.1)] text-[#f0ede8] placeholder:text-[#555] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#e8a87c]/20 focus:border-[#e8a87c]"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-mono text-[0.65rem] uppercase tracking-[0.12em] text-[#555] mb-1">
                  Daily Digest Time
                </label>
                <input
                  type="time"
                  value={teamForm.digestTime}
                  onChange={(e) =>
                    setTeamForm({ ...teamForm, digestTime: e.target.value })
                  }
                  className="w-full px-3 py-2.5 bg-[#111] border border-[rgba(255,255,255,0.1)] text-[#f0ede8] placeholder:text-[#555] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#e8a87c]/20 focus:border-[#e8a87c]"
                />
                <p className="text-xs text-[#888] mt-1">
                  Manager digest email is sent at this time in your team's
                  timezone.
                </p>
              </div>

              <button
                type="submit"
                disabled={savingTeam}
                className="flex items-center gap-1.5 border border-[#e8a87c] text-[#e8a87c] hover:bg-[#e8a87c] hover:text-[#0a0a0a] bg-transparent px-5 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {savingTeam ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {savingTeam ? "Saving…" : "Save Team Settings"}
              </button>
            </form>
          </section>
        )}

        {/* ── Danger Zone (admin only) ─────────────────────────────────────────── */}
        {isAdmin && (
          <section className="bg-[#161616] rounded-xl border-l-4 border-l-[#ef4444] border border-[rgba(255,255,255,0.07)] p-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-danger" />
              <h2 className="font-semibold text-danger">Danger Zone</h2>
            </div>
            <p className="text-sm text-[#888] mb-4">
              Permanently delete this team and all its data. This action cannot
              be undone.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-1.5 border border-[#ef4444] text-[#ef4444] hover:bg-[#ef4444] hover:text-[#0a0a0a] bg-transparent px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Team
            </button>
          </section>
        )}

        {/* Delete confirmation modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
            <div className="bg-[#161616] rounded-2xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#ef4444]/10 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-danger" />
                </div>
                <div>
                  <h3 className="font-bold text-[#f0ede8]">
                    Delete Team?
                  </h3>
                  <p className="text-sm text-[#888]">
                    This will delete all data permanently.
                  </p>
                </div>
              </div>
              <p className="text-sm text-[#888] mb-3">
                Type{" "}
                <span className="font-mono font-bold text-[#f0ede8]">
                  {team?.slug}
                </span>{" "}
                to confirm:
              </p>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder={team?.slug}
                className="w-full px-3 py-2.5 bg-[#111] border border-[rgba(255,255,255,0.1)] text-[#f0ede8] placeholder:text-[#555] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ef4444]/20 focus:border-[#ef4444] mb-4 font-mono"
              />
              <div className="flex gap-2">
                <button
                  disabled={deleteConfirm !== team?.slug || deleting}
                  onClick={async () => {
                    setDeleting(true);
                    try {
                      await teamAPI.deleteTeam();
                      showToast("Team deleted permanently.");
                      logout();
                      navigate("/login");
                    } catch (err) {
                      showToast(
                        err.response?.data?.error?.message ||
                          "Failed to delete team.",
                        "error",
                      );
                    } finally {
                      setDeleting(false);
                    }
                  }}
                  className="flex-1 border border-[#ef4444] text-[#ef4444] hover:bg-[#ef4444] hover:text-[#0a0a0a] bg-transparent py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {deleting ? "Deleting…" : "Yes, Delete Everything"}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirm("");
                  }}
                  className="flex-1 border border-[rgba(255,255,255,0.1)] py-2.5 rounded-lg text-sm text-[#f0ede8] hover:bg-[#1e1e1e] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
