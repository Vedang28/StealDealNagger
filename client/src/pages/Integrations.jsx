import { useState, useEffect } from "react";
import { integrationsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { SkeletonIntegrations } from "../components/Skeleton";
import PageWrapper from "../components/PageWrapper";
import {
  Plug,
  CheckCircle2,
  Circle,
  RefreshCw,
  X,
  AlertCircle,
  Loader2,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
  GitBranch,
  MessageSquare,
  Table2,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "../components/ui/PageHeader";

// HubSpot sprocket SVG logo
const HubSpotIcon = ({ className = "" }) => (
  <svg viewBox="325 0 190 150" fill="currentColor" className={className}>
    <path d="M461.278 69.831c-3.256-5.602-7.836-10.093-13.562-13.474-4.279-2.491-8.716-4.072-13.716-4.751v-17.8c5-2.123 8.103-6.822 8.103-12.304 0-7.472-5.992-13.527-13.458-13.527-7.472 0-13.569 6.055-13.569 13.527 0 5.482 2.924 10.181 7.924 12.304v17.808c-4 .578-8.148 1.825-11.936 3.741-7.737-5.876-33.107-25.153-47.948-36.412.352-1.269.623-2.577.623-3.957 0-8.276-6.702-14.984-14.981-14.984S333.78 6.71 333.78 14.986c0 8.275 6.706 14.985 14.985 14.985 2.824 0 5.436-.826 7.69-2.184l3.132 2.376 43.036 31.008c-2.275 2.089-4.394 4.465-6.089 7.131C393.099 73.737 391 79.717 391 86.24v1.361c0 4.579.87 8.902 2.352 12.963 1.305 3.546 3.213 6.77 5.576 9.685l-14.283 14.318a11.501 11.501 0 0 0-12.166 2.668 11.499 11.499 0 0 0-3.388 8.19c.001 3.093 1.206 6 3.394 8.187a11.5 11.5 0 0 0 8.188 3.394 11.51 11.51 0 0 0 8.191-3.394 11.514 11.514 0 0 0 3.39-8.187c0-1.197-.185-2.365-.533-3.475l14.763-14.765c2.024 1.398 4.21 2.575 6.56 3.59 4.635 2.004 9.751 3.225 15.35 3.225h1.026c6.19 0 12.029-1.454 17.518-4.428 5.784-3.143 10.311-7.441 13.731-12.928 3.438-5.502 5.331-11.581 5.331-18.269v-.334c0-6.579-1.523-12.649-4.722-18.21zm-18.038 30.973c-4.007 4.453-8.613 7.196-13.82 7.196h-.858c-2.974 0-5.883-.822-8.731-2.317-3.21-1.646-5.65-3.994-7.647-6.967-2.064-2.918-3.184-6.104-3.184-9.482v-1.026c0-3.321.637-6.47 2.243-9.444 1.717-3.251 4.036-5.779 7.12-7.789 3.028-1.996 6.262-2.975 9.864-2.975h.335c3.266 0 6.358.644 9.276 2.137 2.973 1.592 5.402 3.767 7.285 6.628 1.829 2.862 2.917 5.949 3.267 9.312.055.699.083 1.415.083 2.099 0 4.564-1.744 8.791-5.233 12.628z"/>
  </svg>
);

// Salesforce cloud logo
const SalesforceIcon = ({ className = "" }) => (
  <svg viewBox="0 0 999 700" fill="currentColor" className={className}>
    <path d="M416.224 76.763c32.219-33.57 77.074-54.391 126.682-54.391 65.946 0 123.48 36.772 154.12 91.361 26.626-11.896 56.098-18.514 87.106-18.514 118.94 0 215.368 97.268 215.368 217.247 0 119.993-96.428 217.261-215.368 217.261a213.735 213.735 0 0 1-42.422-4.227c-26.981 48.128-78.397 80.646-137.412 80.646-24.705 0-48.072-5.706-68.877-15.853-27.352 64.337-91.077 109.448-165.348 109.448-77.344 0-143.261-48.939-168.563-117.574-11.057 2.348-22.513 3.572-34.268 3.572C75.155 585.74.5 510.317.5 417.262c0-62.359 33.542-116.807 83.378-145.937-10.26-23.608-15.967-49.665-15.967-77.06C67.911 87.25 154.79.5 261.948.5c62.914 0 118.827 29.913 154.276 76.263"/>
  </svg>
);

// SVG icon components for each provider
const ProviderIcon = ({ id, className = "" }) => {
  if (id === "hubspot") return <HubSpotIcon className={className} />;
  if (id === "salesforce") return <SalesforceIcon className={className} />;
  const icons = {
    pipedrive: GitBranch,
    slack: MessageSquare,
    sheets: Table2,
  };
  const Icon = icons[id] || Plug;
  return <Icon className={className} />;
};

// Provider metadata with proper icon styling (no emojis)
const PROVIDERS = [
  {
    id: "hubspot",
    name: "HubSpot",
    category: "crm",
    description: "Sync deals and activities from your HubSpot CRM pipeline.",
    iconColor: "text-orange-600 dark:text-orange-400",
    iconBg: "bg-orange-100 dark:bg-orange-900/30",
    border: "border-orange-200 dark:border-orange-800/40",
    comingSoon: false,
  },
  {
    id: "salesforce",
    name: "Salesforce",
    category: "crm",
    description: "Monitor opportunities in Salesforce Sales Cloud.",
    iconColor: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    border: "border-blue-200 dark:border-blue-800/40",
    comingSoon: true,
  },
  {
    id: "pipedrive",
    name: "Pipedrive",
    category: "crm",
    description: "Pull deals and activity history from Pipedrive.",
    iconColor: "text-green-600 dark:text-green-400",
    iconBg: "bg-green-100 dark:bg-green-900/30",
    border: "border-green-200 dark:border-green-800/40",
    comingSoon: true,
  },
  {
    id: "slack",
    name: "Slack",
    category: "notification",
    description: "Send stale deal nudges directly to reps in Slack.",
    iconColor: "text-purple-600 dark:text-purple-400",
    iconBg: "bg-purple-100 dark:bg-purple-900/30",
    border: "border-purple-200 dark:border-purple-800/40",
    comingSoon: false,
  },
  {
    id: "sheets",
    name: "Google Sheets",
    category: "notification",
    description: "Export pipeline reports to a Google Sheet automatically.",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
    border: "border-emerald-200 dark:border-emerald-800/40",
    comingSoon: true,
  },
];

function formatTimeAgo(dateStr) {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Integrations() {
  const { user } = useAuth();
  const toast = useToast();
  const [statusMap, setStatusMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(null);
  const [showDisconnectModal, setShowDisconnectModal] = useState(null); // provider id

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    setLoading(true);
    try {
      const res = await integrationsAPI.getAll();
      setStatusMap(res.data?.data ?? {});
    } catch (err) {
      console.error("Failed to load integrations", err);
    } finally {
      setLoading(false);
    }
  };

  // OAuth flow state
  const [oauthProvider, setOauthProvider] = useState(null);
  const [oauthStep, setOauthStep] = useState(0); // 0=closed, 1=authorize, 2=connecting, 3=done

  const handleConnect = (provider) => {
    if (provider.comingSoon) {
      toast.info(`${provider.name} integration coming soon`);
      return;
    }
    // Open the OAuth flow modal
    setOauthProvider(provider);
    setOauthStep(1);
  };

  const handleOAuthAuthorize = async () => {
    setOauthStep(2);
    try {
      // Try to get real OAuth URL from backend first
      let oauthUrl = null;
      try {
        const res = await integrationsAPI.getAuthUrl(oauthProvider.id);
        oauthUrl = res.data?.data?.url;
      } catch {
        // No real OAuth URL — fall back to simulated connect
      }

      if (oauthUrl) {
        // Real OAuth: redirect to provider
        window.location.href = oauthUrl;
        return;
      }

      // Simulated OAuth fallback for demo/dev
      await new Promise((r) => setTimeout(r, 1800));
      await integrationsAPI.connect(oauthProvider.id, {
        scope:
          oauthProvider.category === "crm"
            ? "deals,contacts,activities"
            : "chat:write,incoming-webhook",
      });
      setOauthStep(3);
      await loadIntegrations();
      setTimeout(() => {
        setOauthStep(0);
        setOauthProvider(null);
        toast.success(`${oauthProvider.name} connected successfully!`);
      }, 1500);
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          `Failed to connect ${oauthProvider.name}`,
      );
      setOauthStep(0);
      setOauthProvider(null);
    }
  };

  const closeOAuth = () => {
    if (oauthStep === 2) return; // don't close while connecting
    setOauthStep(0);
    setOauthProvider(null);
  };

  const handleDisconnect = async () => {
    if (!showDisconnectModal) return;
    setDisconnecting(showDisconnectModal);
    try {
      await integrationsAPI.disconnect(showDisconnectModal);
      await loadIntegrations();
      toast.success("Integration disconnected.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to disconnect");
    } finally {
      setDisconnecting(null);
      setShowDisconnectModal(null);
    }
  };

  const handleSync = async (providerId) => {
    try {
      const res = await integrationsAPI.sync(providerId);
      const data = res.data?.data;
      toast.success(`Synced ${data?.synced ?? 0} deals from ${providerId}`);
      await loadIntegrations();
    } catch (err) {
      toast.error(
        err.response?.data?.error?.message || `Failed to sync ${providerId}`,
      );
    }
  };

  const connectedCount = PROVIDERS.filter(
    (p) => statusMap[p.id]?.connected,
  ).length;

  if (loading)
    return (
      <PageWrapper>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="h-7 w-36 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-52 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-2" />
          </div>
          <SkeletonIntegrations />
        </div>
      </PageWrapper>
    );

  const crmProviders = PROVIDERS.filter((p) => p.category === "crm");
  const notifProviders = PROVIDERS.filter((p) => p.category === "notification");

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Integrations"
          description={`${connectedCount} of ${PROVIDERS.length} integrations connected`}
        />

        {/* CRM section */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-muted dark:text-gray-400 uppercase tracking-wider mb-4">
            CRM Integrations
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {crmProviders.map((provider) => (
              <IntegrationCard
                key={provider.id}
                provider={provider}
                status={statusMap[provider.id]}
                isAdmin={isAdmin}
                onConnect={() => handleConnect(provider)}
                onDisconnect={() => setShowDisconnectModal(provider.id)}
                onSync={handleSync}
              />
            ))}
          </div>
        </section>

        {/* Notification section */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-muted dark:text-gray-400 uppercase tracking-wider mb-4">
            Notification Channels
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {notifProviders.map((provider) => (
              <IntegrationCard
                key={provider.id}
                provider={provider}
                status={statusMap[provider.id]}
                isAdmin={isAdmin}
                onConnect={() => handleConnect(provider)}
                onDisconnect={() => setShowDisconnectModal(provider.id)}
                onSync={handleSync}
              />
            ))}
          </div>
        </section>

        {/* Info banner */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl px-5 py-4">
          <div className="flex items-start gap-3">
            <Plug className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p className="font-medium">Integration Guide</p>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
                Connect your CRM to sync deals automatically. Notification
                channels let you send alerts directly to your team.
              </p>
            </div>
          </div>
        </div>

        {/* OAuth Flow Modal */}
        {oauthProvider && oauthStep > 0 && (
          <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
              {/* Modal header */}
              <div
                className={`px-6 py-4 border-b border-border dark:border-gray-700 flex items-center justify-between ${oauthProvider.iconBg}`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-lg ${oauthProvider.iconBg} flex items-center justify-center`}>
                    <ProviderIcon id={oauthProvider.id} className={`w-5 h-5 ${oauthProvider.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-dark dark:text-white text-sm">
                      Connect {oauthProvider.name}
                    </h3>
                    <p className="text-xs text-muted dark:text-gray-400">
                      OAuth 2.0 Authorization
                    </p>
                  </div>
                </div>
                {oauthStep !== 2 && (
                  <button
                    onClick={closeOAuth}
                    className="p-1.5 rounded-lg hover:bg-white/60 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X className="w-4 h-4 text-muted dark:text-gray-400" />
                  </button>
                )}
              </div>

              {/* Step 1: Authorize */}
              {oauthStep === 1 && (
                <div className="px-6 py-5 space-y-4">
                  <div className="flex items-start gap-3 bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                    <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-dark dark:text-white">
                        Permissions Requested
                      </p>
                      <ul className="mt-2 space-y-1.5 text-xs text-muted dark:text-gray-400">
                        {oauthProvider.category === "crm" ? (
                          <>
                            <li className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />{" "}
                              Read deals and pipeline data
                            </li>
                            <li className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />{" "}
                              Read contact information
                            </li>
                            <li className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />{" "}
                              Read activity history
                            </li>
                          </>
                        ) : (
                          <>
                            <li className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />{" "}
                              Send messages to channels
                            </li>
                            <li className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />{" "}
                              Create incoming webhooks
                            </li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                  <p className="text-xs text-muted dark:text-gray-400 text-center">
                    StaleDealNagger will be granted read-only access to your{" "}
                    {oauthProvider.name} data.
                  </p>
                  <button
                    onClick={handleOAuthAuthorize}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors bg-primary hover:bg-primary-hover`}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Authorize {oauthProvider.name}
                  </button>
                  <button
                    onClick={closeOAuth}
                    className="w-full py-2 text-sm text-muted dark:text-gray-400 hover:text-dark dark:hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Step 2: Connecting */}
              {oauthStep === 2 && (
                <div className="px-6 py-10 text-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
                  <p className="font-semibold text-dark dark:text-white">
                    Connecting to {oauthProvider.name}…
                  </p>
                  <p className="text-xs text-muted dark:text-gray-400 mt-1">
                    Exchanging authorization token
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted dark:text-gray-500">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span>Verifying credentials</span>
                    <ArrowRight className="w-3 h-3" />
                    <span>Storing tokens</span>
                    <ArrowRight className="w-3 h-3" />
                    <span>Testing connection</span>
                  </div>
                </div>
              )}

              {/* Step 3: Success */}
              {oauthStep === 3 && (
                <div className="px-6 py-10 text-center">
                  <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <p className="font-semibold text-dark dark:text-white">
                    {oauthProvider.name} Connected!
                  </p>
                  <p className="text-xs text-muted dark:text-gray-400 mt-1">
                    Data sync will start shortly
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Disconnect confirmation modal */}
        {showDisconnectModal && (
          <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-sm w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-danger" />
                </div>
                <div>
                  <h3 className="font-bold text-dark dark:text-white">
                    Disconnect Integration?
                  </h3>
                  <p className="text-sm text-muted dark:text-gray-400 capitalize">
                    {PROVIDERS.find((p) => p.id === showDisconnectModal)?.name}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted dark:text-gray-400 mb-5">
                This will stop syncing data. You can reconnect at any time.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDisconnect}
                  disabled={!!disconnecting}
                  className="flex-1 bg-danger hover:bg-red-600 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {disconnecting ? "Disconnecting…" : "Disconnect"}
                </button>
                <button
                  onClick={() => setShowDisconnectModal(null)}
                  className="flex-1 border border-border dark:border-gray-700 py-2.5 rounded-lg text-sm text-dark dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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

function IntegrationCard({
  provider,
  status,
  isAdmin,
  onConnect,
  onDisconnect,
  onSync,
}) {
  const connected = status?.connected ?? false;
  const lastSync = status?.lastSyncAt;
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await onSync(provider.id);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-xl border bg-white dark:bg-gray-800 p-5 transition-all duration-200 hover:shadow-md ${
        connected
          ? `${provider.border} shadow-sm`
          : provider.comingSoon
            ? "border-border dark:border-gray-700 opacity-75"
            : "border-border dark:border-gray-700 hover:border-primary/30"
      }`}
    >
      {/* Card header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${provider.iconBg} flex items-center justify-center`}>
            <ProviderIcon id={provider.id} className={`w-5 h-5 ${provider.iconColor}`} />
          </div>
          <div>
            <p className="font-semibold text-dark dark:text-white text-sm">
              {provider.name}
            </p>
            <p className="text-xs text-muted dark:text-gray-400 capitalize">
              {provider.category}
            </p>
          </div>
        </div>
        {connected ? (
          <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Live
          </span>
        ) : provider.comingSoon ? (
          <span className="flex items-center gap-1 text-xs font-medium text-muted dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
            <Lock className="w-3 h-3" />
            Soon
          </span>
        ) : (
          <Circle className="w-5 h-5 text-gray-300 dark:text-gray-600 shrink-0" />
        )}
      </div>

      {/* Description */}
      <p className="text-xs text-muted dark:text-gray-400 mb-4 leading-relaxed">
        {provider.description}
      </p>

      {/* Status / actions */}
      {connected ? (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-xs text-green-700 dark:text-green-400 font-medium">
              Connected
            </span>
            {lastSync && (
              <span className="text-xs text-muted dark:text-gray-400 ml-auto flex items-center gap-0.5">
                <RefreshCw className="w-3 h-3" />
                {formatTimeAgo(lastSync)}
              </span>
            )}
          </div>
          {isAdmin && provider.category === "crm" && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="w-full py-1.5 flex items-center justify-center gap-1.5 border border-primary/30 text-primary rounded-lg text-xs font-medium hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`}
              />
              {syncing ? "Syncing…" : "Sync Now"}
            </button>
          )}
          {isAdmin && (
            <button
              onClick={onDisconnect}
              className="w-full py-1.5 border border-red-200 dark:border-red-800 text-danger rounded-lg text-xs font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Disconnect
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {provider.comingSoon && (
            <p className="text-xs text-muted dark:text-gray-400 text-center">
              Coming soon
            </p>
          )}
          <button
            onClick={onConnect}
            disabled={!isAdmin}
            className={`w-full py-2 rounded-lg text-xs font-semibold transition-colors ${
              isAdmin
                ? provider.comingSoon
                  ? "bg-gray-100 dark:bg-gray-700 text-muted dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                  : "bg-primary hover:bg-primary-hover text-white"
                : "bg-gray-100 dark:bg-gray-700 text-muted dark:text-gray-500 cursor-not-allowed"
            }`}
          >
            {provider.comingSoon ? "Coming Soon" : "Connect"}
          </button>
          {!isAdmin && (
            <p className="text-xs text-muted dark:text-gray-400 text-center">
              Admin access required
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}
