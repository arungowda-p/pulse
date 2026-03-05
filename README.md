# LaunchDarkly MVP — Nx Monorepo

Feature flag service (LaunchDarkly-style) built with **Nx**, **React**, and **Tailwind CSS**.

## Structure

| Project     | Path           | Tech              | Description                    |
|------------|----------------|-------------------|--------------------------------|
| **dashboard** | `apps/dashboard` | React, Vite, Tailwind | UI to create/edit/toggle flags |
| **api**       | `apps/api`       | Express (Node)       | REST API: flags CRUD + eval     |
| **sdk**       | `libs/sdk`       | TypeScript            | Client SDK for flag evaluation |

## Quick start

1. **Install dependencies** (from repo root):

   ```bash
   npm install
   ```

2. **Run API and dashboard** (two terminals, or use the combined script):

   ```bash
   # Terminal 1 — API (port 3000)
   npx nx serve api

   # Terminal 2 — Dashboard (port 4200, proxies /api to 3000)
   npx nx serve dashboard
   ```

   Or run both with:

   ```bash
   npm start
   ```

3. **Open**

   - Dashboard: http://localhost:4200  
   - API: http://localhost:3000/api/flags  
   - SDK demo: http://localhost:4200/demo.html  

## Scripts

| Command              | Description                    |
|----------------------|--------------------------------|
| `npm start`          | Run API + dashboard in parallel |
| `npm run start:dashboard` | Run dashboard only (port 4200) |
| `npm run start:api`  | Run API only (port 3000)       |
| `npm run build:dashboard` | Build dashboard for production |
| `npx nx serve api`  | Serve API                      |
| `npx nx serve dashboard` | Serve dashboard             |

## API

- `GET /api/flags` — list flags  
- `GET /api/flags/:key` — get one flag  
- `POST /api/flags` — create flag `{ key, name?, description? }`  
- `PATCH /api/flags/:key` — update `{ name?, description?, on? }`  
- `DELETE /api/flags/:key` — delete flag  
- `GET /api/eval/:flagKey?user=xxx` — evaluate flag (for SDK)  
- `POST /api/eval` — bulk evaluate `{ keys: [], context: {} }`  

## Using the SDK

```ts
import { createClient } from '@launchdarkly-nx/sdk';

const client = createClient({ baseUrl: 'http://localhost:3000' });
const on = await client.variation('new-checkout', { key: 'user-123' });
```

The dashboard app uses the REST API directly; the SDK in `libs/sdk` is for other apps that need to evaluate flags.

## Stack

- **Nx** — monorepo and task runner  
- **React 18** + **Vite** — dashboard  
- **Tailwind CSS** — styling  
- **Express** — API server  
- **TypeScript** — dashboard + SDK  
