import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { dealsAPI } from "../services/api";
import StatusBadge from "./StatusBadge";
import LoadingSpinner from "./LoadingSpinner";
import {
  X,
  ExternalLink,
  DollarSign,
  Clock,
  Calendar,
  Briefcase,
  Edit3,
  Trash2,
  BellOff,
  Bell,
  User,
} from "lucide-react";

export default function DealSlideOver({ dealId, onClose, onUpdate }) {
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Edit state
  const [showEdit, setShowEdit] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);

  // Snooze state
  const [showSnooze, setShowSnooze] = useState(false);
  const [snoozeDate, setSnoozeDate] = useState("");
  const [snoozeReason, setSnoozeReason] = useState("");
  const [snoozing, setSnoozing] = useState(false);

  const isOpen = !!dealId;

  useEffect(() => {
    if (!dealId) {
      setDeal(null);
      setShowEdit(false);
      setShowSnooze(false);
      return;
    }
    setLoading(true);
    setShowEdit(false);
    setShowSnooze(false);
    dealsAPI
      .getById(dealId)
      .then((res) => setDeal(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [dealId]);

  const reload = () => {
    if (!dealId) return;
    dealsAPI
      .getById(dealId)
      .then((res) => setDeal(res.data.data))
      .catch(() => {});
  };

  const handleDelete = async () => {
    if (!confirm("Delete this deal? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await dealsAPI.remove(dealId);
      onUpdate?.();
      onClose();
    } catch {
      alert("Failed to delete deal");
    } finally {
      setDeleting(false);
    }
  };

  const handleSnooze = async (e) => {
    e.preventDefault();
    setSnoozing(true);
    try {
      await dealsAPI.snooze(dealId, {
        snoozedUntil: new Date(snoozeDate).toISOString(),
        snoozeReason,
      });
      setShowSnooze(false);
      reload();
      onUpdate?.();
    } catch {
      alert("Failed to snooze deal");
    } finally {
      setSnoozing(false);
    }
  };

  const handleUnsnooze = async () => {
    try {
      await dealsAPI.unsnooze(dealId);
      reload();
      onUpdate?.();
    } catch {
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

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await dealsAPI.update(dealId, {
        ...editData,
        amount: editData.amount ? Number(editData.amount) : undefined,
      });
      setShowEdit(false);
      reload();
      onUpdate?.();
    } catch {
      alert("Failed to update deal");
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`;
    return `$${num}`;
  };

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[480px] max-w-full bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <LoadingSpinner text="Loading deal..." />
          </div>
        ) : !deal ? null : (
          <>
            {/* Header */}
            <div className="px-6 py-5 border-b border-border flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-light text-primary flex items-center justify-center shrink-0 mt-0.5">
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-dark truncate">{deal.name}</h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-xs font-medium text-gray-text">
                    {deal.stage}
                  </span>
                  <span className="text-sm font-semibold text-dark flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-muted" />
                    {formatCurrency(deal.amount)}
                  </span>
                  <StatusBadge status={deal.stalenessStatus} />
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-muted shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

              {/* Staleness info */}
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1.5 text-muted">
                  <Clock className="w-4 h-4" />
                  <span><strong className="text-dark">{deal.daysStale}d</strong> stale</span>
                </span>
                {deal.lastActivityAt && (
                  <span className="flex items-center gap-1.5 text-muted">
                    <Calendar className="w-4 h-4" />
                    Last activity {formatDate(deal.lastActivityAt)}
                  </span>
                )}
              </div>

              {/* Snooze status */}
              {deal.isSnoozed && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
                  <BellOff className="w-4 h-4 shrink-0" />
                  <span>Snoozed until {formatDate(deal.snoozedUntil)}</span>
                  {deal.snoozeReason && (
                    <span className="text-amber-600">— {deal.snoozeReason}</span>
                  )}
                </div>
              )}

              {/* Metadata */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <span className="text-muted w-28 shrink-0">CRM Source</span>
                  <span className="text-dark font-medium">{deal.crmSource || "—"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted w-28 shrink-0">CRM ID</span>
                  <span className="text-dark font-mono text-xs">{deal.crmDealId || "—"}</span>
                </div>
                {deal.contactName && (
                  <div className="flex items-center gap-3">
                    <span className="text-muted w-28 shrink-0">Contact</span>
                    <span className="text-dark font-medium flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-muted" />
                      {deal.contactName}
                      {deal.contactEmail && (
                        <span className="text-muted font-normal">({deal.contactEmail})</span>
                      )}
                    </span>
                  </div>
                )}
                {deal.owner && (
                  <div className="flex items-center gap-3">
                    <span className="text-muted w-28 shrink-0">Owner</span>
                    <span className="text-dark font-medium">{deal.owner.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <span className="text-muted w-28 shrink-0">Created</span>
                  <span className="text-dark">{formatDate(deal.createdAt)}</span>
                </div>
              </div>

              {/* Edit form */}
              {showEdit && (
                <form onSubmit={handleSave} className="bg-white border border-border rounded-xl p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-dark">Edit Deal</h4>
                  <div className="space-y-3">
                    <input
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      placeholder="Deal name"
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      required
                    />
                    <select
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      value={editData.stage}
                      onChange={(e) => setEditData({ ...editData, stage: e.target.value })}
                    >
                      <option value="Discovery">Discovery</option>
                      <option value="Proposal">Proposal</option>
                      <option value="Negotiation">Negotiation</option>
                      <option value="Closing">Closing</option>
                    </select>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      placeholder="Amount"
                      value={editData.amount}
                      onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
                    />
                    <input
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      placeholder="Contact name"
                      value={editData.contactName}
                      onChange={(e) => setEditData({ ...editData, contactName: e.target.value })}
                    />
                    <input
                      type="email"
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      placeholder="Contact email"
                      value={editData.contactEmail}
                      onChange={(e) => setEditData({ ...editData, contactEmail: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 bg-primary hover:bg-primary-hover text-white py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      {saving ? "Saving…" : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEdit(false)}
                      className="px-4 py-2 border border-border rounded-lg text-sm text-dark hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Snooze form */}
              {showSnooze && (
                <form onSubmit={handleSnooze} className="bg-white border border-border rounded-xl p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-dark">Snooze Deal</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-muted mb-1">Snooze until</label>
                      <input
                        type="date"
                        required
                        value={snoozeDate}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setSnoozeDate(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1">Reason (optional)</label>
                      <input
                        type="text"
                        value={snoozeReason}
                        onChange={(e) => setSnoozeReason(e.target.value)}
                        placeholder="e.g. Waiting for Q2 budget"
                        className="w-full px-3 py-2 border border-border rounded-lg text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={snoozing}
                      className="flex-1 bg-primary hover:bg-primary-hover text-white py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      {snoozing ? "Snoozing…" : "Snooze Deal"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSnooze(false)}
                      className="px-4 py-2 border border-border rounded-lg text-sm text-dark hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Footer actions */}
            <div className="px-6 py-4 border-t border-border space-y-3">
              {/* Action buttons */}
              {!showEdit && !showSnooze && (
                <div className="flex gap-2">
                  <button
                    onClick={openEdit}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium text-dark hover:bg-gray-50 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                  {deal.isSnoozed ? (
                    <button
                      onClick={handleUnsnooze}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-300 text-sm font-medium text-amber-700 hover:bg-amber-50 transition-colors"
                    >
                      <Bell className="w-3.5 h-3.5" /> Unsnooze
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowSnooze(true)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium text-dark hover:bg-gray-50 transition-colors"
                    >
                      <BellOff className="w-3.5 h-3.5" /> Snooze
                    </button>
                  )}
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {deleting ? "Deleting…" : "Delete"}
                  </button>
                </div>
              )}

              {/* Deep-link */}
              <Link
                to={`/deals/${dealId}`}
                className="flex items-center justify-center gap-1.5 text-sm text-primary hover:text-primary-hover font-medium transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View full details
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
