import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/errors";
import { validateRegistration } from "../utils/validation";
import FormField from "../components/FormField";
export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    const n = validateRegistration(values);
    setErrors(n);
    if (Object.keys(n).length) return;
    setBusy(true);
    setServerError("");
    try {
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
