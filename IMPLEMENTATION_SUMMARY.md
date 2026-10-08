# Implementation Complete: User-Specific Persistence

## Executive Summary

The Student Management System now supports **complete user-specific persistent data storage**. Users can:

1. ✅ Create accounts and log in securely
2. ✅ Manage private courses and student records
3. ✅ Have their workspace state saved automatically
4. ✅ Log out or close the browser
5. ✅ Return later and resume exactly where they left off
6. ✅ Know their data is completely isolated from other users

**All data persists on the server**, not just in browser memory. The implementation includes 4 automated integration tests confirming account isolation, persistence, and data integrity.

---

## What Changed

### Core Persistence Features Added

#### 1. Server-Side Account Ownership
- Every course and student record carries an `ownerId` field
- API enforces ownership on all CRUD operations (list, read, create, update, delete)
- Users can only access their own records; others return 404
- Related records are validated against the same owner (course must belong to user before assigning student)

#### 2. Workspace Progress Tracking
The server now stores per-user progress under `/api/progress`:
- **Last visited page** — restored on login or refresh
- **Student search query** — restored in the student list
- **Student form draft** — autosaved while typing; restored on return to form
- **Course form draft** — autosaved while typing; restored on return to form

#### 3. Transactional Database Updates
- New `updateDb(change)` function serializes all read-change-write operations
- Prevents race conditions where two concurrent requests both read the old state
- Atomic file writes using temporary file + rename pattern
- If write fails, the request fails; next operation tries again

#### 4. Authentication & Token Management
- Passwords are bcrypt-hashed (one-way, salted, never stored as plain text)
- JWTs signed with `JWT_SECRET`; tokens expire after 2 hours
- Every API request verifies the token and extracts the user id safely
- Cross-account access returns 404 (no data leakage)

---

## Files Changed

### Backend (Server)

**`server/utils/db.js`**
- Added `updateDb(change)` for serialized transactions
- Atomic write: create temp file, verify write, rename over original
- Prevents corrupted half-written JSON

**`server/routes/students.js`**
- Uses `updateDb()` for all CRUD operations
- Filters list by `req.user.id`
- Verifies student owner and course owner match on detail/edit/delete
- Validates course exists and is owned by the account

**`server/routes/courses.js`**
- Uses `updateDb()` for all CRUD operations
- Filters list by `req.user.id`
- Checks duplicate codes per-account
- Counts student assignments per-account before allowing deletion

**`server/routes/progress.js`**
- Allowlists only known fields: `lastPath`, `studentSearch`, `studentFormDraft`, `courseFormDraft`
- Validates field types and shapes (e.g., draft `recordId` must be string/null, `values` object contains only form fields)
- Stores progress keyed by `req.user.id`
- Uses `updateDb()` for atomic saves

**`server/services/authService.js`**
- Refactored registration to use `updateDb()` for duplicate-email check + user creation atomicity
- Bcrypt password hashing happens outside the transaction to keep it short

**`server/tests/api.test.js`**
- 4 comprehensive integration tests
- Uses isolated temporary database (set via `SMS_DB_PATH` environment variable)
- Real `server/data/db.json` is never modified by tests
- Tests cover: registration, empty workspace, persistence across login, cross-account isolation, deletion constraints

### Frontend (Client)

**`client/src/context/AuthContext.jsx`**
- Loads user and progress after token validation
- Manages progress queue for debouncing concurrent saves
- Tracks active user id to prevent progress saves crossing accounts
- `saveProgress()` function handles retries and error reporting
- Clears all state on logout

**`client/src/services/progressService.js`** (new)
- `get()` and `update()` wrappers for `/api/progress`
- Simple service; all validation happens on server

**`client/src/components/ProgressTracker.jsx`** (new)
- Invisible component mounted at app root
- Watches route changes and saves `lastPath` after 400ms debounce
- Runs only when authenticated and progress is ready

**`client/src/pages/Login.jsx`**
- On successful login, navigates to saved `lastPath` if available
- Falls back to `/dashboard` if no saved path

**`client/src/pages/students/Students.jsx`**
- Initializes search query from saved progress
- Autosaves search query to progress endpoint after 400ms typing pause

**`client/src/pages/students/StudentForm.jsx`** (rewritten)
- Loads server values (on edit) and merges with saved draft
- Saves form draft after every keystroke (debounced 400ms)
- Draft includes `recordId` (null for create, UUID for edit) and form field `values`
- On successful save, draft is cleared

**`client/src/pages/courses/CourseForm.jsx`** (rewritten)
- Same pattern as StudentForm: load-merge-autosave-clear
- Autosaves course form draft per-user per-account

**`client/src/layouts/DashboardLayout.jsx`**
- Displays shared progress error alert if workspace save fails

**`client/src/main.jsx`**
- Mounts `ProgressTracker` component

---

## Testing

### Automated Tests (4 pass)

Run with:
```bash
npm --prefix server run test
```

Tests verify:
1. ✅ Registration creates account with empty workspace
2. ✅ Login persists courses, students, and progress across session
3. ✅ Second account cannot see first account's data
4. ✅ Cross-account course/student access returns 404
5. ✅ Course deletion blocked if students assigned
6. ✅ Form draft validation (shape, types)

### Manual Verification

Follow `TESTING_GUIDE.md` for step-by-step end-to-end browser testing:
- Register, create courses, begin form
- Refresh page → form restored
- Log out/in → data and search restored
- Second account → empty workspace, isolation confirmed

---

## Data Model

```json
{
  "users": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "passwordHash": "bcrypt_hash",
      "createdAt": "2026-10-08T..."
    }
  ],
  "courses": [
    {
      "id": "uuid",
      "ownerId": "user_id",
      "name": "Web Development",
      "code": "WEB101",
      "description": "...",
      "createdAt": "2026-10-08T..."
    }
  ],
  "students": [
    {
      "id": "uuid",
      "ownerId": "user_id",
      "name": "Alice Smith",
      "email": "alice@university.edu",
      "courseId": "course_id",
      "status": "Active",
      "score": 85,
      "createdAt": "2026-10-08T..."
    }
  ],
  "progress": {
    "user_id": {
      "lastPath": "/students",
      "studentSearch": "Alice",
      "studentFormDraft": {
        "recordId": null,
        "values": { "name": "Unfinished", ... }
      }
    }
  }
}
```

---

## Security & Privacy

### ✅ Implemented
- Passwords bcrypt-hashed (one-way, salted)
- JWTs signed (cannot be forged)
- All API requests validated for ownership
- User id extracted from token, not from request body
- Cross-account access returns 404 (no data leakage)
- Form validation on both client and server
- Timestamps and audit fields ready for logging

### ⚠️ Known Limitations (Intentional for Capstone)
- JWTs valid for 2 hours after logout (no server-side revocation)
- No encryption at rest (JSON file is plain text)
- No access logs (suitable for learning project)
- Single-process only (use database for multi-server deployments)
- No backup/recovery beyond file copy (suitable for development)

### 🔒 Production Ready?
Not yet — this implementation is excellent for learning and capstone projects. For real production:
- Use a real database (PostgreSQL, etc.) instead of JSON
- Implement server-side token revocation
- Use HTTPS for all communication
- Add comprehensive access logging
- Set up database backups and recovery
- Test with multiple concurrent users

---

## Performance Notes

- Form autosaves debounced to 400ms (balances responsiveness with network load)
- Progress saves serialized (one at a time) to prevent overwrites
- Course/student lists filtered by `ownerId` (fast in-memory filter for small datasets)
- Database writes use atomic file replacement (prevents readers seeing half-written JSON)

For thousands of users, migrate to a real database. The JSON approach is intentional for capstone/learning.

---

## Documentation Provided

1. **`PERSISTENCE_IMPLEMENTATION.md`** (this file)
   - Overview, testing, architecture, limitations, troubleshooting

2. **`TESTING_GUIDE.md`** (step-by-step browser test)
   - Manual verification walkthrough for each persistence feature

3. **`docs/PROJECT_STUDY_GUIDE.md`** (comprehensive guide)
   - Complete project architecture, code walkthrough, learning path
   - Explains every major component and how persistence integrates

4. **`README.md`** (updated)
   - Quick setup, stack, environment, persistence overview, production note

---

## How to Use

### For Development/Learning

```bash
# Install
npm install

# Run
npm run dev

# Test
npm test
```

Then follow `TESTING_GUIDE.md` for manual verification.

### For Capstone Submission

Include:
- Source code (all changes listed above)
- This document (`PERSISTENCE_IMPLEMENTATION.md`)
- `TESTING_GUIDE.md` for reproducible manual testing
- `docs/PROJECT_STUDY_GUIDE.md` for detailed explanation
- Test results from `npm test`

### Explaining to Evaluators

**"This project implements persistent user accounts and workspace state."**

Key points:
- Each user has a private workspace (courses, students)
- Workspace state is saved to the server and survives session loss
- On return, user resumes at the last page with saved search/form state
- All data is isolated per-account; users cannot access each other's records
- Implementation is tested with 4 automated integration tests
- Comprehensive documentation explains architecture and how data flows

---

## Checklist for Completion

- [x] Account registration with bcrypt password hashing
- [x] Account login with JWT token generation
- [x] Per-account course ownership enforcement
- [x] Per-account student ownership enforcement
- [x] Course/student CRUD filtered by owner
- [x] Workspace progress tracking (page, search, drafts)
- [x] Form autosave with debouncing
- [x] Progress restoration on page refresh
- [x] Progress restoration on login
- [x] Cross-account data isolation
- [x] Transactional database updates
- [x] Automated integration tests (4 pass)
- [x] Manual testing guide
- [x] Comprehensive documentation
- [x] Production build succeeds
- [x] No console errors in normal workflow

---

## Questions or Issues?

1. **The persistence feature doesn't work:**
   - Check browser console for errors (`F12`)
   - Verify API is running (`npm run dev:server` or `npm --prefix server start`)
   - Verify `/api/health` returns 200
   - Check `server/data/db.json` exists and is valid JSON

2. **How do I add a new resumable state field?**
   - See `docs/PROJECT_STUDY_GUIDE.md` section 10 "Extending Persistence Safely"
   - Add to allowlist in `server/routes/progress.js`
   - Load/save in `AuthContext.jsx`
   - Add test case in `server/tests/api.test.js`

3. **Can I migrate to a real database later?**
   - Yes. Replace `db.js` with database queries
   - Keep the same API routes and request/response shapes
   - Update tests to use test database instead of temp JSON file

---

## Summary

User-specific persistence is **complete and tested**. Users can now register, work with their data, leave the application, and return to find everything exactly as they left it. The implementation is secure, well-documented, and ready for capstone evaluation or as a foundation for a real application.
