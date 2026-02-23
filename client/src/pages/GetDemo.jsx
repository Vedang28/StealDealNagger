import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Send, CheckCircle, Sparkles } from "lucide-react";

const ROLE_OPTIONS = [
  "Rev Ops / Sales Ops",
  "Sales",
  "Marketing",
  "Agency / Consultant",
  "Other",
];

export default function GetDemo() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "",
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.firstName.trim())
      errs.firstName = "Please enter your first name.";
    if (!form.lastName.trim()) errs.lastName = "Please enter your last name.";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Please enter a valid business email.";
    if (!form.phone.trim() || !/^[\d\s\-+()]{7,20}$/.test(form.phone))
      errs.phone = "Please enter a valid phone number.";
    if (!form.role) errs.role = "Please select an option.";
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      setSubmitted(true);
    }
  };

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  if (submitted) {
    return (
      <div className="demo-page">
        <div className="demo-wrapper">
          <div className="demo-card demo-card-success">
            <div className="demo-success">
              <div className="demo-success-icon-wrap">
                <CheckCircle size={36} />
              </div>
              <h2>You&rsquo;re all set!</h2>
              <p>
                Our sales team will reach out within 24 hours to schedule your
                personalized demo of Stale Deal Nagger.
              </p>
              <Link to="/" className="demo-btn demo-btn-primary">
                <ArrowLeft size={16} />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="demo-page">
      {/* Decorative background accents */}
      <div className="demo-bg-accent demo-bg-accent-1" />
      <div className="demo-bg-accent demo-bg-accent-2" />

      <div className="demo-wrapper">
        {/* Back link — outside the card, on the dark background */}
        <Link to="/" className="demo-back">
          <ArrowLeft size={15} />
          Back to home
        </Link>

        <div className="demo-card">
          {/* Header */}
          <div className="demo-header">
            <div className="demo-logo">
              <span className="demo-logo-icon">
                <Sparkles size={18} />
              </span>
              <span>Stale Deal Nagger</span>
            </div>
            <h1>See Stale Deal Nagger in Action</h1>
            <p>
              Curious to discover how Stale Deal Nagger can help you?
              <br />
              Get in touch with our Sales Team to learn more.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="demo-form" noValidate>
            <div className="demo-row">
              <div className="demo-field">
                <label>
                  First name <span className="demo-req">*</span>
                </label>
                <input
                  type="text"
                  placeholder="John"
                  value={form.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                  className={errors.firstName ? "demo-input-error" : ""}
                />
                {errors.firstName && (
                  <span className="demo-error">{errors.firstName}</span>
                )}
              </div>

              <div className="demo-field">
                <label>
                  Last name <span className="demo-req">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Doe"
                  value={form.lastName}
                  onChange={(e) => update("lastName", e.target.value)}
                  className={errors.lastName ? "demo-input-error" : ""}
                />
                {errors.lastName && (
                  <span className="demo-error">{errors.lastName}</span>
                )}
              </div>
            </div>

            <div className="demo-field">
              <label>
                Business email <span className="demo-req">*</span>
              </label>
              <input
                type="email"
                placeholder="john@company.com"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className={errors.email ? "demo-input-error" : ""}
              />
              {errors.email && (
                <span className="demo-error">{errors.email}</span>
              )}
            </div>

            <div className="demo-field">
              <label>
                Phone <span className="demo-req">*</span>
              </label>
              <input
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                className={errors.phone ? "demo-input-error" : ""}
              />
              {errors.phone && (
                <span className="demo-error">{errors.phone}</span>
              )}
            </div>

            <div className="demo-field">
              <label>
                Which best describes you? <span className="demo-req">*</span>
              </label>
              <select
                value={form.role}
                onChange={(e) => update("role", e.target.value)}
                className={errors.role ? "demo-input-error" : ""}
              >
                <option value="" disabled>
                  — Select one —
                </option>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              {errors.role && <span className="demo-error">{errors.role}</span>}
            </div>

            <button type="submit" className="demo-btn demo-btn-primary">
              <Send size={16} />
              Request Demo
            </button>

            <p className="demo-disclaimer">
              By submitting, you agree to our terms and privacy policy.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
