# Quick Start: Testing User Persistence

This guide walks you through verifying that user persistence works end-to-end.

## Prerequisites

- Node.js 20+ installed
- Project dependencies installed: `npm install`
- No other services running on ports 5000 (API) or 5173 (browser)

## Step 1: Start the Application

```bash
npm run dev
```

Wait for both servers to start:
```
[0] Student Management API listening on http://localhost:5000
[1] ➜  Local:   http://localhost:5173/
```

## Step 2: Register a New Account

1. Open browser to `http://localhost:5173`
2. You'll see the registration page
3. Fill in:
   - **Full name:** `Test User` (any name)
   - **Email:** `test@example.com` (must be unique)
   - **Password:** `TestPass123!` (must meet criteria)
   - **Confirm password:** `TestPass123!`
4. Click **Create account**
5. ✅ You should be redirected to the dashboard

**What happened:**
- Account created and stored in `server/data/db.json`
- Password hashed with bcrypt (never stored as plain text)
- JWT token generated and stored in browser localStorage
- Empty workspace initialized (no courses/students yet)

## Step 3: Create a Course

1. Click **Courses** in the sidebar
2. Click **+ Create course**
3. Fill in:
   - **Course name:** `Web Development 101`
   - **Course code:** `WEB101`
   - **Description:** `Learn building web applications`
4. Click **Create course**
5. ✅ You're back at the courses list, course is visible

**What happened:**
- Course created with `ownerId` set to your account
- Course stored in `server/data/db.json` under your account
- If you log out and back in, this course will still be here

## Step 4: Begin an Unfinished Student Form

1. Click **Students** in the sidebar
2. Click **+ Add student**
3. Fill in:
   - **Full name:** `Alice Smith`
   - **Email:** `alice@university.edu`
   - **Course:** Select `Web Development 101`
   - **Status:** Keep as `Active`
   - **Score:** `85`
4. **Do NOT click save yet**
5. Wait about 1 second
6. ✅ Check browser console — you should see NO error

**What happened:**
- Every ~400ms, the form autosaves to `server/data/db.json`
- The autosave includes: `recordId: null`, `values: { name, email, courseId, status, score }`
- Server stores this under `progress[yourAccountId].studentFormDraft`
- If browser crashes now, your form is saved

## Step 5: Refresh the Page (Test Resume)

1. Press `F5` or `Cmd+R` to refresh
2. Wait for page to load
3. ✅ You should see:
   - Redirected to `/students/new` (last page before refresh)
   - Form still shows `Alice Smith`, `alice@university.edu`, course selected, etc.
   - Same autosaved values restored

**What happened:**
- Token was revalidated with `/api/auth/me`
- Workspace progress was fetched from `/api/progress`
- Student form draft was restored automatically
- You can continue editing without retyping

## Step 6: Save the Student

1. Form still has all values filled in
2. Click **Create student**
3. ✅ Redirected to students list
4. ✅ `Alice Smith` appears in the list

**What happened:**
- Student created with `ownerId` = your account
- Form draft automatically cleared from server progress
- Server now shows the saved student, not a draft

## Step 7: Search and Refresh (Test Search Persistence)

1. Type in the search box: `Alice`
2. ✅ List filters to show only `Alice Smith`
3. Wait ~1 second
4. Refresh the page (`F5`)
5. ✅ You should see:
   - Same search query in the search box
   - Only `Alice Smith` visible
   - Search term was persisted

**What happened:**
- Search query saved to `progress[account].studentSearch`
- On refresh, search restored and used to filter results
- You resume your search session

## Step 8: Log Out

1. Click the user menu (top right, shows your name)
2. Click **Logout**
3. ✅ Redirected to login page
4. ✅ Search box is empty

**What happened:**
- Token removed from browser localStorage
- In-memory React state cleared
- Server-side data remains (courses, students, progress)

## Step 9: Log Back In

1. Email: `test@example.com`
2. Password: `TestPass123!`
3. Click **Sign in**
4. ✅ You should see:
   - Redirected to **Students** page (last page before logout)
   - **Alice Smith** is still in the list
   - Search box shows your previous query (if you didn't clear it)
   - **Web Development 101** course still exists

**What happened:**
- Token revalidated
- Progress restored: `lastPath`, `studentSearch`, form drafts
- All courses and students fetched (filtered by your `ownerId`)
- You're back exactly where you left off

## Step 10: Test Cross-Account Isolation (Optional)

To verify data isolation:

1. **In a new incognito/private browser window:**
   - Go to `http://localhost:5173`
   - Register a different account: `user2@example.com`
   - Click **Students**
   - ✅ List should be **empty**
   - ✅ `Alice Smith` is NOT visible (belongs to first account)

2. **Try direct URL access:**
   - Try to guess the student URL in address bar
   - ✅ Should see "Not Found" (404)
   - **Not** a forbidden error — the application hides whether the record exists

**What happened:**
- Second account has an empty, private workspace
- All API endpoints filter by `req.user.id`
- You cannot see, edit, or delete another account's records

## Summary of What Was Persisted

| Data | Before Refresh | After Refresh | After Logout/Login |
|------|---|---|---|
| Account info | ✅ | ✅ | ✅ |
| Courses | ✅ | ✅ | ✅ |
| Students | ✅ | ✅ | ✅ |
| Last page (`/students`) | ✅ | ✅ | ✅ |
| Search query (`Alice`) | ✅ | ✅ | ✅ |
| Unfinished form draft | ✅ | ✅ | ✅ (restored to form) |

## Automated Tests

To run the full test suite (including server persistence/isolation tests):

```bash
npm test
```

Or just server tests:

```bash
npm --prefix server run test
```

Expected output:
```
✓ Student Management API > serves a health response
✓ Student Management API > registers a user with an empty private workspace and supports later login
✓ Student Management API > isolates academic records and progress between accounts
✓ Student Management API > validates progress updates and course deletion constraints

Test Files  1 passed
Tests       4 passed
```

## Production Deployment Note

This implementation uses a JSON file (`server/data/db.json`) for local development/demo. For real production:

1. **Use a database** (PostgreSQL, MongoDB, etc.) instead of JSON
2. **Secure the server** (HTTPS, stronger JWT secret in environment variables)
3. **Add access logs** (who accessed what, when)
4. **Implement token revocation** (server-side blacklist or shorter expiry)
5. **Backup data** (regular database snapshots)
6. **Test at scale** (multiple servers, concurrent users)

The current implementation is suitable for learning and capstone projects.

## Troubleshooting

**"Network Error" when registering or logging in**
- Make sure both servers started (check terminal output)
- Make sure you're at `http://localhost:5173` (not port 5000)
- Check network tab in browser DevTools for actual error

**Form doesn't autosave**
- Open browser console (`F12`)
- Look for error messages
- Confirm `/api/health` returns 200 (make a request in DevTools)

**Search doesn't persist after refresh**
- Confirm no console errors
- Try waiting a full second after typing before refreshing
- Check `db.json` has `progress[accountId].studentSearch` field

**Can't log in after logout**
- Confirm email matches exactly (case-insensitive, but must be complete)
- Confirm password is correct
- Try registering a new test account

**Another account can see my data**
- This shouldn't happen with the persistence implementation
- If it does, open an issue with steps to reproduce
- Check `ownerId` in `db.json` for your records

## Next Steps

- Read `PERSISTENCE_IMPLEMENTATION.md` for architecture details
- Read `docs/PROJECT_STUDY_GUIDE.md` for comprehensive project walkthrough
- Explore the code: `client/src/context/AuthContext.jsx` is the persistence hub
- Try adding a new resumable progress field following the extension guide
