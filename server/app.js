// Express application assembly: load environment settings, parse JSON, enable
// browser access, mount health/auth/data routes, and provide final 404/error
// responses. Keeping this separate from server.js makes it testable in memory.
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import studentRoutes from "./routes/students.js";
import courseRoutes from "./routes/courses.js";
import progressRoutes from "./routes/progress.js";
import { requireAuth } from "./middleware/auth.js";

dotenv.config();
// A production server must use a private secret; the fallback is only for
// local development so the app can start without extra setup.
if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET must be configured in production.");
}
if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "development-only-change-me";

const app = express();
// CORS permits the separately hosted Vite client to call this API; JSON parsing
// turns request bodies into objects and limits their accepted size.
app.use(cors());
app.use(express.json({ limit: "100kb" }));
app.get("/api/health", (req, res) =>
  res.json({ status: "ok", service: "student-management-api" }),
);
// Sign-up and login are public; their /me route applies authentication itself.
app.use("/api/auth", authRoutes);
// Every academic and progress endpoint requires a verified account identity.
app.use("/api/students", requireAuth, studentRoutes);
app.use("/api/courses", requireAuth, courseRoutes);
app.use("/api/progress", requireAuth, progressRoutes);
// Return a consistent response for valid HTTP paths that have no API handler.
app.use((req, res) => res.status(404).json({ message: "API route not found." }));
app.use((error, req, res, next) => {
  // Log server details for operators without exposing internals to the client.
  console.error(error);
  res.status(500).json({ message: "Unexpected server error." });
});
export default app;
