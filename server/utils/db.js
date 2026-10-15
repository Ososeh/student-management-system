// Keep persistent records in a small JSON database for this capstone. The
// production path is relative to this module; tests may point at a temporary
// file so they never erase a developer's real local records.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const defaultDbPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../data/db.json",
);
export const dbPath = process.env.SMS_DB_PATH
  ? path.resolve(process.env.SMS_DB_PATH)
  : defaultDbPath;

// New accounts receive empty private workspaces. Existing legacy records
// without an owner are intentionally retained in the file but are not shown
// to any account, because their original owner cannot be identified safely.
const seed = { users: [], courses: [], students: [], progress: {} };
let writeQueue = Promise.resolve();
let updateQueue = Promise.resolve();

export async function readDb() {
  try {
    // Parse a complete JSON document from persistent storage.
    const db = JSON.parse(await fs.readFile(dbPath, "utf8"));
    // Add the progress collection when reading a database from an older app
    // version. Existing users and academic records remain untouched.
    if (!db.progress) db.progress = {};
    return db;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    await writeDb(seed);
    return structuredClone(seed);
  }
}

export function writeDb(db) {
  // Serialize writes so overlapping requests do not overwrite each other's
  // file writes. The queue is recovered after an I/O failure so later saves
  // can still be attempted. Rename a fully written temporary file over the
  // database so readers never see half of a JSON document.
  const write = writeQueue.then(async () => {
    // Ensure the data directory exists, including on a clean first launch.
    await fs.mkdir(path.dirname(dbPath), { recursive: true });
    const temporaryPath = `${dbPath}.${process.pid}.tmp`;
    await fs.writeFile(temporaryPath, JSON.stringify(db, null, 2));
    // Rename on the same filesystem atomically replaces the old snapshot.
    await fs.rename(temporaryPath, dbPath);
  });
  writeQueue = write.catch(() => {});
  return write;
}

// Run a full read-change-write operation in sequence. Serializing the whole
// transaction (not just the final file write) prevents simultaneous accounts
// from overwriting one another's newly saved data.
export function updateDb(change) {
  // Queue the full read/edit/write unit so concurrent API requests cannot
  // start from the same old snapshot and overwrite each other's changes.
  const update = updateQueue.then(async () => {
    const db = await readDb();
    const result = await change(db);
    await writeDb(db);
    return result;
  });
  updateQueue = update.catch(() => {});
  return update;
}
