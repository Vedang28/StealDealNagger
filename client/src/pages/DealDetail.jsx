import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { dealsAPI } from "../services/api";
import StatusBadge from "../components/StatusBadge";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  ArrowLeft,
  Briefcase,
  DollarSign,
  Clock,
  Calendar,
  Edit3,
  Trash2,
  BellOff,
  Bell,
  Activity,
  AlertCircle,
  X,
  ExternalLink,
} from "lucide-react";

export default function DealDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showSnooze, setShowSnooze] = useState(false);
  const [snoozeDate, setSnoozeDate] = useState("");
  const [snoozeReason, setSnoozeReason] = useState("");
  const [snoozing, setSnoozing] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadDeal();
  }, [id]);

  const loadDeal = async () => {
    try {
      const res = await dealsAPI.getById(id);
      setDeal(res.data.data);
    } catch (err) {
      console.error("Failed to load deal", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this deal? This action cannot be undone.")) return;
    setDeleting(true);
    try {
      await dealsAPI.remove(id);
      navigate("/deals");
    } catch (err) {
      alert("Failed to delete deal");
    } finally {
      setDeleting(false);
    }
  };

  const handleSnooze = async (e) => {
    e.preventDefault();
    setSnoozing(true);
    try {
      await dealsAPI.snooze(id, {
        snoozedUntil: new Date(snoozeDate).toISOString(),
        snoozeReason,
      });
      setShowSnooze(false);
      loadDeal();
    } catch (err) {
      alert("Failed to snooze deal");
    } finally {
      setSnoozing(false);
    }
  };

  const handleUnsnooze = async () => {
    try {
      await dealsAPI.unsnooze(id);
      loadDeal();
    } catch (err) {
      alert("Failed to unsnooze deal");
    }
  };

  const openEdit = () => {
    setEditData({
      name: deal?.name || "",
      stage: deal?.stage || "",
      amount: deal?.amount || "",
      contactName: deal?.contactName || "",
      contactEmail: deal?.contactEmail || "",
    });
    setShowEdit(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {};
      if (editData.name !== deal.name) payload.name = editData.name;
      if (editData.stage !== deal.stage) payload.stage = editData.stage;
      if (Number(editData.amount) !== Number(deal.amount))
        payload.amount = Number(editData.amount);
      if (editData.contactName !== (deal.contactName || ""))
        payload.contactName = editData.contactName;
      if (editData.contactEmail !== (deal.contactEmail || ""))
        payload.contactEmail = editData.contactEmail;

      if (Object.keys(payload).length > 0) {
        await dealsAPI.update(id, payload);
      }
      setShowEdit(false);
      loadDeal();
    } catch (err) {
      alert("Failed to update deal");
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (loading) return <LoadingSpinner size="lg" text="Loading deal..." />;
  if (!deal) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-danger mx-auto mb-3" />
        <p className="text-dark font-semibold">Deal not found</p>
        <Link to="/deals" className="text-primary text-sm mt-2 inline-block">
          Back to deals
        </Link>
      </div>
    );
  }

  const d = deal;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back */}
      <Link
        to="/deals"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-dark transition mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to deals
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-light text-primary flex items-center justify-center shrink-0">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark">{d.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted">
              <span className="flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" />
                {formatCurrency(d.amount)}
              </span>
              <span>&middot;</span>
              <span>{d.stage}</span>
              <span>&middot;</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {d.daysStale}d stale
              </span>
              <StatusBadge status={d.stalenessStatus} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={openEdit}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-sm font-medium text-dark hover:bg-gray-50 transition"
          >
            <Edit3 className="w-4 h-4" /> Edit
          </button>
          {d.snoozedUntil ? (
            <button
              onClick={handleUnsnooze}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-warning text-sm font-medium text-warning hover:bg-yellow-50 transition"
            >
              <Bell className="w-4 h-4" /> Unsnooze
            </button>
          ) : (
            <button
              onClick={() => setShowSnooze(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-sm font-medium text-dark hover:bg-gray-50 transition"
            >
              <BellOff className="w-4 h-4" /> Snooze
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-danger text-sm font-medium text-danger hover:bg-red-50 transition disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      {/* Snooze Banner */}
      {d.snoozedUntil && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 mb-6 flex items-center gap-2 text-sm text-yellow-800">
          <BellOff className="w-4 h-4 shrink-0" />
          Snoozed until {formatDate(d.snoozedUntil)} —{" "}
          {d.snoozeReason || "No reason"}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deal Info */}
        <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
          <h3 className="font-semibold text-dark mb-4">Deal Information</h3>
          <dl className="space-y-3">
            {[
              ["CRM Source", d.crmSource],
              ["CRM Deal ID", d.crmDealId],
              ["Stage", d.stage],
              ["Amount", formatCurrency(d.amount)],
              ["Currency", d.currency || "USD"],
              ["Contact", d.contactName || "—"],
              ["Email", d.contactEmail || "—"],
              ["Owner", d.owner?.name || "—"],
              ["Created", formatDate(d.createdAt)],
              ["Last Activity", formatDate(d.lastActivityAt)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4">
                <dt className="text-sm text-muted shrink-0">{label}</dt>
                <dd className="text-sm font-medium text-dark text-right min-w-0 break-all">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Activities */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
            <h3 className="font-semibold text-dark mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" /> Recent Activity
            </h3>
            {deal.activities?.length > 0 ? (
              <div className="space-y-4">
                {deal.activities.map((act, i) => (
                  <div key={i} className="flex gap-3 relative">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                    <div>
                      <p className="text-sm text-dark">
                        {act.type}: {act.description || "—"}
                      </p>
                      <p className="text-xs text-muted mt-0.5">
                        {formatDateTime(act.performedAt || act.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted py-4 text-center">
                No recent activity
              </p>
            )}
          </div>

          {/* Notifications */}
          {deal.notifications?.length > 0 && (
            <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
              <h3 className="font-semibold text-dark mb-4 flex items-center gap-2">
                <Bell className="w-4 h-4 text-warning" /> Notifications
              </h3>
              <div className="space-y-3">
                {deal.notifications.map((n, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg bg-gray-50"
                  >
                    <AlertCircle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-dark">{n.message}</p>
                      <p className="text-xs text-muted mt-0.5">
                        {formatDateTime(n.createdAt)} &middot; {n.channel}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Snooze Modal */}
      {showSnooze && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl relative">
            <button
              onClick={() => setShowSnooze(false)}
              className="absolute top-4 right-4 text-muted hover:text-dark"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-dark mb-4 flex items-center gap-2">
              <BellOff className="w-5 h-5 text-primary" /> Snooze Deal
            </h3>
            <form onSubmit={handleSnooze} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark mb-1">
                  Snooze Until
                </label>
                <input
                  type="date"
                  required
                  value={snoozeDate}
                  onChange={(e) => setSnoozeDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-1">
                  Reason
                </label>
                <input
                  type="text"
                  value={snoozeReason}
                  onChange={(e) => setSnoozeReason(e.target.value)}
                  placeholder="e.g. Waiting for budget approval"
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSnooze(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-medium text-dark hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={snoozing}
                  className="flex-1 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition disabled:opacity-50"
                >
                  {snoozing ? "Snoozing..." : "Snooze"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl relative">
            <button
              onClick={() => setShowEdit(false)}
              className="absolute top-4 right-4 text-muted hover:text-dark"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-dark mb-4 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-primary" /> Edit Deal
            </h3>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark mb-1">
                  Deal Name
                </label>
                <input
                  type="text"
                  required
                  value={editData.name}
                  onChange={(e) =>
                    setEditData({ ...editData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-1">
                  Stage
                </label>
                <select
                  value={editData.stage}
                  onChange={(e) =>
                    setEditData({ ...editData, stage: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                >
                  <option value="Discovery">Discovery</option>
                  <option value="Proposal">Proposal</option>
                  <option value="Negotiation">Negotiation</option>
                  <option value="Closing">Closing</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-1">
                  Amount ($)
                </label>
                <input
                  type="number"
                  value={editData.amount}
                  onChange={(e) =>
                    setEditData({ ...editData, amount: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-1">
                  Contact Name
                </label>
                <input
                  type="text"
                  value={editData.contactName}
                  onChange={(e) =>
                    setEditData({ ...editData, contactName: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={editData.contactEmail}
                  onChange={(e) =>
                    setEditData({ ...editData, contactEmail: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEdit(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-medium text-dark hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
