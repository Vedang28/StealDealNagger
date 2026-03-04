import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Users,
  Plug,
  Settings,
  ArrowRight,
  ArrowLeft,
  X,
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { teamAPI, integrationsAPI, rulesAPI } from "../services/api";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
];

const CRM_PROVIDERS = [
  {
    id: "hubspot",
    name: "HubSpot",
    color: "text-orange-600 bg-orange-50 dark:bg-orange-900/20",
  },
  {
    id: "salesforce",
    name: "Salesforce",
    color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
  },
  {
    id: "pipedrive",
    name: "Pipedrive",
    color: "text-green-600 bg-green-50 dark:bg-green-900/20",
  },
];

const DEFAULT_RULES = [
  { stage: "Discovery", warningDays: 7, staleDays: 10, criticalDays: 14 },
  { stage: "Proposal", warningDays: 5, staleDays: 8, criticalDays: 12 },
  { stage: "Negotiation", warningDays: 3, staleDays: 5, criticalDays: 7 },
  { stage: "Closing", warningDays: 2, staleDays: 4, criticalDays: 6 },
];

/* ──── Step 1: Company Info ──────────────────────── */
function CompanyInfoStep({ data, onChange }) {
  return (
    <div className="mt-4 space-y-4">
      <div>
        <label className="block text-xs font-medium text-dark dark:text-gray-300 mb-1.5">
          Team / Company Name
        </label>
        <input
          type="text"
          value={data.teamName}
          onChange={(e) => onChange({ ...data, teamName: e.target.value })}
          placeholder="Acme Corp"
          className="w-full px-3 py-2.5 rounded-lg border border-border dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-dark dark:text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-dark dark:text-gray-300 mb-1.5">
          Timezone
        </label>
        <select
          value={data.timezone}
          onChange={(e) => onChange({ ...data, timezone: e.target.value })}
          className="w-full px-3 py-2.5 rounded-lg border border-border dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>
              {tz.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

/* ──── Step 2: Invite Team ───────────────────────── */
function InviteTeamStep({ invites, onChange }) {
  const addRow = () => onChange([...invites, { email: "", role: "rep" }]);
  const removeRow = (i) => onChange(invites.filter((_, idx) => idx !== i));
  const update = (i, field, val) =>
    onChange(
      invites.map((inv, idx) => (idx === i ? { ...inv, [field]: val } : inv)),
    );

  return (
    <div className="mt-4 space-y-3">
      {invites.map((inv, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="email"
            value={inv.email}
            onChange={(e) => update(i, "email", e.target.value)}
            placeholder="teammate@company.com"
            className="flex-1 px-3 py-2 rounded-lg border border-border dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-dark dark:text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
          />
          <select
            value={inv.role}
            onChange={(e) => update(i, "role", e.target.value)}
            className="w-28 px-2 py-2 rounded-lg border border-border dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
          >
            <option value="rep">Rep</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
          <button
            onClick={() => removeRow(i)}
            className="p-2 rounded-lg text-muted hover:text-danger hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        onClick={addRow}
        className="flex items-center gap-1.5 text-sm text-primary hover:text-primary-hover font-medium transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add teammate
      </button>
      <p className="text-xs text-muted dark:text-gray-400">
        They'll receive a temporary password. You can also invite later from the
        Team page.
      </p>
    </div>
  );
}

/* ──── Step 3: Connect Integration ───────────────── */
function ConnectIntegrationStep({ connected, onConnect }) {
  return (
    <div className="mt-4 space-y-2">
      {CRM_PROVIDERS.map((crm) => (
        <div
          key={crm.id}
          className="flex items-center justify-between p-3 rounded-lg border border-border dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
        >
          <span
            className={`text-sm font-medium ${crm.color} px-2 py-0.5 rounded-md`}
          >
            {crm.name}
          </span>
          {connected.includes(crm.id) ? (
            <span className="flex items-center gap-1 text-xs font-medium text-success">
              <CheckCircle2 className="w-3.5 h-3.5" /> Connected
            </span>
          ) : (
            <button
              onClick={() => onConnect(crm.id)}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white transition-colors"
            >
              Connect
            </button>
          )}
        </div>
      ))}
      <p className="text-xs text-muted dark:text-gray-400 text-center pt-1">
        Connect later from the Integrations page if you prefer.
      </p>
    </div>
  );
}

/* ──── Step 4: Create First Rule ─────────────────── */
function CreateRuleStep({ rules, onChange }) {
  const update = (i, field, val) =>
    onChange(
      rules.map((r, idx) => (idx === i ? { ...r, [field]: Number(val) } : r)),
    );

  return (
    <div className="mt-4 space-y-3">
      <p className="text-xs text-muted dark:text-gray-400">
        Set the number of days before each alert tier fires per stage.
      </p>
      {rules.map((r, i) => (
        <div
          key={r.stage}
          className="p-3 rounded-lg border border-border dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
        >
          <p className="text-sm font-medium text-dark dark:text-white mb-2">
            {r.stage}
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: "warningDays", label: "Warning", color: "text-warning" },
              { key: "staleDays", label: "Stale", color: "text-danger" },
              {
                key: "criticalDays",
                label: "Critical",
                color: "text-critical",
              },
            ].map(({ key, label, color }) => (
              <div key={key}>
                <label
                  className={`block text-[10px] font-medium ${color} mb-1`}
                >
                  {label}
                </label>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={r[key]}
                  onChange={(e) => update(i, key, e.target.value)}
                  className="w-full px-2 py-1.5 rounded-md border border-border dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-dark dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ──── STEP DEFINITIONS ──────────────────────────── */
const STEP_META = [
  {
    icon: Building2,
    title: "Company Info",
    subtitle: "Tell us about your team so we can set things up.",
    color: "text-primary bg-primary-light dark:bg-orange-900/30",
  },
  {
    icon: Users,
    title: "Invite Your Team",
    subtitle: "Add your sales reps and managers so they get alerts.",
    color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30",
  },
  {
    icon: Plug,
    title: "Connect a CRM",
    subtitle: "Import deals automatically from your CRM of choice.",
    color: "text-blue-600 bg-blue-50 dark:bg-blue-900/30",
  },
  {
    icon: Settings,
    title: "Staleness Rules",
    subtitle:
      "Configure when deals trigger warning, stale, and critical alerts.",
    color: "text-purple-600 bg-purple-50 dark:bg-purple-900/30",
  },
];

export default function Onboarding({ onComplete, onSkip }) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  // Step 1 data
  const [companyData, setCompanyData] = useState({
    teamName: "",
    timezone: "America/New_York",
  });

  // Step 2 data
  const [invites, setInvites] = useState([{ email: "", role: "rep" }]);

  // Step 3 data
  const [connectedCRMs, setConnectedCRMs] = useState([]);

  // Step 4 data
  const [rules, setRules] = useState(DEFAULT_RULES);

  const current = STEP_META[step];
  const isLast = step === STEP_META.length - 1;

  const handleConnectCRM = useCallback(async (provider) => {
    try {
      const res = await integrationsAPI.getAuthUrl(
        provider,
        window.location.origin + "/integrations",
      );
      const url = res.data?.data?.url;
      if (url && url.startsWith("http")) {
        window.open(url, "_blank", "noopener");
      }
      // Optimistically mark as connected for onboarding UX
      setConnectedCRMs((prev) => [...prev, provider]);
    } catch {
      // Scaffold: mark as connected anyway to let user proceed
      setConnectedCRMs((prev) => [...prev, provider]);
    }
  }, []);

  async function saveStepData() {
    setSaving(true);
    try {
      if (step === 0 && companyData.teamName.trim()) {
        await teamAPI.updateTeam({
          name: companyData.teamName.trim(),
          settings: { timezone: companyData.timezone },
        });
      }
      if (step === 1) {
        const validInvites = invites.filter((inv) => inv.email.trim());
        for (const inv of validInvites) {
          try {
            await teamAPI.inviteUser({
              email: inv.email.trim(),
              name: inv.email.split("@")[0],
              role: inv.role,
              tempPassword: "Welcome123!",
            });
          } catch {
            // Skip duplicates / errors silently during onboarding
          }
        }
      }
      if (step === 3) {
        for (const r of rules) {
          try {
            await rulesAPI.create({
              stage: r.stage,
              warningDays: r.warningDays,
              staleDays: r.staleDays,
              criticalDays: r.criticalDays,
            });
          } catch {
            // Skip duplicates
          }
        }
      }
    } catch {
      // Non-blocking: onboarding should not fail hard
    } finally {
      setSaving(false);
    }
  }

  async function goNext() {
    await saveStepData();
    if (isLast) {
      onComplete();
      navigate("/dashboard");
    } else {
      setDirection(1);
      setStep((s) => s + 1);
    }
  }

  function goPrev() {
    if (step > 0) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  }

  const progress = ((step + 1) / STEP_META.length) * 100;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onSkip}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Skip */}
        <button
          onClick={onSkip}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-lg text-muted dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Skip setup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100 dark:bg-gray-800">
          <motion.div
            className="h-full bg-primary"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Step counter */}
        <div className="px-6 pt-5 pb-2">
          <span className="text-xs font-medium text-muted dark:text-gray-400">
            Step {step + 1} of {STEP_META.length}
          </span>
        </div>

        {/* Step content with slide animation */}
        <div className="px-6 pb-6 overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -40 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {/* Icon */}
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${current.color}`}
              >
                <current.icon className="w-6 h-6" />
              </div>

              <h2 className="text-xl font-bold text-dark dark:text-white">
                {current.title}
              </h2>
              <p className="text-sm text-muted dark:text-gray-400 mt-1">
                {current.subtitle}
              </p>

              {step === 0 && (
                <CompanyInfoStep data={companyData} onChange={setCompanyData} />
              )}
              {step === 1 && (
                <InviteTeamStep invites={invites} onChange={setInvites} />
              )}
              {step === 2 && (
                <ConnectIntegrationStep
                  connected={connectedCRMs}
                  onConnect={handleConnectCRM}
                />
              )}
              {step === 3 && (
                <CreateRuleStep rules={rules} onChange={setRules} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-1.5 pb-4">
          {STEP_META.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setDirection(i > step ? 1 : -1);
                setStep(i);
              }}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                i === step
                  ? "bg-primary w-4"
                  : i < step
                    ? "bg-primary/50"
                    : "bg-gray-300 dark:bg-gray-600"
              }`}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="px-6 pb-6 flex items-center justify-between gap-3">
          <button
            onClick={goPrev}
            disabled={step === 0 || saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border dark:border-gray-700 text-sm font-medium text-dark dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <button
            onClick={goNext}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors active:scale-95 disabled:opacity-70"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving…
              </>
            ) : isLast ? (
              "Go to Dashboard"
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
