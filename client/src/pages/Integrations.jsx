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
} from "lucide-react";

// Provider metadata — logos as colored SVG/emoji, descriptions, categories
const PROVIDERS = [
  {
    id: "hubspot",
    name: "HubSpot",
    category: "crm",
    description: "Sync deals and activities from your HubSpot CRM pipeline.",
    color: "text-orange-600",
    bg: "bg-orange-50 dark:bg-orange-900/20",
    border: "border-orange-200 dark:border-orange-800",
    logo: "🟠",
    comingSoon: false,
  },
  {
    id: "salesforce",
    name: "Salesforce",
    category: "crm",
    description: "Monitor opportunities in Salesforce Sales Cloud.",
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-800",
    logo: "☁️",
    comingSoon: true,
  },
  {
    id: "pipedrive",
    name: "Pipedrive",
    category: "crm",
    description: "Pull deals and activity history from Pipedrive.",
    color: "text-green-700",
    bg: "bg-green-50 dark:bg-green-900/20",
    border: "border-green-200 dark:border-green-800",
    logo: "🟢",
    comingSoon: true,
  },
  {
    id: "slack",
    name: "Slack",
    category: "notification",
    description: "Send stale deal nudges directly to reps in Slack.",
    color: "text-purple-700",
    bg: "bg-purple-50 dark:bg-purple-900/20",
    border: "border-purple-200 dark:border-purple-800",
    logo: "💬",
    comingSoon: false,
  },
  {
    id: "sheets",
    name: "Google Sheets",
    category: "notification",
    description: "Export pipeline reports to a Google Sheet automatically.",
    color: "text-green-700",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    border: "border-emerald-200 dark:border-emerald-800",
    logo: "📊",
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
        const redirectUri = `${window.location.origin}/integrations`;
        const res = await integrationsAPI.getAuthUrl(
          oauthProvider.id,
          redirectUri,
        );
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-dark dark:text-white">
            Integrations
          </h1>
          <p className="text-muted dark:text-gray-400 text-sm mt-1">
            {connectedCount} of {PROVIDERS.length} integrations connected
          </p>
        </div>

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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
              {/* Modal header */}
              <div
                className={`px-6 py-4 border-b border-border dark:border-gray-700 flex items-center justify-between ${oauthProvider.bg}`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{oauthProvider.logo}</span>
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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
    <div
      className={`rounded-xl border-2 bg-white dark:bg-gray-800 p-5 transition-all hover:shadow-sm ${
        connected ? `${provider.border}` : "border-border dark:border-gray-700"
      }`}
    >
      {/* Card header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{provider.logo}</span>
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
          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
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
    </div>
  );
}
