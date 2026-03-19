import { useState, useEffect } from "react";
import { rulesAPI, dealsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { SkeletonRulesCards } from "../components/Skeleton";
import PageWrapper from "../components/PageWrapper";
import {
  Settings2,
  ChevronRight,
  Edit3,
  Check,
  X,
  RotateCcw,
  Eye,
  EyeOff,
} from "lucide-react";
import PageHeader from "../components/ui/PageHeader";

const STAGES = ["Discovery", "Proposal", "Negotiation", "Closing"];

// Default thresholds used for "Reset to Defaults"
const DEFAULT_THRESHOLDS = {
  Discovery: {
    staleAfterDays: 7,
    escalateAfterDays: 10,
    criticalAfterDays: 14,
  },
  Proposal: { staleAfterDays: 5, escalateAfterDays: 8, criticalAfterDays: 12 },
  Negotiation: {
    staleAfterDays: 3,
    escalateAfterDays: 5,
    criticalAfterDays: 7,
  },
  Closing: { staleAfterDays: 2, escalateAfterDays: 4, criticalAfterDays: 6 },
};

// Classify a deal's current staleness (client-side) against a given rule
function classifyDeal(deal, rule) {
  if (!rule) return "healthy";
  const days = deal.daysStale ?? 0;
  if (days >= rule.criticalAfterDays) return "critical";
  if (days >= rule.escalateAfterDays) return "stale";
  if (days >= rule.staleAfterDays) return "warning";
  return "healthy";
}

// Build a map of stage → { healthy, warning, stale, critical } counts
function buildPreviewCounts(deals, rulesByStage) {
  const counts = {};
  for (const stage of STAGES) {
    counts[stage] = { healthy: 0, warning: 0, stale: 0, critical: 0 };
  }
  for (const deal of deals) {
    if (!STAGES.includes(deal.stage)) continue;
    const rule = rulesByStage[deal.stage];
    const status = classifyDeal(deal, rule);
    counts[deal.stage][status]++;
  }
  return counts;
}

export default function Rules() {
  const { user } = useAuth();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingStage, setEditingStage] = useState(null); // stage name being edited
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  // Preview mode
  const [previewMode, setPreviewMode] = useState(false);
  const [deals, setDeals] = useState([]);
  const [dealsLoading, setDealsLoading] = useState(false);

  // Reset to defaults modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);

  const isAdmin = user?.role === "admin";
  const canWrite = user?.role === "admin" || user?.role === "manager";

  useEffect(() => {
    loadRules();
  }, []);

  useEffect(() => {
    if (previewMode && deals.length === 0) {
      loadDeals();
    }
  }, [previewMode]);

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

  const loadDeals = async () => {
    setDealsLoading(true);
    try {
      const res = await dealsAPI.list({ limit: 500 });
      setDeals(res.data?.data?.deals ?? res.data?.data ?? []);
    } catch (err) {
      console.error("Failed to load deals for preview", err);
    } finally {
      setDealsLoading(false);
    }
  };

  // Return the rule object for a given stage (or null)
  const ruleForStage = (stage) =>
    rules.find(
      (r) => r.stage === stage && (r.pipeline === "default" || !r.pipeline),
    ) ?? null;

  // Build a map for preview counts using current (possibly edited) thresholds
  const rulesByStage = {};
  for (const stage of STAGES) {
    rulesByStage[stage] = ruleForStage(stage);
  }
  const previewCounts = previewMode
    ? buildPreviewCounts(deals, rulesByStage)
    : null;

  const openEdit = (stage) => {
    const rule = ruleForStage(stage);
    setEditingStage(stage);
    setEditForm({
      staleAfterDays:
        rule?.staleAfterDays ?? DEFAULT_THRESHOLDS[stage].staleAfterDays,
      escalateAfterDays:
        rule?.escalateAfterDays ?? DEFAULT_THRESHOLDS[stage].escalateAfterDays,
      criticalAfterDays:
        rule?.criticalAfterDays ?? DEFAULT_THRESHOLDS[stage].criticalAfterDays,
    });
  };

  const cancelEdit = () => {
    setEditingStage(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const rule = ruleForStage(editingStage);
      const payload = {
        staleAfterDays: Number(editForm.staleAfterDays),
        escalateAfterDays: Number(editForm.escalateAfterDays),
        criticalAfterDays: Number(editForm.criticalAfterDays),
      };

      if (
        payload.staleAfterDays >= payload.escalateAfterDays ||
        payload.escalateAfterDays >= payload.criticalAfterDays
      ) {
        alert("Thresholds must increase: Warning < Stale < Critical");
        return;
      }

      if (rule) {
        await rulesAPI.update(rule.id, payload);
      } else {
        await rulesAPI.create({
          stage: editingStage,
          pipeline: "default",
          ...payload,
        });
      }

      setEditingStage(null);
      setEditForm({});
      await loadRules();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to save rule";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    setResetting(true);
    try {
      // Delete existing default-pipeline rules, then recreate with defaults
      for (const stage of STAGES) {
        const rule = ruleForStage(stage);
        if (rule) {
          await rulesAPI.remove(rule.id);
        }
      }
      for (const stage of STAGES) {
        await rulesAPI.create({
          stage,
          pipeline: "default",
          ...DEFAULT_THRESHOLDS[stage],
        });
      }
      setShowResetModal(false);
      await loadRules();
    } catch (err) {
      alert("Failed to reset rules. Please try again.");
    } finally {
      setResetting(false);
    }
  };

  if (loading)
    return (
      <PageWrapper>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="h-7 w-40 bg-[#1e1e1e] rounded animate-pulse" />
            <div className="h-4 w-56 bg-[#1e1e1e] rounded animate-pulse mt-2" />
          </div>
          <SkeletonRulesCards />
        </div>
      </PageWrapper>
    );

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader title="Staleness Rules" description="Define when deals are flagged per pipeline stage">
          <button
            onClick={() => setPreviewMode((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
              previewMode
                ? "bg-[#e8a87c]/10 text-[#e8a87c] border-[#e8a87c]/30"
                : "bg-[#161616] text-[#888] border-[rgba(255,255,255,0.07)] hover:text-[#f0ede8]"
            }`}
          >
            {previewMode ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
            {previewMode ? "Hide Preview" : "Preview Mode"}
          </button>
          {isAdmin && (
            <button
              onClick={() => setShowResetModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-[rgba(255,255,255,0.07)] bg-[#161616] text-[#888] hover:text-[#f0ede8] transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Defaults
            </button>
          )}
        </PageHeader>

        {/* Pipeline visualizer */}
        <div className="overflow-x-auto pb-4">
          <div className="flex items-start gap-2 min-w-max">
            {STAGES.map((stage, idx) => {
              const rule = ruleForStage(stage);
              const isEditing = editingStage === stage;
              const counts = previewCounts?.[stage];

              return (
                <div key={stage} className="flex items-center gap-2">
                  {/* Stage card */}
                  <div
                    className={`w-56 rounded-xl border-2 bg-[#161616] transition-all ${
                      isEditing
                        ? "border-[#e8a87c]"
                        : "border-[rgba(255,255,255,0.07)]"
                    }`}
                  >
                    {/* Card header */}
                    <div
                      className={`px-4 py-3 rounded-t-xl border-b border-[rgba(255,255,255,0.07)] flex items-center justify-between ${
                        isEditing
                          ? "bg-[#e8a87c]/5"
                          : "bg-[#111]"
                      }`}
                    >
                      <span className="font-semibold text-[#f0ede8] text-sm">
                        {stage}
                      </span>
                      {canWrite && !isEditing && (
                        <button
                          onClick={() => openEdit(stage)}
                          className="p-1 rounded-md text-[#888] hover:text-primary hover:bg-[#1e1e1e] transition-colors"
                          title="Edit thresholds"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Card body */}
                    <div className="px-4 py-4 space-y-3">
                      {isEditing ? (
                        /* Edit mode: inputs */
                        <>
                          {[
                            {
                              key: "staleAfterDays",
                              label: "Warning after",
                              color: "text-warning",
                              sliderClass:
                                "accent-amber-500 [&::-webkit-slider-thumb]:bg-amber-500 [&::-moz-range-thumb]:bg-amber-500",
                            },
                            {
                              key: "escalateAfterDays",
                              label: "Stale after",
                              color: "text-danger",
                              sliderClass:
                                "accent-red-500 [&::-webkit-slider-thumb]:bg-red-500 [&::-moz-range-thumb]:bg-red-500",
                            },
                            {
                              key: "criticalAfterDays",
                              label: "Critical after",
                              color: "text-critical",
                              sliderClass:
                                "accent-red-700 [&::-webkit-slider-thumb]:bg-red-700 [&::-moz-range-thumb]:bg-red-700",
                            },
                          ].map(({ key, label, color, sliderClass }) => (
                            <div key={key}>
                              <div className="flex items-center justify-between mb-1.5">
                                <label
                                  className={`text-xs font-medium ${color}`}
                                >
                                  {label}
                                </label>
                                <span
                                  className={`text-xs font-bold ${color} tabular-nums`}
                                >
                                  {editForm[key]}d
                                </span>
                              </div>
                              <div className="relative">
                                <input
                                  type="range"
                                  min="1"
                                  max="60"
                                  value={editForm[key]}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      [key]: Number(e.target.value),
                                    })
                                  }
                                  className={`w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[#333] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#161616] [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#161616] ${sliderClass}`}
                                />
                                {/* Scale markers */}
                                <div className="flex justify-between mt-0.5 px-0.5">
                                  <span className="text-[9px] text-[#555]">
                                    1
                                  </span>
                                  <span className="text-[9px] text-[#555]">
                                    30
                                  </span>
                                  <span className="text-[9px] text-[#555]">
                                    60
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                          <div className="flex gap-1.5 pt-1">
                            <button
                              onClick={saveEdit}
                              disabled={saving}
                              className="flex-1 flex items-center justify-center gap-1 border border-[#e8a87c] text-[#e8a87c] hover:bg-[#e8a87c] hover:text-[#0a0a0a] bg-transparent py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                            >
                              <Check className="w-3 h-3" />
                              {saving ? "Saving…" : "Save"}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="flex-1 flex items-center justify-center border border-[rgba(255,255,255,0.07)] py-1.5 rounded-lg text-xs text-[#f0ede8] hover:bg-[#1e1e1e] transition-colors"
                            >
                              <X className="w-3 h-3 mr-0.5" />
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : rule ? (
                        /* Display mode: threshold badges */
                        <>
                          {[
                            {
                              label: "Warning",
                              value: rule.staleAfterDays,
                              bg: "bg-[#2a1f0a]",
                              text: "text-warning",
                              border: "border-[#f59e0b30]",
                            },
                            {
                              label: "Stale",
                              value: rule.escalateAfterDays,
                              bg: "bg-[#2a0808]",
                              text: "text-danger",
                              border: "border-[#ef444430]",
                            },
                            {
                              label: "Critical",
                              value: rule.criticalAfterDays,
                              bg: "bg-[#2a0808]",
                              text: "text-critical",
                              border: "border-[#ef444450]",
                            },
                          ].map(({ label, value, bg, text, border }) => (
                            <div
                              key={label}
                              className="flex items-center justify-between"
                            >
                              <span className={`text-xs font-medium ${text}`}>
                                {label}
                              </span>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-md ${bg} ${text} border ${border} text-xs font-bold`}
                              >
                                {value}d
                              </span>
                            </div>
                          ))}
                        </>
                      ) : (
                        /* No rule configured */
                        <div className="text-center py-2">
                          <Settings2 className="w-6 h-6 text-[#555] mx-auto mb-1" />
                          <p className="text-xs text-[#888]">
                            No rule set
                          </p>
                          {canWrite && (
                            <button
                              onClick={() => openEdit(stage)}
                              className="text-xs text-primary font-medium hover:underline mt-1"
                            >
                              Configure
                            </button>
                          )}
                        </div>
                      )}

                      {/* Preview counts */}
                      {previewMode && counts && !isEditing && (
                        <div className="pt-2 border-t border-[rgba(255,255,255,0.07)] space-y-1">
                          <p className="text-xs font-medium text-[#888] mb-1.5">
                            Current deals:
                          </p>
                          {dealsLoading ? (
                            <p className="text-xs text-[#888]">
                              Loading…
                            </p>
                          ) : (
                            [
                              {
                                label: "Healthy",
                                count: counts.healthy,
                                color: "text-green-600",
                              },
                              {
                                label: "Warning",
                                count: counts.warning,
                                color: "text-warning",
                              },
                              {
                                label: "Stale",
                                count: counts.stale,
                                color: "text-danger",
                              },
                              {
                                label: "Critical",
                                count: counts.critical,
                                color: "text-critical",
                              },
                            ].map(({ label, count, color }) => (
                              <div
                                key={label}
                                className="flex items-center justify-between"
                              >
                                <span className="text-xs text-[#888]">
                                  {label}
                                </span>
                                <span className={`text-xs font-bold ${color}`}>
                                  {count}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Arrow connector */}
                  {idx < STAGES.length - 1 && (
                    <ChevronRight className="w-5 h-5 text-[#555] shrink-0 mt-10" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend / info */}
        <div className="mt-6 bg-[#161616] border border-[rgba(255,255,255,0.07)] rounded-xl px-5 py-4">
          <div className="flex items-start gap-3">
            <Settings2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div className="text-sm text-[#888] space-y-0.5">
              <p className="font-medium">How thresholds work</p>
              <p className="text-xs text-[#888]">
                <span className="font-semibold text-warning">Warning</span> —
                deal flagged after N days of no activity.{" "}
                <span className="font-semibold text-danger">Stale</span> —
                escalates to manager.{" "}
                <span className="font-semibold text-critical">Critical</span> —
                urgent alert to all stakeholders.
              </p>
            </div>
          </div>
        </div>

        {!canWrite && (
          <p className="text-xs text-[#888] text-center mt-6">
            Contact an admin or manager to modify staleness rules.
          </p>
        )}

        {/* Reset to Defaults modal */}
        {showResetModal && (
          <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
            <div className="bg-[#161616] rounded-2xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#f59e0b]/10 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5 text-[#f59e0b]" />
                </div>
                <div>
                  <h3 className="font-bold text-[#f0ede8]">
                    Reset to Defaults?
                  </h3>
                  <p className="text-sm text-[#888]">
                    This will overwrite all current rule thresholds.
                  </p>
                </div>
              </div>
              <div className="bg-[#111] rounded-xl p-4 mb-5 space-y-1 text-sm">
                {STAGES.map((stage) => (
                  <div
                    key={stage}
                    className="flex items-center justify-between"
                  >
                    <span className="font-medium text-[#f0ede8]">
                      {stage}
                    </span>
                    <span className="text-[#888] text-xs">
                      {DEFAULT_THRESHOLDS[stage].staleAfterDays}d /{" "}
                      {DEFAULT_THRESHOLDS[stage].escalateAfterDays}d /{" "}
                      {DEFAULT_THRESHOLDS[stage].criticalAfterDays}d
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleResetDefaults}
                  disabled={resetting}
                  className="flex-1 border border-[#f59e0b] text-[#f59e0b] hover:bg-[#f59e0b] hover:text-[#0a0a0a] bg-transparent py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {resetting ? "Resetting…" : "Yes, Reset Rules"}
                </button>
                <button
                  onClick={() => setShowResetModal(false)}
                  className="flex-1 border border-[rgba(255,255,255,0.07)] py-2.5 rounded-lg text-sm text-[#f0ede8] hover:bg-[#1e1e1e] transition-colors"
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
