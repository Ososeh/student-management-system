// This private endpoint stores resumable workspace state separately for each
// authenticated user. It only accepts known fields, so clients cannot replace
// arbitrary database properties through a progress update.
import { Router } from "express";
import { readDb, updateDb } from "../utils/db.js";

const router = Router();
const allowedPaths = [
  /^\/dashboard$/,
  /^\/students$/,
  /^\/students\/new$/,
  /^\/students\/[^/]+(?:\/edit)?$/,
  /^\/courses$/,
  /^\/courses\/new$/,
  /^\/courses\/[^/]+(?:\/edit)?$/,
];
const studentDraftFields = ["name", "email", "courseId", "status", "score"];
const courseDraftFields = ["name", "code", "description"];

function cleanDraft(value, fields) {
  if (value === null) return null;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { error: "A saved form draft must be an object or null." };
  }
  const draft = { values: {} };
  if (value.recordId !== undefined) {
    if (value.recordId !== null && typeof value.recordId !== "string") {
      return { error: "A saved form record id must be a string or null." };
    }
    draft.recordId = value.recordId;
  }
  if (
    value.values !== undefined &&
    (!value.values || typeof value.values !== "object" || Array.isArray(value.values))
  ) {
    return { error: "Saved form values must be an object." };
  }
  for (const field of fields) {
    const fieldValue = value.values?.[field];
    if (typeof fieldValue === "string" || typeof fieldValue === "number") {
      draft.values[field] = fieldValue;
    } else if (fieldValue !== undefined) {
      return { error: `The saved form field "${field}" has an invalid value.` };
    }
  }
  return { draft };
}

function cleanChanges(body) {
  const changes = {};
  if (Object.hasOwn(body, "lastPath")) {
    if (
      typeof body.lastPath !== "string" ||
      !allowedPaths.some((pattern) => pattern.test(body.lastPath))
    ) {
      return { error: "The saved page is not a valid workspace route." };
    }
    changes.lastPath = body.lastPath;
  }
  if (Object.hasOwn(body, "studentSearch")) {
    if (typeof body.studentSearch !== "string" || body.studentSearch.length > 200) {
      return { error: "Student search must be 200 characters or fewer." };
    }
    changes.studentSearch = body.studentSearch;
  }
  if (Object.hasOwn(body, "studentFormDraft")) {
    const result = cleanDraft(body.studentFormDraft, studentDraftFields);
    if (result.error) return { error: result.error };
    changes.studentFormDraft = result.draft;
  }
  if (Object.hasOwn(body, "courseFormDraft")) {
    const result = cleanDraft(body.courseFormDraft, courseDraftFields);
    if (result.error) return { error: result.error };
    changes.courseFormDraft = result.draft;
  }
  return { changes };
}

router.get("/", async (req, res) => {
  const db = await readDb();
  res.json({ progress: db.progress[req.user.id] || {} });
});

router.put("/", async (req, res) => {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({ message: "Progress must be a JSON object." });
  }
  const { changes, error } = cleanChanges(req.body);
  if (error) return res.status(400).json({ message: error });

  const saved = await updateDb((db) => {
    const userProgress = { ...(db.progress[req.user.id] || {}), ...changes };
    for (const key of ["studentFormDraft", "courseFormDraft"]) {
      if (userProgress[key] === null) delete userProgress[key];
    }
    db.progress[req.user.id] = userProgress;
    return userProgress;
  });
  return res.json({ progress: saved });
});

export default router;
