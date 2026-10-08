# Student Management System — React Capstone

A React capstone for managing a private student/course workspace. It provides account registration and sign-in, protected routes, student/course CRUD, search, resumable workspace state, validation, loading/empty/error states, responsive UI, automated tests, and a separate REST API.

For a beginner-oriented walkthrough of the architecture, workflows, files, API, state, and troubleshooting, see the [Project Study Guide](./docs/PROJECT_STUDY_GUIDE.md) or its [PDF version](./docs/PROJECT_STUDY_GUIDE.pdf).

## Stack
- React + Vite
- React Router
- Axios
- Context API
- Node.js + Express REST API
- JWT authentication
- bcryptjs password hashing
- Vitest + React Testing Library

## Local setup

1. Install Node.js 20+.
2. From the project root run `npm install` (this also installs the client and server dependencies).
3. Run `npm run dev`.
4. Open the client URL shown by Vite, normally `http://localhost:5173`.
5. The API normally runs at `http://localhost:5000`.

The server creates `server/data/db.json` on first start. New accounts begin with an empty, private workspace; courses and students created later are associated with the account that created them. Passwords are bcrypt-hashed and are never stored as plain text.

Account data and workspace progress are stored by the server in this JSON file, not only in browser memory. The API associates each record and saved progress entry with the authenticated user's id. The client saves the last workspace page, student search text, and unfinished student/course form drafts. These are restored after a refresh or a later login. Logging out removes the browser's saved token/profile and in-memory progress, but does not delete the server-side account or workspace.

Older databases may contain sample or academic records without an account owner. Those legacy records are kept in the file but are not exposed to any account because their original owner cannot be determined safely. New accounts do not inherit them.

## Environment variables

Client: set `VITE_API_URL` in `client/.env` if the API is not on the default local URL. (This repository does not currently include a tracked `client/.env.example`.)

Server: copy `server/.env.example` to `server/.env` and set a strong `JWT_SECRET` in a real environment. Never expose the server secret through a `VITE_*` variable.

## Tests

`npm test` runs both client and server tests. Server integration tests use a temporary JSON file through `SMS_DB_PATH`, so they do not delete or modify `server/data/db.json`.

## Production note

The included JSON file store is intentionally small and self-contained for the capstone's development/demo environment. It supports separate users in a single server process, but it is not a substitute for a transactional database or a distributed multi-server deployment. For production, use a managed database such as PostgreSQL and keep JWT secrets server-side. The current JWTs expire after two hours; logout removes the token from this browser, but a copied token remains valid until it expires because the API does not keep a server-side token revocation list.
