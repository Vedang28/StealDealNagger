import { useState } from "react";
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
} from "lucide-react";

const ROLE_STYLES = {
  admin: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800",
  manager: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
  rep: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600",
};

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
  const { user, team, login: refreshAuth } = useAuth();
  const toast = useToast();
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-dark dark:text-white">Settings</h1>
        <p className="text-muted dark:text-gray-400 text-sm mt-1">
          Manage your profile and team configuration
        </p>
      </div>

      {/* ── Profile ──────────────────────────────────────────────────────────── */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-border dark:border-gray-700 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <User className="w-4 h-4 text-muted" />
          <h2 className="font-semibold text-dark dark:text-white">My Profile</h2>
        </div>

        {/* Avatar + role */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-bold shrink-0">
            {initials(user?.name)}
          </div>
          <div>
            <p className="text-base font-semibold text-dark dark:text-white">{user?.name}</p>
            <p className="text-sm text-muted dark:text-gray-400">{user?.email}</p>
          </div>
          <span
            className={`ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
              ROLE_STYLES[user?.role] ?? ROLE_STYLES.rep
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            {user?.role}
          </span>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted dark:text-gray-400 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={profileForm.name}
              onChange={(e) =>
                setProfileForm({ ...profileForm, name: e.target.value })
              }
              className="w-full px-3 py-2.5 border border-border dark:border-gray-600 rounded-lg text-sm text-dark dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary dark:focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted dark:text-gray-400 mb-1">
              Email
            </label>
            <input
              type="email"
              value={user?.email ?? ""}
              disabled
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm text-muted bg-gray-50 dark:bg-gray-900 dark:text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-muted dark:text-gray-400 mt-1">Email cannot be changed.</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted dark:text-gray-400 mb-1">
              Slack User ID <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={profileForm.slackUserId}
              onChange={(e) =>
                setProfileForm({ ...profileForm, slackUserId: e.target.value })
              }
              placeholder="e.g. U01ABCDE123"
              className="w-full px-3 py-2.5 border border-border dark:border-gray-600 rounded-lg text-sm text-dark dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary dark:focus:border-primary font-mono"
            />
            <p className="text-xs text-muted dark:text-gray-400 mt-1">
              Used to send you direct Slack nudges.
            </p>
          </div>
          <div>
            <button
              type="submit"
              disabled={savingProfile}
              className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {savingProfile ? "Saving…" : "Save Profile"}
            </button>
          </div>
        </form>
      </section>

      {/* ── Notification prefs ───────────────────────────────────────────────── */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-border dark:border-gray-700 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <Bell className="w-4 h-4 text-muted" />
          <h2 className="font-semibold text-dark dark:text-white">Notification Preferences</h2>
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
              className="flex items-center justify-between py-3 border-b border-border dark:border-gray-700 last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-dark dark:text-white">{label}</p>
                <p className="text-xs text-muted dark:text-gray-400">{desc}</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setNotifPrefs({ ...notifPrefs, [key]: !notifPrefs[key] })
                }
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  notifPrefs[key] ? "bg-primary" : "bg-gray-200 dark:bg-gray-600"
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
          className="mt-4 flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
          {savingNotif ? "Saving…" : "Save Preferences"}
        </button>
      </section>

      {/* ── Change Password ──────────────────────────────────────────────────── */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-border dark:border-gray-700 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <Lock className="w-4 h-4 text-muted" />
          <h2 className="font-semibold text-dark dark:text-white">Change Password</h2>
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
              <label className="block text-xs font-medium text-muted dark:text-gray-400 mb-1">
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
                className="w-full px-3 py-2.5 border border-border dark:border-gray-600 rounded-lg text-sm text-dark dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary dark:focus:border-primary"
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={savingPw}
            className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <Lock className="w-4 h-4" />
            {savingPw ? "Changing…" : "Change Password"}
          </button>
        </form>
      </section>

      {/* ── Team Settings (admin only) ───────────────────────────────────────── */}
      {isAdmin && (
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-border dark:border-gray-700 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Building2 className="w-4 h-4 text-muted" />
            <h2 className="font-semibold text-dark dark:text-white">Team Settings</h2>
            <span className="ml-auto text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-medium">
              Admin only
            </span>
          </div>

          <form onSubmit={handleSaveTeam} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted dark:text-gray-400 mb-1">
                Team Name
              </label>
              <input
                type="text"
                required
                value={teamForm.name}
                onChange={(e) =>
                  setTeamForm({ ...teamForm, name: e.target.value })
                }
                className="w-full px-3 py-2.5 border border-border dark:border-gray-600 rounded-lg text-sm text-dark dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary dark:focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted dark:text-gray-400 mb-1">
                Team Slug <span className="text-gray-400">(read-only)</span>
              </label>
              <input
                type="text"
                value={team?.slug ?? ""}
                disabled
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm text-muted font-mono bg-gray-50 dark:bg-gray-900 dark:text-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted dark:text-gray-400 mb-1">
                Timezone
              </label>
              <select
                value={teamForm.timezone}
                onChange={(e) =>
                  setTeamForm({ ...teamForm, timezone: e.target.value })
                }
                className="w-full px-3 py-2.5 border border-border dark:border-gray-600 rounded-lg text-sm text-dark dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted dark:text-gray-400 mb-1">
                Daily Digest Time
              </label>
              <input
                type="time"
                value={teamForm.digestTime}
                onChange={(e) =>
                  setTeamForm({ ...teamForm, digestTime: e.target.value })
                }
                className="w-full px-3 py-2.5 border border-border dark:border-gray-600 rounded-lg text-sm text-dark dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary dark:focus:border-primary"
              />
              <p className="text-xs text-muted dark:text-gray-400 mt-1">
                Manager digest email is sent at this time in your team's
                timezone.
              </p>
            </div>

            <button
              type="submit"
              disabled={savingTeam}
              className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {savingTeam ? "Saving…" : "Save Team Settings"}
            </button>
          </form>
        </section>
      )}

      {/* ── Danger Zone (admin only) ─────────────────────────────────────────── */}
      {isAdmin && (
        <section className="bg-white dark:bg-gray-800 rounded-xl border-2 border-red-200 dark:border-red-900 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-danger" />
            <h2 className="font-semibold text-danger">Danger Zone</h2>
          </div>
          <p className="text-sm text-muted dark:text-gray-400 mb-4">
            Permanently delete this team and all its data. This action cannot be
            undone.
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-1.5 border-2 border-red-300 text-danger hover:bg-red-50 dark:hover:bg-red-900/20 px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete Team
          </button>
        </section>
      )}

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-danger" />
              </div>
              <div>
                <h3 className="font-bold text-dark dark:text-white">Delete Team?</h3>
                <p className="text-sm text-muted dark:text-gray-400">
                  This will delete all data permanently.
                </p>
              </div>
            </div>
            <p className="text-sm text-muted dark:text-gray-400 mb-3">
              Type{" "}
              <span className="font-mono font-bold text-dark dark:text-white">
                {team?.slug}
              </span>{" "}
              to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={team?.slug}
              className="w-full px-3 py-2.5 border border-border dark:border-gray-600 rounded-lg text-sm text-dark dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 mb-4 font-mono"
            />
            <div className="flex gap-2">
              <button
                disabled={deleteConfirm !== team?.slug}
                onClick={() =>
                  alert(
                    "Delete team functionality coming soon. Contact support.",
                  )
                }
                className="flex-1 bg-danger hover:bg-red-600 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Yes, Delete Everything
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirm("");
                }}
                className="flex-1 border border-border dark:border-gray-600 py-2.5 rounded-lg text-sm text-dark dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
