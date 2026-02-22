import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { dealsAPI } from "../services/api";
import { ArrowLeft, Briefcase, Save } from "lucide-react";

export default function CreateDeal() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    crmDealId: "",
    crmSource: "hubspot",
    name: "",
    stage: "Discovery",
    amount: "",
    currency: "USD",
    contactName: "",
    contactEmail: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const payload = {
        crmDealId: form.crmDealId,
        crmSource: form.crmSource,
        name: form.name,
        stage: form.stage,
      };
      if (form.amount) payload.amount = Number(form.amount);
      if (form.currency) payload.currency = form.currency;
      if (form.contactName) payload.contactName = form.contactName;
      if (form.contactEmail) payload.contactEmail = form.contactEmail;

      const res = await dealsAPI.create(payload);
      navigate(`/deals/${res.data.data.id}`);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Failed to create deal",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        to="/deals"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-dark transition mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to deals
      </Link>

      <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary-light text-primary flex items-center justify-center shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-dark">Create New Deal</h1>
            <p className="text-sm text-muted">
              Add a deal from your CRM to track staleness
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* CRM Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark mb-1">
                CRM Source *
              </label>
              <select
                name="crmSource"
                value={form.crmSource}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-white text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              >
                <option value="hubspot">HubSpot</option>
                <option value="salesforce">Salesforce</option>
                <option value="pipedrive">Pipedrive</option>
                <option value="sheets">Google Sheets</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-1">
                CRM Deal ID *
              </label>
              <input
                type="text"
                name="crmDealId"
                value={form.crmDealId}
                onChange={handleChange}
                required
                placeholder="e.g. HS-12345"
                className="w-full px-3 py-2.5 rounded-lg border border-border text-sm text-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
            </div>
          </div>

          {/* Deal Name */}
          <div>
            <label className="block text-sm font-medium text-dark mb-1">
              Deal Name *
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="e.g. Acme Corp - Enterprise License"
              className="w-full px-3 py-2.5 rounded-lg border border-border text-sm text-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
          </div>

          {/* Stage */}
          <div>
            <label className="block text-sm font-medium text-dark mb-1">
              Pipeline Stage *
            </label>
            <select
              name="stage"
              value={form.stage}
              onChange={handleChange}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-white text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            >
              <option value="Discovery">Discovery</option>
              <option value="Proposal">Proposal</option>
              <option value="Negotiation">Negotiation</option>
              <option value="Closing">Closing</option>
            </select>
          </div>

          {/* Amount + Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark mb-1">
                Deal Amount
              </label>
              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                placeholder="0"
                min="0"
                className="w-full px-3 py-2.5 rounded-lg border border-border text-sm text-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-1">
                Currency
              </label>
              <select
                name="currency"
                value={form.currency}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-white text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
              </select>
            </div>
          </div>

          {/* Contact Info */}
          <div className="border-t border-border pt-5">
            <p className="text-sm font-medium text-muted mb-3">
              Contact Information (Optional)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark mb-1">
                  Contact Name
                </label>
                <input
                  type="text"
                  name="contactName"
                  value={form.contactName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full px-3 py-2.5 rounded-lg border border-border text-sm text-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  value={form.contactEmail}
                  onChange={handleChange}
                  placeholder="john@acme.com"
                  className="w-full px-3 py-2.5 rounded-lg border border-border text-sm text-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3 pt-2">
            <Link
              to="/deals"
              className="flex-1 text-center px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-dark hover:bg-gray-50 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition disabled:opacity-50 shadow-sm"
            >
              <Save className="w-4 h-4" />
              {saving ? "Creating..." : "Create Deal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
