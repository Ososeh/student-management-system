// Core account operations normalize email, hash passwords, and issue short-lived
// tokens. The response helper deliberately excludes the stored password hash.
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { readDb, updateDb } from "../utils/db.js";

const publicUser = (user) => ({
  // Never return passwordHash to a browser or include it in a JWT response.
  id: user.id,
  name: user.name,
  email: user.email,
});
const tokenFor = (user) =>
  // The subject (`sub`) is the stable user id read later by requireAuth.
  jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: "2h" });

export async function register({ name, email, password }) {
  // Normalize email so case differences cannot create multiple accounts.
  const normalizedEmail = email.trim().toLowerCase();
  // Hash before entering the serialized database transaction to keep the
  // critical section short while still checking duplicate email atomically.
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await updateDb((db) => {
    if (db.users.some((item) => item.email === normalizedEmail)) {
      const error = new Error("An account with this email already exists.");
      error.status = 409;
      throw error;
    }
    const createdUser = {
      // Store the bcrypt hash, never the original password.
      id: randomUUID(),
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    db.users.push(createdUser);
    return createdUser;
  });
  return { user: publicUser(user), token: tokenFor(user) };
}

export async function login({ email, password }) {
  // Find accounts case-insensitively to match registration normalization.
  const db = await readDb();
  const user = db.users.find(
    (item) => item.email === email.trim().toLowerCase(),
  );
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    // Use one message for missing email and wrong password to avoid account
    // enumeration through different error responses.
    const error = new Error("Invalid email or password.");
    error.status = 401;
    throw error;
  }
  return { user: publicUser(user), token: tokenFor(user) };
}
