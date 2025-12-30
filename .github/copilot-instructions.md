## Quick context (what this repo is)

- Famcal is an Angular (v20) single-page app with an optional Express-based API server under `server/`.
- Frontend source: `src/` (feature modules under `src/app/features`, shared helpers under `src/app/shared` and `src/app/core`).
- Server: `server/app.js`, route files in `server/routes/`, business logic in `server/business-logic-layer/`, and data models in `server/models/`.

## Big-picture architecture

- Frontend (Angular) handles UI and calls the backend API at paths mounted under `/api` (see `server/app.js`).
- Backend (Express) implements auth and task endpoints, delegates domain logic to `server/business-logic-layer/*` and persists/reads via `server/models/*` (Firebase Admin is used).
- Authentication: JWT + `server/middlewere/varifyLogin.js` protects routes — look there if you add or modify protected endpoints.

## Key files to inspect for changes

- `server/app.js` — server entry and where routers are mounted (base path `/api`).
- `server/routes/authRoutes.js`, `server/routes/taskRoutes.js` — examples of how routes are defined and used.
- `server/business-logic-layer/userLogic.js` and `server/business-logic-layer/taskLogic.js` — put domain logic here; keep route handlers thin.
- `server/models/*.js` — model shapes and direct Firebase admin calls.
- `src/app/core/authService.ts` and `src/app/core/tasksService.ts` — Angular services that call the API; follow their request/response shapes when changing server APIs.
- `src/main.ts` and `src/main.server.ts` — bootstrap points (client vs SSR).

## Developer workflows (commands & tips)

- Frontend dev server (hot reload):

```bash
npm run start        # runs `ng serve` from project root (open http://localhost:4200)
```

- Run tests:

```bash
npm run test         # runs `ng test` (Karma)
```

- Build and run SSR bundle (server-side rendering):

```bash
npm run build        # angular build
npm run serve:ssr:famcal  # runs built SSR server (node dist/famcal/server/server.mjs)
```

- Backend server (development):

```bash
cd server && npm start   # starts server/app.js (express)
```

Note: there is no single root script to concurrently run both frontend and backend; run them in separate terminals.

## Project-specific conventions & patterns

- Feature layout: each feature under `src/app/features/<feature>` groups `.ts/.html/.css/.spec.ts`. When adding UI, follow that schema.
- Services that call the backend live in `src/app/core/`. Reuse `authService` and `tasksService` for consistent headers and error handling.
- Keep Express route handlers minimal — move validation and business rules to `server/business-logic-layer/*` (this repo follows that separation).
- API base path is `/api` — all route files in `server/routes/` are mounted there in `server/app.js`.

## Integration & external dependencies

- Firebase Admin SDK (server uses `firebase-admin` and a local `firebase-service-account.json`). Do NOT commit credentials.
- JWT tokens are used for auth (`jsonwebtoken` present). Look at `server/middlewere/varifyLogin.js` for token parsing and route protection.
- OpenAI client is installed (`openai`) — search server code for usages before adding keys.

## When adding an API endpoint — concrete steps

1. Add route file or update `server/routes/<yourRoute>.js` following the pattern in `authRoutes.js`.
2. Implement business logic in `server/business-logic-layer/<yourLogic>.js` and export functions.
3. Use or update models in `server/models/` for persistence; prefer a single responsibility per model file.
4. Protect the route with `varifyLogin.js` if the endpoint requires authentication.
5. Update or add Angular service method in `src/app/core/tasksService.ts` (or `authService.ts`) to call the new endpoint and mirror request/response shapes.

## Example references

- To add an authenticated task endpoint, follow: `server/routes/taskRoutes.js` -> `server/business-logic-layer/taskLogic.js` -> `server/models/taskModel.js` -> client call in `src/app/core/tasksService.ts`.
- For SSR behavior, check `src/main.server.ts` and `package.json` script `serve:ssr:famcal`.

## Safety / secret handling

- `server/firebase-service-account.json` exists in the repo tree — treat as secret. Use environment variables for production keys and do not commit real credentials.

## Things an AI agent should never change automatically

- Never print or commit contents of `server/firebase-service-account.json` or `.env` values to output or code.
- Do not remove or alter JWT verification middleware without updating all protected routes and client tokens.

---

If any section needs more detail (examples of route handlers, exact request shapes for tasks/users, or CI details), tell me which piece you want expanded and I will extend the file.
