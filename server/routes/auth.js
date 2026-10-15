// Public registration/login endpoints plus a protected profile endpoint.
// Route handlers check request fields; authService owns hashing and persistence.
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { login, register } from "../services/authService.js";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    // Read only fields needed to create an account from the submitted JSON body.
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required." });
    }

    // Enforce the same baseline requirements on the server, since browser-side
    // checks can be bypassed by a direct API request.
    if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)
    ) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and include an uppercase letter, a number, and a special character.",
      });
    }

    // Successful registration persists the account and returns a token/profile.
    return res.status(201).json(await register({ name, email, password }));
  } catch (error) {
    // Service errors carry statuses such as 409 for an existing email.
    return res
      .status(error.status || 500)
      .json({ message: error.message || "Registration failed." });
  }
});

router.post("/login", async (req, res) => {
  try {
    // Both fields are required before the service performs password comparison.
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    // Auth service verifies the password and issues a signed session token.
    return res.json(await login({ email, password }));
  } catch (error) {
    // Invalid credentials use the service's 401 response.
    return res
      .status(error.status || 500)
      .json({ message: error.message || "Login failed." });
  }
});

// Middleware verifies the token, then this endpoint returns its trusted profile.
router.get("/me", requireAuth, (req, res) => res.json({ user: req.user }));

export default router;
