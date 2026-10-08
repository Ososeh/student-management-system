# User Persistence Implementation Summary

## Overview

The Student Management System now supports **complete user-specific persistent storage**. When a user creates an account, logs in, uses the application, and later returns, their:

- Account information (name, email, password hash)
- All student records (owned by that account)
- All course records (owned by that account)
- Workspace navigation state (last visited page)
- Search preferences (last student search query)
- Unfinished form drafts (autosaved while editing)

...are **automatically saved to the server** and **restored when they log in again**.

## What Works

### ✅ Account Registration and Login
- User creates account with email and strong password
- Password is bcrypt-hashed and stored securely (never as plain text)
- Login normalizes email and validates password against stored hash
- Token is signed with `JWT_SECRET` and expires after 2 hours

### ✅ Private User Workspaces
- Every course and student record carries an `ownerId` matching the account that created it
- API enforces ownership on every read/write operation
- A user cannot see, edit, or delete another user's records
- Duplicate course codes are checked per-account
- Course deletion blocks if any of that user's students are assigned to it

### ✅ Automatic State Persistence
- **Last page visited** — saved when navigating between protected routes
- **Student search query** — autosaved after 400ms of typing pause
- **Unfinished course form draft** — autosaved with `recordId` (null for new, UUID for edit) and field `values`
- **Unfinished student form draft** — autosaved with same structure

### ✅ Resume on Return
- On page refresh, token is revalidated and user's progress is restored
- On browser close and re-open, token persists in localStorage, progress is fetched
- On login after logout, all saved data is retrieved from server
- Last visited page loads first (unless redirect to a login-required route overrides it)

### ✅ Data Isolation
- One user cannot accidentally discover another user's records
- Cross-account requests return 404 ("not found")
- Attempting to create a student with another user's course returns 400 (validation error)
- Progress endpoints return only the authenticated user's state

### ✅ Transactional Writes
- Database reads and writes are serialized through `updateDb()` to prevent race conditions
- File operations use atomic write-then-rename to prevent corrupted half-written JSON
- Temporary file is deleted on write success, ensuring no orphaned files

### ✅ Automatic Testing
- Server integration tests use an isolated temporary database (`SMS_DB_PATH`)
- Tests verify registration, empty new workspaces, persistence across login, ownership isolation
- Tests validate progress save/restore, form draft structure, and deletion constraints
- **Real production data is never modified by tests**

## Files Modified or Created

### Server-Side Changes

| File | What Changed |
|------|--------------|
| `server/utils/db.js` | Added `updateDb()` for serialized transactions; atomic file writes |
| `server/routes/courses.js` | Enforces `ownerId` on all CRUD; uses `updateDb()` |
| `server/routes/students.js` | Enforces `ownerId` and course ownership; validates courseId matches account |
| `server/routes/progress.js` | Stores and retrieves per-user workspace state; allowlists fields |
| `server/services/authService.js` | Refactored to use `updateDb()` for registration; consistent patterns |
| `server/tests/api.test.js` | 4 comprehensive integration tests; isolated temporary database |

### Client-Side Changes

| File | What Changed |
|------|--------------|
| `client/src/context/AuthContext.jsx` | Loads/saves progress; manages progress queue for debouncing; handles cross-account safety |
| `client/src/services/progressService.js` | GET/PUT wrapper for `/api/progress` |
| `client/src/components/ProgressTracker.jsx` | Invisible component; saves route changes |
| `client/src/pages/Login.jsx` | Navigates to saved `lastPath` on successful login |
| `client/src/pages/students/Students.jsx` | Restores student search; autosaves on change |
| `client/src/pages/students/StudentForm.jsx` | Loads/saves student form draft; merges server values with autosaved fields |
| `client/src/pages/courses/CourseForm.jsx` | Loads/saves course form draft; handles both create and edit |
| `client/src/layouts/DashboardLayout.jsx` | Displays progress save errors in shared alert |
| `client/src/main.jsx` | Mounts `ProgressTracker` alongside `App` |

### Documentation

| File | Content |
|------|---------|
| `docs/PROJECT_STUDY_GUIDE.md` | Complete beginner guide (7000+ words) covering architecture, data model, workflows, file structure, concepts, testing, extension, and glossary |
| `README.md` | Updated to describe persistence, account isolation, JSON storage, and production limitations |
| `PERSISTENCE_IMPLEMENTATION.md` | This file |

## Testing

### Automated Integration Tests

```
npm --prefix server run test
```

Output:
```
✓ Student Management API > serves a health response
✓ Student Management API > registers a user with an empty private workspace and supports later login
✓ Student Management API > isolates academic records and progress between accounts
✓ Student Management API > validates progress updates and course deletion constraints

Test Files  1 passed
Tests       4 passed
```

### Manual Workflow (After `npm run dev`)

1. **Register a new account**
   - Fill in name, email, and strong password
   - Account is created with empty workspace
   - Token is stored in `localStorage` as `sms_token`

2. **Create a course**
   - Navigate to Courses
   - Click "Create course"
   - Fill in name, code, description
   - Save — course is stored with your `ownerId`

3. **Begin a student form**
   - Navigate to Students
   - Click "Add student"
   - Fill in several fields
   - Wait 400ms (or just wait ~1 second)
   - Observe: console shows no error, form draft is autosaved

4. **Refresh the page**
   - Press F5 or `Ctrl+R`
   - Token is revalidated (`/api/auth/me`)
   - Form draft is restored: same page, same fields filled
   - Same course is still selected

5. **Finish and save the student**
   - Complete the form
   - Click save
   - Student record is created
   - Form draft is cleared from the server

6. **Search for the student**
   - Return to Students list
   - Type a search query
   - Wait ~400ms
   - Refresh the page
   - Same query returns, student is still visible

7. **Log out**
   - Click user menu → logout
   - Token and cached profile are cleared from browser
   - User is redirected to login

8. **Log in again**
   - Enter email and password
   - Workspace is restored: last page (Students), search query, saved student
   - All records belong only to you

9. **Try cross-account access (optional, in a second browser/incognito)**
   - Register a different account
   - Try to guess a URL of the first account's student
   - Returns 404 ("not found")
   - Lists show empty workspaces
   - Attempting to assign the first account's course fails validation

## Data Flow Diagram

```
User fills form
         ↓
React state updates
         ↓
400ms debounce timer
         ↓
progressService.update(changes)
         ↓
Axios bearer auth header
         ↓
PUT /api/progress
         ↓
requireAuth middleware validates JWT
         ↓
progress route receives req.user.id
         ↓
updateDb( db → merge changes into db.progress[req.user.id] → write to disk )
         ↓
API responds with saved progress
         ↓
AuthContext merges into React state
         ↓
Next refresh or login retrieves same values from server
```

## Ownership Checks

Every endpoint that touches user data:

1. **Extracts user id from JWT** (via `req.user.id` set by middleware)
2. **Filters collections by owner** (for list endpoints)
3. **Verifies owner on detail/edit/delete** (finds record AND checks ownerId)
4. **Validates related resources** (courseId must belong to same user)
5. **Returns 404 if not found or not owned** (never reveals "exists but not yours")

Example: Creating a student
```javascript
// POST /api/students
const student = {
  id: randomUUID(),
  ownerId: req.user.id,          // ← Set from authenticated request
  name: req.body.name,
  email: req.body.email,
  courseId: req.body.courseId,
  status: req.body.status,
  score: Number(req.body.score),
};

// Validate the course exists AND belongs to this user
const courseExists = db.courses.some(
  (course) =>
    course.id === student.courseId && 
    course.ownerId === req.user.id    // ← Must match
);
if (!courseExists) return 400 "Course not found in your workspace";

db.students.push(student);
```

## Persistence Guarantees and Limitations

### ✅ What is Persisted
- Account profile (name, email, password hash)
- All courses created by the account
- All students assigned to the account's courses
- Last visited protected page
- Student search query
- Partially edited student form
- Partially edited course form

### ⚠️ What is NOT Persisted (By Design)
- Modal/dialog open state (short-lived UI)
- Keyboard focus and scroll position (browser responsibility)
- Unsaved, unsubmitted form validation errors (cleared on return)
- Inline sort/column preferences on tables (out of scope for this capstone)

### ⚠️ Limitations for Production
- **Single-process only** — the serialization queue works within one Node.js process; multiple servers need a real database
- **No backup/recovery** — `db.json` is the only copy; use database snapshots in production
- **No access logs** — no audit trail of who changed what when
- **No token revocation** — JWTs are valid for 2 hours even after logout; use a server-side token blacklist in production
- **No concurrent multi-user updates** — the queue prevents overwrites in a single process, but a database provides ACID guarantees across servers
- **No database migrations** — manually edit `db.json` if schema changes; a real database has schema versioning

## How to Extend Persistence

To add a new piece of resumable state:

1. **Add to the Progress Endpoint Allowlist**
   ```javascript
   // server/routes/progress.js
   if (Object.hasOwn(body, "myNewField")) {
     if (typeof body.myNewField !== "string") {
       return { error: "myNewField must be a string." };
     }
     changes.myNewField = body.myNewField;
   }
   ```

2. **Load on AuthContext Startup**
   ```javascript
   const [myNewField, setMyNewField] = useState(
     () => progress.myNewField || ""
   );
   ```

3. **Autosave When It Changes**
   ```javascript
   useEffect(() => {
     if (!progressReady) return;
     const timer = setTimeout(() => {
       saveProgress({ myNewField }).catch(() => {});
     }, 400);
     return () => clearTimeout(timer);
   }, [progressReady, myNewField, saveProgress]);
   ```

4. **Test Before Exposing**
   - Add a test case in `server/tests/api.test.js` that saves, logs in, and verifies restoration
   - Add cross-account isolation tests
   - Verify invalid input is rejected

## Troubleshooting

| Symptom | Cause | Solution |
|---------|-------|----------|
| "401 Unauthorized" on protected route | Token expired or missing | Sign in again |
| Form doesn't autosave | Server progress endpoint fails | Check server is running and `/api/health` returns 200 |
| Progress shows error alert | Network/server error during save | Retry when server recovers; unsaved values remain in browser state |
| Cannot see courses/students after login | Different account | Verify email; try registering a new account in that browser context |
| Cannot delete a course | Courses with students cannot be deleted | Reassign or delete the students first |
| Data resets on refresh | Browser cleared localStorage | Check browser storage settings and console errors |

## Summary

The persistent-user implementation is **complete, tested, and ready to use**. Users can now:

- ✅ Create accounts and sign in
- ✅ Manage private courses and students
- ✅ Leave the application
- ✅ Return and resume exactly where they stopped
- ✅ Access from different browsers/devices (with same login)
- ✅ Know their data is isolated from other users

The architecture is beginner-friendly yet production-ready for a capstone, with comprehensive tests, clear documentation, and safe defaults.
