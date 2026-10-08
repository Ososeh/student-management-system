// Account creation: controlled inputs keep React state in sync with typing,
// live password checks guide users, and success signs the new user in.
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/errors";
import { passwordRequirements, validateRegistration } from "../utils/validation";
import FormField from "../components/FormField";
export default function Register() {
  // The provider owns session state; the router handles successful navigation.
  const { register } = useAuth();
  const navigate = useNavigate();
  // Controlled inputs keep the value used for validation and submission in
  // sync with what the user sees in the form.
  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);
  const passwordChecks = Object.entries(passwordRequirements).map(
    // Turn each named rule into a passed/missing display item for the checklist.
    ([key, check]) => ({ key, passed: check(values.password) }),
  );
  const submit = async (e) => {
    e.preventDefault();
    const n = validateRegistration(values);
    // Stop here if the form is invalid; the server independently validates it.
    setErrors(n);
    if (Object.keys(n).length) return;
    setBusy(true);
    setServerError("");
    try {
      // A successful registration also establishes a signed-in session.
      await register(values);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err, "Registration failed."));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <div className="auth-heading">
        <span className="kicker">Get started</span>
        <h2>Create your account</h2>
        <p>Set up your academic workspace in a few steps.</p>
      </div>
      {serverError && (
        <div className="alert alert-error" role="alert">
          {serverError}
        </div>
      )}
      <form onSubmit={submit} noValidate>
        {/* Each reusable field receives its own error from validation state. */}
        <FormField label="Full name" name="name" error={errors.name} required>
          <input
            id="name"
            value={values.name}
            onChange={(e) => setValues({ ...values, name: e.target.value })}
            autoComplete="name"
          />
        </FormField>
        <FormField
          label="Email address"
          name="email"
          error={errors.email}
          required
        >
          <input
            id="email"
            type="email"
            value={values.email}
            onChange={(e) => setValues({ ...values, email: e.target.value })}
            autoComplete="email"
          />
        </FormField>
        <div className="form-grid">
          <FormField
            label="Password"
            name="password"
            error={errors.password}
            required
          >
            <input
              id="password"
              type="password"
              value={values.password}
              onChange={(e) =>
                setValues({ ...values, password: e.target.value })
              }
              autoComplete="new-password"
              aria-describedby="password-requirements"
            />
          </FormField>
          <FormField
            label="Confirm password"
            name="confirmPassword"
            error={errors.confirmPassword}
            required
          >
            <input
              id="confirmPassword"
              type="password"
              value={values.confirmPassword}
              onChange={(e) =>
                setValues({ ...values, confirmPassword: e.target.value })
              }
              autoComplete="new-password"
            />
          </FormField>
        </div>
        <div className="password-requirements" id="password-requirements" aria-live="polite">
          <span className="password-requirements-title">Password must contain:</span>
          <ul>
            {passwordChecks.map(({ key, passed }) => {
              const labels = {
                minLength: "At least 8 characters",
                uppercase: "One uppercase letter",
                number: "One number",
                special: "One special character",
              };
              return (
                <li className={passed ? "requirement-met" : "requirement-missing"} key={key}>
                  <span aria-hidden="true">{passed ? "✓" : "○"}</span>
                  {labels[key]}
                </li>
              );
            })}
          </ul>
        </div>
        <button className="button button-primary button-full" disabled={busy}>
          {busy ? "Creating account..." : "Create account"}
        </button>
      </form>
      <p className="auth-switch">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  );
}
