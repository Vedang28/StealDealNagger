import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Bell, Eye, EyeOff } from "lucide-react";

export default function Register() {
  const [form, setForm] = useState({
    teamName: "",
    name: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const { register, loading, error, setError } = useAuth();
  const navigate = useNavigate();

  const update = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await register(form);
    if (success) navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-dark text-white flex-col justify-between p-12">
        <div className="flex items-center gap-2 text-lg font-bold">
          <Bell className="w-5 h-5 text-primary" />
          Stale Deal Nagger
        </div>
        <div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Stop Deals from <span className="text-primary">Going Cold.</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-md">
            Set up your team in under a minute. Start monitoring your pipeline
            today.
          </p>
          <div className="mt-8 space-y-3">
            {[
              "Auto-detect stale deals",
              "Slack & email nudges",
              "Pipeline analytics",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-gray-300">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
                {item}
              </div>
            ))}
          </div>
        </div>
        <p className="text-gray-500 text-sm">
          &copy; 2026 Stale Deal Nagger. Powered by MaxLeads
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 text-lg font-bold mb-8">
            <Bell className="w-5 h-5 text-primary" />
            Stale Deal Nagger
          </div>

          <h2 className="text-2xl font-bold text-dark mb-1">
            Create your account
          </h2>
          <p className="text-muted mb-8">Get started with a free trial</p>

          {error && (
            <div className="bg-danger-light border border-danger/20 text-danger px-4 py-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">
                Team Name
              </label>
              <input
                type="text"
                value={form.teamName}
                onChange={update("teamName")}
                placeholder="Acme Sales Team"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-white text-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">
                Your Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={update("name")}
                placeholder="John Doe"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-white text-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={update("email")}
                placeholder="john@acme.com"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-white text-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={update("password")}
                  placeholder="Min 8 characters"
                  required
                  minLength={8}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-white text-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-dark"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover text-white py-2.5 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary font-semibold hover:text-primary-hover"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
