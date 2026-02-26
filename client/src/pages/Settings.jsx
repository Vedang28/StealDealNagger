import { useAuth } from "../context/AuthContext";
import { User, Building2, ShieldCheck, Info } from "lucide-react";

const ROLE_STYLES = {
  admin: "bg-purple-100 text-purple-700 border border-purple-200",
  manager: "bg-blue-100 text-blue-700 border border-blue-200",
  rep: "bg-gray-100 text-gray-600 border border-gray-200",
};

export default function Settings() {
  const { user, team } = useAuth();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark">Settings</h1>
        <p className="text-muted text-sm mt-1">Your account and team information</p>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-xl border border-border shadow-sm p-6 mb-4">
        <div className="flex items-center gap-3 mb-5">
          <User className="w-4 h-4 text-muted" />
          <h2 className="font-semibold text-dark">Profile</h2>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-bold shrink-0">
            {user?.name
              ?.split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase() ?? "?"}
          </div>
          <div>
            <p className="text-lg font-semibold text-dark">{user?.name}</p>
            <p className="text-sm text-muted">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <span className="text-muted">Full name</span>
            <span className="text-dark font-medium">{user?.name ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-border">
            <span className="text-muted">Email</span>
            <span className="text-dark font-medium">{user?.email ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-muted">Role</span>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                ROLE_STYLES[user?.role] ?? ROLE_STYLES.rep
              }`}
            >
              <ShieldCheck className="w-3 h-3" />
              {user?.role ?? "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Team card */}
      <div className="bg-white rounded-xl border border-border shadow-sm p-6 mb-4">
        <div className="flex items-center gap-3 mb-5">
          <Building2 className="w-4 h-4 text-muted" />
          <h2 className="font-semibold text-dark">Team</h2>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <span className="text-muted">Team name</span>
            <span className="text-dark font-medium">{team?.name ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-muted">Slug</span>
            <span className="text-dark font-mono text-xs bg-gray-100 px-2 py-1 rounded">
              {team?.slug ?? "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Read-only notice */}
      <div className="flex items-start gap-3 bg-gray-50 border border-border rounded-xl px-4 py-3 text-sm text-muted">
        <Info className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" />
        <span>Profile updates are managed by your admin. Contact them to change your name, email, or role.</span>
      </div>
    </div>
  );
}
