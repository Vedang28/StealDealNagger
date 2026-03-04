import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Database, Upload, Settings, MessageSquare, Users, CheckCircle2, X,
  ArrowRight, ArrowLeft, Plug, Bell, ShieldCheck,
} from "lucide-react";

const STEPS = [
  {
    id: 1,
    icon: Sparkles,
    title: "Welcome to Stale Deal Nagger",
    subtitle: "Let's get your pipeline monitoring set up in a few quick steps.",
    color: "text-primary bg-primary-light dark:bg-orange-900/30",
    content: (
      <ul className="space-y-3 mt-4">
        {[
          { icon: Bell, text: "Automatic staleness detection for every deal" },
          { icon: ShieldCheck, text: "Role-based alerts for reps and managers" },
          { icon: Sparkles, text: "Configurable thresholds per pipeline stage" },
        ].map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-start gap-3 text-sm text-dark dark:text-gray-300">
            <Icon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            {text}
          </li>
        ))}
      </ul>
    ),
  },
  {
    id: 2,
    icon: Database,
    title: "Connect Your CRM",
    subtitle: "Import deals automatically from HubSpot, Salesforce, or Pipedrive.",
    color: "text-blue-600 bg-blue-50 dark:bg-blue-900/30",
    content: (
      <div className="mt-4 space-y-2">
        {["HubSpot", "Salesforce", "Pipedrive"].map((name) => (
          <div key={name} className="flex items-center justify-between p-3 rounded-lg border border-border dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <span className="text-sm font-medium text-dark dark:text-white">{name}</span>
            <span className="text-xs text-muted dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">Phase 5</span>
          </div>
        ))}
        <p className="text-xs text-muted dark:text-gray-400 text-center pt-1">
          You can connect integrations later in the Integrations page.
        </p>
      </div>
    ),
  },
  {
    id: 3,
    icon: Upload,
    title: "Import Your Deals",
    subtitle: "Add deals manually or import them from your connected CRM.",
    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30",
    content: (
      <div className="mt-4 space-y-3">
        <div className="p-4 rounded-lg border border-dashed border-border dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-center">
          <Upload className="w-8 h-8 text-muted dark:text-gray-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-dark dark:text-white">CRM Import</p>
          <p className="text-xs text-muted dark:text-gray-400 mt-1">Available after connecting a CRM in Phase 5</p>
        </div>
        <p className="text-xs text-center text-muted dark:text-gray-400">
          Or add deals manually via the{" "}
          <span className="text-primary font-medium">Deals</span> page at any time.
        </p>
      </div>
    ),
  },
  {
    id: 4,
    icon: Settings,
    title: "Configure Staleness Rules",
    subtitle: "Define when deals are considered warning, stale, or critical per pipeline stage.",
    color: "text-purple-600 bg-purple-50 dark:bg-purple-900/30",
    content: (
      <div className="mt-4 space-y-2">
        {[
          { stage: "Discovery", warning: "7d", stale: "10d", critical: "14d" },
          { stage: "Proposal", warning: "5d", stale: "8d", critical: "12d" },
          { stage: "Negotiation", warning: "3d", stale: "5d", critical: "7d" },
          { stage: "Closing", warning: "2d", stale: "4d", critical: "6d" },
        ].map((r) => (
          <div key={r.stage} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-border dark:border-gray-700 text-xs">
            <span className="font-medium text-dark dark:text-white">{r.stage}</span>
            <div className="flex items-center gap-2">
              <span className="text-warning">⚠ {r.warning}</span>
              <span className="text-danger">● {r.stale}</span>
              <span className="text-critical font-bold">🔴 {r.critical}</span>
            </div>
          </div>
        ))}
        <p className="text-xs text-center text-muted dark:text-gray-400 pt-1">
          Customize these thresholds in the <span className="text-primary font-medium">Rules</span> page.
        </p>
      </div>
    ),
  },
  {
    id: 5,
    icon: MessageSquare,
    title: "Connect Slack",
    subtitle: "Get instant DMs when deals go stale and let reps snooze alerts from Slack.",
    color: "text-green-600 bg-green-50 dark:bg-green-900/30",
    content: (
      <div className="mt-4">
        <div className="flex items-center gap-3 p-4 rounded-lg border border-border dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <Plug className="w-8 h-8 text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-dark dark:text-white">Slack Integration</p>
            <p className="text-xs text-muted dark:text-gray-400 mt-0.5">Coming in Phase 5 — OAuth connection + Block Kit alerts</p>
          </div>
        </div>
        <p className="text-xs text-center text-muted dark:text-gray-400 mt-3">
          Skip for now and connect later in{" "}
          <span className="text-primary font-medium">Integrations</span>.
        </p>
      </div>
    ),
  },
  {
    id: 6,
    icon: Users,
    title: "Invite Your Team",
    subtitle: "Add your sales reps and managers so they can receive alerts.",
    color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30",
    content: (
      <div className="mt-4 space-y-3">
        <div className="p-3 rounded-lg border border-border dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-muted dark:text-gray-400">
          You can invite team members with a temp password from the{" "}
          <span className="text-primary font-medium">Team</span> page. Each member gets role-appropriate alerts.
        </div>
        <div className="space-y-1.5">
          {[
            { role: "Admin", desc: "Full access + team management" },
            { role: "Manager", desc: "See all deals + invite reps" },
            { role: "Rep", desc: "See own deals + receive alerts" },
          ].map(({ role, desc }) => (
            <div key={role} className="flex items-center gap-2 text-xs">
              <span className="font-medium text-dark dark:text-white w-16">{role}</span>
              <span className="text-muted dark:text-gray-400">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 7,
    icon: CheckCircle2,
    title: "You're All Set!",
    subtitle: "Your pipeline monitoring is ready. Head to the dashboard to explore.",
    color: "text-success bg-success-light dark:bg-green-900/30",
    content: (
      <div className="mt-4 text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-success" />
        </div>
        <p className="text-sm text-dark dark:text-gray-300">
          Start by adding your first deal or running a staleness check to see the engine in action.
        </p>
      </div>
    ),
  },
];

export default function Onboarding({ onComplete, onSkip }) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const navigate = useNavigate();

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  function goNext() {
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

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onSkip} />

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
            Step {step + 1} of {STEPS.length}
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
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${current.color}`}>
                <current.icon className="w-6 h-6" />
              </div>

              <h2 className="text-xl font-bold text-dark dark:text-white">{current.title}</h2>
              <p className="text-sm text-muted dark:text-gray-400 mt-1">{current.subtitle}</p>

              {current.content}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-1.5 pb-4">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => { setDirection(i > step ? 1 : -1); setStep(i); }}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                i === step ? "bg-primary w-4" : "bg-gray-300 dark:bg-gray-600"
              }`}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="px-6 pb-6 flex items-center justify-between gap-3">
          <button
            onClick={goPrev}
            disabled={step === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border dark:border-gray-700 text-sm font-medium text-dark dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <button
            onClick={goNext}
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors active:scale-95"
          >
            {isLast ? "Go to Dashboard" : "Next"}
            {!isLast && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
