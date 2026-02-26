import { useState, useEffect } from "react";
import { rulesAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import { Settings2, Plus, Edit3, Trash2, X, Check } from "lucide-react";

const STAGES = ["Discovery", "Proposal", "Negotiation", "Closing"];

const EMPTY_FORM = {
  stage: "Discovery",
  pipeline: "",
  warningDays: "",
  staleDays: "",
  criticalDays: "",
};

export default function Rules() {
  const { user } = useAuth();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const isAdmin = user?.role === "admin";
  const canWrite = user?.role === "admin" || user?.role === "manager";

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setLoading(true);
    try {
      const res = await rulesAPI.list();
      setRules(res.data?.data ?? []);
    } catch (err) {
      console.error("Failed to load rules", err);
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (rule) => {
    setEditingId(rule.id);
    setForm({
      stage: rule.stage,
      pipeline: rule.pipeline ?? "",
      warningDays: rule.warningDays ?? "",
      staleDays: rule.staleDays ?? "",
      criticalDays: rule.criticalDays ?? "",
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        stage: form.stage,
        pipeline: form.pipeline || undefined,
        warningDays: Number(form.warningDays),
        staleDays: Number(form.staleDays),
        criticalDays: Number(form.criticalDays),
      };

      if (editingId) {
        await rulesAPI.update(editingId, payload);
      } else {
        await rulesAPI.create(payload);
      }

      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      loadRules();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to save rule";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this rule? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await rulesAPI.remove(id);
      setRules((prev) => prev.filter((r) => r.id !== id));
    } catch {
      alert("Failed to delete rule");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <LoadingSpinner size="lg" text="Loading rules..." />;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark">Staleness Rules</h1>
          <p className="text-muted text-sm mt-1">
            Configure when deals are flagged as warning, stale, or critical
          </p>
        </div>
        {canWrite && (
          <button
            onClick={openNew}
            className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Rule
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-border shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-dark flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-muted" />
              {editingId ? "Edit Rule" : "New Rule"}
            </h3>
            <button
              onClick={handleCancel}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Stage</label>
                <select
                  value={form.stage}
                  onChange={(e) => setForm({ ...form, stage: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  Pipeline <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.pipeline}
                  onChange={(e) => setForm({ ...form, pipeline: e.target.value })}
                  placeholder="e.g. Enterprise, SMB"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { key: "warningDays", label: "Warning (days)", color: "text-warning" },
                { key: "staleDays", label: "Stale (days)", color: "text-danger" },
                { key: "criticalDays", label: "Critical (days)", color: "text-critical" },
              ].map(({ key, label, color }) => (
                <div key={key}>
                  <label className={`block text-xs font-medium mb-1 ${color}`}>{label}</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    placeholder="days"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                {saving ? "Saving…" : editingId ? "Save Changes" : "Create Rule"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-border rounded-lg text-sm text-dark hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rules table */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        {rules.length === 0 ? (
          <div className="text-center py-16">
            <Settings2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-muted font-medium">No rules configured</p>
            {canWrite && (
              <button
                onClick={openNew}
                className="text-primary text-sm font-medium hover:text-primary-hover mt-2 inline-block"
              >
                Create your first rule
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-gray-50/50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Stage</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Pipeline</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-warning uppercase tracking-wider">Warning</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-danger uppercase tracking-wider">Stale</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-critical uppercase tracking-wider">Critical</th>
                {canWrite && (
                  <th className="px-6 py-3" />
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-medium text-dark">{rule.stage}</td>
                  <td className="px-6 py-4 text-muted">{rule.pipeline || <span className="italic text-gray-300">all pipelines</span>}</td>
                  <td className="px-4 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-12 py-1 rounded-md bg-amber-50 text-warning text-xs font-bold border border-amber-200">
                      {rule.warningDays}d
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-12 py-1 rounded-md bg-red-50 text-danger text-xs font-bold border border-red-200">
                      {rule.staleDays}d
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-12 py-1 rounded-md bg-red-100 text-critical text-xs font-bold border border-red-300">
                      {rule.criticalDays}d
                    </span>
                  </td>
                  {canWrite && (
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => openEdit(rule)}
                          className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary-light transition-colors"
                          title="Edit rule"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(rule.id)}
                            disabled={deletingId === rule.id}
                            className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-red-50 transition-colors disabled:opacity-40"
                            title="Delete rule"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!canWrite && (
        <p className="text-xs text-muted text-center mt-4">
          Contact an admin or manager to modify staleness rules.
        </p>
      )}
    </div>
  );
}
