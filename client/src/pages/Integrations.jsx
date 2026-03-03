import { useState, useEffect } from "react";
import { integrationsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { SkeletonIntegrations } from "../components/Skeleton";
import {
  Plug,
  CheckCircle2,
  Circle,
  RefreshCw,
  X,
  AlertCircle,
} from "lucide-react";

// Provider metadata — logos as colored SVG/emoji, descriptions, categories
const PROVIDERS = [
  {
    id: "hubspot",
    name: "HubSpot",
    category: "crm",
    description: "Sync deals and activities from your HubSpot CRM pipeline.",
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
    logo: "🟠",
    comingSoon: false,
  },
  {
    id: "salesforce",
    name: "Salesforce",
    category: "crm",
    description: "Monitor opportunities in Salesforce Sales Cloud.",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    logo: "☁️",
    comingSoon: true,
  },
  {
    id: "pipedrive",
    name: "Pipedrive",
    category: "crm",
    description: "Pull deals and activity history from Pipedrive.",
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
    logo: "🟢",
    comingSoon: true,
  },
  {
    id: "slack",
    name: "Slack",
    category: "notification",
    description: "Send stale deal nudges directly to reps in Slack.",
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
    logo: "💬",
    comingSoon: false,
  },
  {
    id: "sheets",
    name: "Google Sheets",
    category: "notification",
    description: "Export pipeline reports to a Google Sheet automatically.",
    color: "text-green-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
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

  const handleConnect = (provider) => {
    if (provider.comingSoon) {
      toast.info(`${provider.name} integration coming in Phase 5!`);
      return;
    }
    toast.info(`${provider.name} OAuth setup coming in Phase 5!`);
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

  const connectedCount = PROVIDERS.filter(
    (p) => statusMap[p.id]?.connected,
  ).length;

  if (loading)
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="h-7 w-36 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-52 bg-gray-200 rounded animate-pulse mt-2" />
        </div>
        <SkeletonIntegrations />
      </div>
    );

  const crmProviders = PROVIDERS.filter((p) => p.category === "crm");
  const notifProviders = PROVIDERS.filter((p) => p.category === "notification");

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark">Integrations</h1>
        <p className="text-muted text-sm mt-1">
          {connectedCount} of {PROVIDERS.length} integrations connected
        </p>
      </div>

      {/* CRM section */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">
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
            />
          ))}
        </div>
      </section>

      {/* Notification section */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">
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
            />
          ))}
        </div>
      </section>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-4">
        <div className="flex items-start gap-3">
          <Plug className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Phase 5 — Live Integrations</p>
            <p className="text-xs text-blue-700 mt-0.5">
              Full HubSpot OAuth, Slack bot setup, and deal sync are coming in
              Phase 5. The connect buttons will trigger real OAuth flows then.
            </p>
          </div>
        </div>
      </div>

      {/* Disconnect confirmation modal */}
      {showDisconnectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-danger" />
              </div>
              <div>
                <h3 className="font-bold text-dark">Disconnect Integration?</h3>
                <p className="text-sm text-muted capitalize">
                  {PROVIDERS.find((p) => p.id === showDisconnectModal)?.name}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted mb-5">
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
                className="flex-1 border border-border py-2.5 rounded-lg text-sm text-dark hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function IntegrationCard({
  provider,
  status,
  isAdmin,
  onConnect,
  onDisconnect,
}) {
  const connected = status?.connected ?? false;
  const lastSync = status?.lastSyncAt;

  return (
    <div
      className={`rounded-xl border-2 bg-white p-5 transition-all hover:shadow-sm ${
        connected ? `${provider.border}` : "border-border"
      }`}
    >
      {/* Card header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{provider.logo}</span>
          <div>
            <p className="font-semibold text-dark text-sm">{provider.name}</p>
            <p className="text-xs text-muted capitalize">{provider.category}</p>
          </div>
        </div>
        {connected ? (
          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
        ) : (
          <Circle className="w-5 h-5 text-gray-300 shrink-0" />
        )}
      </div>

      {/* Description */}
      <p className="text-xs text-muted mb-4 leading-relaxed">
        {provider.description}
      </p>

      {/* Status / actions */}
      {connected ? (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-xs text-green-700 font-medium">
              Connected
            </span>
            {lastSync && (
              <span className="text-xs text-muted ml-auto flex items-center gap-0.5">
                <RefreshCw className="w-3 h-3" />
                {formatTimeAgo(lastSync)}
              </span>
            )}
          </div>
          {isAdmin && (
            <button
              onClick={onDisconnect}
              className="w-full py-1.5 border border-red-200 text-danger rounded-lg text-xs font-medium hover:bg-red-50 transition-colors"
            >
              Disconnect
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {provider.comingSoon && (
            <p className="text-xs text-muted text-center">Coming soon</p>
          )}
          <button
            onClick={onConnect}
            disabled={!isAdmin}
            className={`w-full py-2 rounded-lg text-xs font-semibold transition-colors ${
              isAdmin
                ? provider.comingSoon
                  ? "bg-gray-100 text-muted hover:bg-gray-200"
                  : "bg-primary hover:bg-primary-hover text-white"
                : "bg-gray-100 text-muted cursor-not-allowed"
            }`}
          >
            {provider.comingSoon ? "Coming in Phase 5" : "Connect"}
          </button>
          {!isAdmin && (
            <p className="text-xs text-muted text-center">
              Admin access required
            </p>
          )}
        </div>
      )}
    </div>
  );
}
