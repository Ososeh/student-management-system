// Bearer-token gate for private API routes. It verifies the JWT, confirms its
// user still exists in storage, attaches a safe profile, and then calls next().
import jwt from "jsonwebtoken";
import { readDb } from "../utils/db.js";

export async function requireAuth(req, res, next) {
  // Browsers send a token in the Authorization header as "Bearer <token>".
  const authorization = req.headers.authorization || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : null;

  // Stop before the route handler if a protected request has no credentials.
  if (!token) {
    return res.status(401).json({ message: "Authentication required." });
  }

  try {
    // Verification checks the signature and expiry using the server-only secret.
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const db = await readDb();
    const user = db.users.find((item) => item.id === payload.sub);

    // A signed token is not enough if its account was removed after issuance.
    if (!user) {
      return res.status(401).json({ message: "Session is no longer valid." });
    }

    // Routes use this trusted id for every ownership filter and database write.
    // Only safe profile fields are attached; the password hash stays private.
    req.user = { id: user.id, name: user.name, email: user.email };
    return next();
  } catch {
    // Invalid signatures, expired tokens, and verification errors all deny access.
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}
