# Student Management System — Persistence and Project Study Guide

This beginner-friendly guide explains how the current project works and how
its account-specific persistence lets a person leave and resume a workspace.
It is based on the implementation in this repository.

## 1. Purpose and features

This is a React web application with a separate Node/Express API. A user creates
an account, signs in, and manages a private workspace of courses and student
records. The user can also resume their last workspace page, student search,
and unfinished student/course form after returning.

Main features:

- Account registration/login with bcrypt password hashing and signed JWTs.
- Protected dashboard, student and course pages.
- Create, read, update and delete (CRUD) for courses and students.
- Student-to-course links, search, score/status display, and relationship
  checks that prevent deleting a course which still has students.
- Per-account ownership checks on the API, not just in the browser.
- Server-persisted last route, student search term, and unfinished form drafts.
- Loading, error, empty-state, validation, and delete-confirmation components.
- Responsive React interface, lazy-loaded pages, and automated tests.

There is no task checklist or separate learning-activity feature in the current
product. Its applicable "progress" is the user's academic workspace data and
the saved screen/search/form state described below.

## 2. Architecture in one analogy

Imagine a school office:

- **React in the browser is the front desk.** It displays pages and gathers
  form input.
- **The Express API is the staff-only office.** It validates requests and
  decides which account owns a record.
- **The JSON database is the filing cabinet.** It stores account profiles,
  password hashes, academic records, and saved workspace state between runs.
- **A JWT is a signed visitor badge.** The browser presents it with each
  private request. The server verifies it and obtains the account id from its
  signed `sub` claim; it does not trust an account id supplied by the browser.

```text
HTML page -> React entry -> router -> page and shared auth context
                                      |
                          service -> Axios + bearer JWT
                                      |
                          Express authentication middleware
                                      |
                 user-scoped route -> JSON database on disk
                                      |
                 JSON response -> React state -> visible page
```

The browser owns temporary display state (for example, whether a confirmation
dialog is open). Durable academic data and resumable progress go through the
authenticated API and are saved in `server/data/db.json`.

## 3. What persists, and what does not

| Information | Where it is stored | What brings it back |
|---|---|---|
| Account id, name, normalized email, creation time | `users` array in the server JSON database | Login locates the account by email |
| Password verifier | `passwordHash` in the same user entry; created with bcrypt | Login compares the entered password with bcrypt |
| Authentication token | Browser `localStorage` key `sms_token` | On refresh, `/api/auth/me` validates it |
| Cached display profile | Browser `localStorage` key `sms_user` | Used for initial display, then refreshed from `/me` |
| Courses and students | Server arrays, each record carries `ownerId` | Authenticated collection/detail API requests filter by account id |
| Last protected page | `progress[userId].lastPath` | Login navigates to this route unless a guarded route sent the user to login |
| Student search text | `progress[userId].studentSearch` | Student list uses it to initialize its controlled search field |
| Unfinished student/course form | `progress[userId].studentFormDraft` / `courseFormDraft` | Matching create/edit page restores its `recordId` and saved `values` |
| Dialog-open state, current keyboard focus, scroll position | Not persisted | These are short-lived presentation details, not saved workspace data |

Form drafts save after a short typing pause (400 ms). This keeps the form
responsive and groups nearby keystrokes, but like any browser app, an immediate
power loss before the pending request is sent cannot be guaranteed durable.
Once the API confirms a save, the data remains server-side across refresh,
browser closure, logout, and later login.

## 4. Data model and account separation

The JSON store has four top-level collections:

```json
{
  "users": [{ "id": "account-id", "name": "…", "email": "…", "passwordHash": "…" }],
  "courses": [{ "id": "course-id", "ownerId": "account-id", "name": "…" }],
  "students": [{ "id": "student-id", "ownerId": "account-id", "courseId": "course-id" }],
  "progress": {
    "account-id": {
      "lastPath": "/students",
      "studentSearch": "Sam",
      "studentFormDraft": { "recordId": null, "values": { "name": "Sam" } }
    }
  }
}
```

This is a teaching example; the actual JSON file may contain additional
properties. Student/course objects carry an `ownerId` matching the user that
created them. Student `courseId` links to a course owned by the same account.
Saved progress is keyed by user id, not email or a browser-supplied owner id.
The signed JWT identifies the account, `requireAuth` checks that the user still
exists, and then adds a safe `{ id, name, email }` profile to `req.user`.

Every list filters by `req.user.id`; detail, update, and delete find a matching
record id **and** owner id. Creating a student also verifies that the selected
course belongs to that same user. A record belonging to another account
appears as not found (404), rather than revealing that the record exists.
Duplicate course codes are checked per account, and student counts/deletion
rules are also calculated per account.

New database files start with empty users, courses, students, and progress.
Therefore a newly registered account sees empty lists and can create its own
courses before assigning students. If an existing JSON file contains legacy
records with no `ownerId`, those rows are left in the file but hidden: their
original owner cannot safely be inferred. This avoids exposing old shared
records to an arbitrary newly created account.

## 5. Complete user workflow

### Application start and returning session

1. `client/index.html` provides the `#root` mount point and loads `src/main.jsx`.
2. `main.jsx` mounts React, `BrowserRouter`, `AuthProvider`, and the invisible
   `ProgressTracker`.
3. `AuthProvider` reads the cached profile/token from localStorage. If no token
   exists, the user is considered signed out.
4. If a token exists, the provider requests `/api/auth/me`. The server verifies
   its signature/expiry and checks the account still exists.
5. With a valid account, the provider requests `/api/progress`. The API uses the
   authenticated `req.user.id` to load only that account's saved progress.
6. `ProgressTracker` waits until session/progress loading completes, then saves
   protected route changes. The router renders the matching lazy-loaded page.

### Registration and login

Registration validates the fields in the browser and again on the server.
The server normalizes the email, bcrypt-hashes the password, creates the user
inside a serialized JSON update, and returns a public profile plus signed token.
The profile response intentionally does not include `passwordHash`. The new
account has an empty private workspace and empty progress.

Login normalizes email for lookup and uses `bcrypt.compare`; it never decrypts
the password hash. The API returns a two-hour JWT whose `sub` claim contains
the user's id. The auth service stores the token/profile in localStorage, then
the provider retrieves `/api/progress`. If the user was sent to login from a
protected page, that requested page takes precedence; otherwise the last saved
page is restored, with `/dashboard` as the fallback.

### Using and saving the workspace

- A student/course form is a controlled form: its fields reflect React state.
  After 400 ms without typing, an effect sends the current values to
  `PUT /api/progress`. The server keeps only allowed draft fields and stores
  them under the verified user id.
- Creating or editing a record sends `POST` or `PUT` to its service. The API
  validates, associates the new record with `req.user.id`, and writes it to
  disk. Once saved, the matching unfinished draft is cleared.
- The student list stores its search text in per-user progress. On returning to
  that list, the saved query is used before the records are filtered.
- Every protected route change saves its pathname, allowing login to return to
  the last page (such as a details or edit route).
- Progress updates accept only `lastPath`, `studentSearch`, and the two known
  form drafts; the server does not accept a user id in the body.

### Refresh, close, and logout

Refreshing destroys in-memory React state, but not the JSON database or browser
localStorage. The token is revalidated; then the server sends the saved
account-specific progress and data. Closing and reopening the browser is the
same flow as long as browser storage remains available.

Logout clears this browser's token/profile and React's in-memory user/progress.
It does **not** delete the server account, courses, students, or saved drafts.
The next login verifies the password and retrieves those saved values again.
Tokens are stateless and expire after two hours; because this demo has no
server-side token revocation list, a copied token can technically remain valid
until expiry even after local logout.

## 6. A request traced from screen to disk

When a user creates a course:

1. `CourseForm` stores typed values in React state and runs `validateCourse`.
2. `courseService.create(values)` calls the shared Axios client.
3. The request interceptor reads `sms_token` and sends an
   `Authorization: Bearer <token>` header.
4. Express `requireAuth` verifies the JWT and attaches its user to `req.user`.
5. `routes/courses.js` validates again, checks duplicate code within that user,
   assigns `ownerId: req.user.id`, and calls `updateDb`.
6. `updateDb` serializes the full read/change/write transaction. `writeDb`
   writes a complete temporary JSON file and renames it over the database so
   readers do not see a partially written JSON document.
7. The API responds with the saved course. The page navigates to the list,
   which fetches only that user's courses.

For workspace progress, the request is similar but ends in
`routes/progress.js`: its body is a partial set of allowed values, and the
server merges them into `progress[req.user.id]`. Repeated partial updates
(for example, route then search) preserve earlier keys.

## 7. File guide

### Root

- `README.md` — setup, scripts, persistence behavior, production limitations.
- `package.json` / `package-lock.json` — root scripts and exact npm dependency
  resolution. JSON files cannot contain comments without becoming invalid.
- `.gitignore` — excludes node_modules, build output, local environment values,
  generated logs, and the runtime JSON database.
- `docs/PROJECT_STUDY_GUIDE.md` — editable source for this detailed guide.
- `docs/PROJECT_STUDY_GUIDE.pdf` — portable PDF version.

### Client (`client/src/`)

- `main.jsx` — React bootstrap, browser router, authentication provider, and
  route progress tracker.
- `App.jsx` — route table, lazy page loading, public/private layouts and routes.
- `index.css` — global design, forms, cards, responsive breakpoints.
- `context/AuthContext.jsx` — current user, token validation, progress loading,
  progress saving queue, and logout cleanup.
- `components/ProgressTracker.jsx` — saves authenticated route changes.
- `components/ProtectedRoute.jsx` — waits for session validation, redirects
  unauthenticated visitors, and remembers the requested route.
- `components/FormField.jsx`, `Loader.jsx`, `ErrorState.jsx`, `EmptyState.jsx`,
  `ConfirmModal.jsx`, `StatCard.jsx` — reusable interface pieces.
- `layouts/DashboardLayout.jsx` — navigation/user shell and visible progress
  save errors.
- `pages/AuthLayout.jsx`, `Login.jsx`, `Register.jsx`, `NotFound.jsx` — public
  authentication pages and unmatched URL.
- `pages/Dashboard.jsx` — overview metrics, recent students and quick actions.
- `pages/students/Students.jsx` — user-filtered list/search and delete action.
- `pages/students/StudentForm.jsx` — student create/edit and autosaved draft.
- `pages/students/StudentDetails.jsx` — one student's profile and actions.
- `pages/courses/Courses.jsx` — course list and delete action.
- `pages/courses/CourseForm.jsx` — course create/edit and autosaved draft.
- `pages/courses/CourseDetails.jsx` — one course's detail view.
- `services/api.js` — Axios base URL, bearer token and 401 behavior.
- `services/authService.js` — login/register/profile and auth localStorage.
- `services/studentService.js`, `courseService.js` — resource API wrappers.
- `services/progressService.js` — server-side progress read and partial update.
- `utils/validation.js`, `errors.js` — common form checks and error messages.
- `tests/` — client unit tests, setup, service and route behavior.
- `package.json`, `package-lock.json`, `vite.config.js`, `eslint.config.js`,
  `index.html` — client scripts/dependencies, tooling, and HTML entry.

### Server (`server/`)

- `server.js` — starts the listener on configured port (default 5000).
- `app.js` — configures Express and mounts health, auth, academic, and progress
  endpoints. Auth middleware protects student/course/progress routes.
- `middleware/auth.js` — JWT verification and safe current-user attachment.
- `routes/auth.js` and `services/authService.js` — account validation, password
  hashing, sign-in, public profile, and token creation.
- `routes/students.js` — CRUD with per-account ownership and course validation.
- `routes/courses.js` — CRUD with per-account code uniqueness and relationship
  checks.
- `routes/progress.js` — private GET and partial PUT for resumable UI state;
  allowlists the path and draft shapes.
- `utils/db.js` — database path, empty seed, old schema normalization,
  serialized transactions, and atomic file replacement.
- `tests/api.test.js` — API integration tests using an isolated temporary JSON
  file (not the real `server/data/db.json`).
- `package.json`, `package-lock.json`, `.env.example` — server dependencies,
  scripts, and safe environment-variable template.
- `data/db.json` — generated persistent local data; ignored by Git.

`node_modules/` and `client/dist/` are generated/third-party output. Lockfiles
are generated by npm and JSON manifests cannot be commented safely. Local
`.env` files may contain secrets, so do not commit or reproduce their values.

## 8. Important programming ideas

### React state and context

`useState` stores a value between renders. Typing changes the state, React
renders again, and the field displays the new value. `useEffect` performs work
after a render, such as loading records or scheduling a debounced save.
`AuthContext` is like a shared noticeboard: pages can read the signed-in user
and call `saveProgress` without receiving those values through every parent.

### Debouncing

Debouncing waits until activity pauses before performing work. Instead of
sending one network request for each letter in "Computer Networks", the form
waits 400 ms after the last keystroke and saves once. A later keystroke cancels
the pending timer and starts a new one. This reduces traffic but is not meant
for guaranteed offline editing.

### JWT, bcrypt, and authorization

Bcrypt is a one-way password hashing function; the server compares a login
attempt to the stored hash. A JWT is a signed, expiring identity claim. Signing
prevents a client from changing the user id without invalidating the signature.
Authentication answers "who is this?" Authorization answers "may this user
access this record?" The ownerId filters are authorization checks.

### JSON persistence and transactions

JSON is a text representation of objects and arrays. The server parses the
file into JavaScript values, changes them, serializes them back to text, and
writes them to disk. `updateDb` serializes changes through one in-process queue
so overlapping operations do not both read the same old snapshot and overwrite
each other. This is suitable for a small, single-process demo, not a clustered
production deployment; use a database with real transactions at scale.

### Async requests and errors

`async`/`await` makes asynchronous network/disk actions readable. `try/catch`
handles failures, while `finally` can always clear a loading flag. HTTP status
codes summarize outcomes: 200 success, 201 created, 204 deleted, 400 invalid
input, 401 missing/invalid login, 404 record absent or not owned by this
account, 409 conflict, and 500 unexpected server failure.

## 9. Testing and practical verification

Run:

```text
npm run build
npm test
```

The server tests explicitly set `SMS_DB_PATH` to a temporary file before
loading the app. They test registration, empty new workspaces, course/student
creation, login with normalized email, restoring progress after login, route
validation, course deletion constraints, and attempts by a second account to
read/update/delete another user's records. `afterAll` removes only that test
file. The regular `server/data/db.json` is left alone.

Suggested manual browser check:

1. Register an account with a strong password and create a course.
2. Begin a student form, enter several fields, wait half a second, then refresh.
   Confirm the same form route and unfinished values return.
3. Finish/save the student, search for it, wait, refresh, and confirm both the
   record and query are still present.
4. Log out, sign in again, and confirm the route, query, and records return.
5. Register a second account in another browser context or after logout. Its
   course/student lists should be empty, and attempting a guessed record URL
   should show not found.

Troubleshooting:

- **401/redirect to login:** token expired, was cleared, or is not accepted;
  sign in again.
- **Progress save alert:** progress API is unavailable or rejected the saved
  state. Keep the page open and retry after restoring the server connection.
- **A second account sees empty lists:** this is expected for private,
  empty workspaces; create courses in that account.
- **A legacy record is missing:** old rows without `ownerId` remain stored but
  hidden. Assigning them requires a deliberate administrator/data migration.
- **Cannot delete a course (409):** reassign or remove that account's students
  first.
- **Production startup complains about `JWT_SECRET`:** configure a strong
  server-side secret; never use a `VITE_` variable for it.
- **Data does not survive server replacement/redeploy:** `db.json` is local
  disk storage. Deployments with ephemeral disks need a database or persistent
  mounted storage.

## 10. Extending persistence safely

To add a new user-owned resource: add `ownerId` when creating it, filter all
list reads by `req.user.id`, scope detail/update/delete queries by both id and
owner, validate related ids against the same owner, and add tests with two
accounts. Never accept an owner id from a form as authority.

To save another kind of UI progress, add a field to the progress route's
allowlist and validation, update the progress client/service consumer, restore
it on the relevant page, and cover it with persistence and cross-account tests.
Keep unrelated transient UI (modal visibility, passwords, active focus) out of
server progress.

For real multi-user production hosting, migrate from JSON to a managed
database, add migrations and backups, use HTTPS and a strong secret manager,
consider secure cookie-based sessions/token revocation, and test concurrent
multi-process writes. The JSON store intentionally does not claim those
production guarantees.

## 11. Glossary

| Term | Meaning |
|---|---|
| API | A defined way for programs to request data/actions from one another. |
| Authorization | Checking whether an identified account may do something. |
| Bcrypt | A one-way password hashing algorithm used for safe password storage. |
| Component | A reusable React function that returns part of the screen. |
| Context | A React mechanism for sharing values with descendant components. |
| CRUD | Create, Read, Update, Delete. |
| Debounce | Wait for a pause in repeated input before doing an operation. |
| Endpoint | HTTP method and API path, such as `GET /api/progress`. |
| Express middleware | A function that examines a request before a route handles it. |
| Hook | React function that adds state/effects/context behavior to components. |
| JWT | Signed, expiring token containing identity claims. |
| localStorage | Browser storage that survives page reloads in that browser. |
| Owner id | The account id that owns a record. |
| Promise | A JavaScript value representing work that will finish later. |
| REST | API style using resources, URLs, and HTTP methods. |
| State | Data that changes and causes React to update the displayed interface. |
| Transaction | A grouped data change that should not be interleaved with another. |
| UUID | A practically unique identifier generated for a record. |

## 12. Guided learning path

1. Follow startup from `client/index.html` through `main.jsx` and `App.jsx`.
2. Follow sign-in from `Login.jsx` through `AuthContext`, `authService`,
   `api.js`, Express middleware, and `routes/auth.js`.
3. Follow a course create request through `courseService`, bearer auth,
   `routes/courses.js`, `updateDb`, and the JSON file.
4. Follow a draft save through its form effect, `saveProgress`,
   `progressService`, and `routes/progress.js`.
5. Explain this loop from memory: **type -> React state -> validate -> service
   request -> authenticate -> check owner -> save -> return JSON -> render**.
6. Run the tests, then add a new per-user progress field and test save,
   restore, invalid input, and isolation before exposing it in the UI.
