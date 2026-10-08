// Sign-in flow: validate required values, call shared auth logic, and return to
// the requested private page (or dashboard) after successful authentication.
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/errors";
import { emailPattern } from "../utils/validation";
import FormField from "../components/FormField";
export default function Login() {
  // `login` comes from the shared provider, while navigate/location let this
  // page return users to the protected URL that sent them to sign in.
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Keep field values, validation feedback, server feedback, and request
  // progress separate so each can change without affecting the others.
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    // Keep submission inside React instead of allowing a full browser refresh.
    e.preventDefault();
    const n = {};
    // Validate the email format and require a non-empty password before
    // spending a network request; trim only for checking the email.
    if (!emailPattern.test(values.email.trim()))
      n.email = "Enter a valid email address.";
    if (!values.password) n.password = "Password is required.";
    setErrors(n);
    if (Object.keys(n).length) return;
    setBusy(true);
    setServerError("");
    console.log("Login attempt started.");
    try {
      // AuthContext persists the credentials and updates the shared user state.
      const session = await login(values);
      console.log("User login successful.");
      navigate(
        location.state?.from || session.progress.lastPath || "/dashboard",
        { replace: true },
      );
    } catch (err) {
      // Preserve the form and show the API's useful message (or a fallback).
      console.log("Login failed.");
      setServerError(
        getErrorMessage(err, "Login failed. Check your details and try again."),
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <div className="auth-heading">
        <span className="kicker">Welcome back</span>
        <h2>Sign in to your workspace</h2>
        <p>Manage students, courses, and academic records in one place.</p>
      </div>
      {serverError && (
        /* role=alert announces a newly displayed error to assistive technology. */
        <div className="alert alert-error" role="alert">
          {serverError}
        </div>
      )}
      <form onSubmit={submit} noValidate>
        {/* FormField associates the visible label/error with the input below. */}
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
            onChange={(e) => setValues({ ...values, password: e.target.value })}
            autoComplete="current-password"
          />
        </FormField>
        <button className="button button-primary button-full" disabled={busy}>
          {busy ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <p className="auth-switch">
        New here? <Link to="/register">Create an account</Link>
      </p>
    </div>
  );
}
