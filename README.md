<h1 align="center">Anvil — API Workbench</h1>

<p align="center">
  An original, Postman-inspired API workbench for composing, organizing, sending, and analyzing HTTP requests.
</p>

## Built With

- [React 19](https://react.dev/) and [Vite 8](https://vite.dev/) for the frontend
- [Bun](https://bun.sh/) for workspace installation and JavaScript execution
- [Express 5](https://expressjs.com/) for the HTTP API
- [MongoDB](https://www.mongodb.com/) and [Mongoose](https://mongoosejs.com/) for persistence
- [Zod](https://zod.dev/) for request validation
- [JSON Web Tokens](https://jwt.io/) and [bcrypt](https://github.com/dcodeIO/bcrypt.js) for authentication

## What You Can Do

- **Build and send requests.** Compose method, URL, query params, headers, and body (none/JSON/text/form), then send them through the app's own backend (no browser CORS issues) and inspect the live response.
- **Organize collections.** Save requests into named collections and folders; rename, reorder (drag and drop), duplicate, and delete them.
- **Manage environments.** Define named environments with `{{variable}}` placeholders, switch the active one, and have it resolved at send time.
- **Attach authentication.** Bearer token, Basic auth, or an API key (header or query) at the request level or inherited from the parent collection.
- **Analyze responses.** Status, timing, size, headers, and a formatted body viewer with collapsible JSON nodes and in-body search.
- **Track history.** Every send is recorded with its response; reopen, resend, or save any past request into a collection.
- **Generate code snippets.** Turn the current request into a curl command, a JavaScript `fetch` call, or a Python `requests` call.

## Project Structure

```text
.
├── backend/                     # Express API, business logic, and MongoDB persistence
│   └── src/
│       ├── features/            # Product domains and API flows (auth, environments, collections, history, execution, snippets, sandbox)
│       ├── scripts/              # Deterministic seed data
│       └── shared/               # Configuration, authentication, and utilities
├── frontend/
│   ├── src/features/             # Product views and interactions
│   ├── src/shared/                # API client, reusable controls, and utilities
│   └── public/                    # Local static media
├── transcripts/                  # Exported AI transcripts for this submission
├── skills/validate/               # Submission verifier used before handover
├── .vscode/launch.json           # Backend debugger configuration
├── hackerrank.yml                # HackerRank install and run configuration
└── setup.sh                      # MongoDB readiness and seed reset
```

## Prerequisites

- Bun 1.3 or later
- MongoDB 8.0 or later reachable on `127.0.0.1:27017`

## MongoDB Behavior

The backend connects to `MONGODB_URI` (see `backend/.env.example`) using Mongoose. `bun run seed` (invoked automatically by `setup.sh`, which runs before both `bun install`'s companion setup and `bun start`) clears every application collection and reinserts the deterministic baseline described below. Restarting the app always restores this baseline — nothing you do at runtime is preserved across a reseed.

## Getting Started

1. Clone the repository, then open the project directory.
2. Install the pinned workspaces and seed the database.

   ```bash
   bun install && bash setup.sh --seed
   ```

3. Start the complete application.

   ```bash
   bun start
   ```

   Startup checks MongoDB, restores the seeded baseline, and launches the frontend and backend together.

4. Open [http://localhost:3000](http://localhost:3000) and sign in.

   ```text
   Email: jordan@anvil.dev
   Password: password123
   ```

The frontend runs on port `3000`, the API runs on port `8000`, and health is available at [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health).

## Command Reference

| Command | Purpose |
|---|---|
| `bun start` | Seeds MongoDB and starts the frontend and backend together. |
| `bun run seed` | Restores the deterministic MongoDB baseline. |
| `bun run dev:backend` | Starts only the Express API on port `8000`. |
| `bun run dev:frontend` | Starts only Vite on port `3000`. |

HackerRank installs the application with `bun install && bash setup.sh --seed` and runs it with `bun start`.

## Seeded Access

```text
Email: jordan@anvil.dev
Password: password123
```

This account has 3 environments ("Local Sandbox" active, "Staging", "Production"), 2 collections ("Anvil Sandbox" — works fully offline against the app's own backend — and "Public API Examples", which needs internet access), and a history of prior sends. A second seeded account (`sam@anvil.dev` / `password123`) demonstrates that collections, environments, and history are private per account.
