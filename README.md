# Student Management System — React Capstone

A production-style React capstone based on Module 14. The application provides authentication, protected routes, a dashboard, student CRUD, course CRUD, search, validation, loading/empty/error states, responsive UI, automated tests, and a separate REST API.

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

The server creates `server/data/db.json` on first start and seeds sample courses and students. Passwords are hashed and are never stored as plain text.

## Environment variables

Client: copy `client/.env.example` to `client/.env` and set `VITE_API_URL` if the API is not on the default local URL.

Server: copy `server/.env.example` to `server/.env` and set a strong `JWT_SECRET` in a real environment. Never expose the server secret through a `VITE_*` variable.

## Tests

`npm test` runs both client and server tests. The project includes tests for authentication UI, protected routing, student form validation, service requests, and server authentication/CRUD behavior.

## Production note

The included JSON file store is intentionally small and self-contained for the capstone's development/demo environment. For a real multi-user production deployment, replace `server/data/db.json` with a managed database such as PostgreSQL/Supabase and keep JWT secrets server-side.
