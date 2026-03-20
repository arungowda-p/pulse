# Pulse

A feature-flag management platform built with **Nx**, **Next.js**, **Prisma**, and **Tailwind CSS**.

## Architecture

Pulse uses a **3-tier flag evaluation** model:

```
Project Defaults → Environment Overrides → Client Overrides
```

- **Projects** contain flags and environments
- **Environments** (e.g. Production, Staging) scope flag overrides and contain clients
- **Clients** (e.g. Web App, Mobile App) can override flags at the most granular level
- Flag evaluation resolves: client override > environment override > project default

## Features

- **Project management** — create, list, and delete projects from the home page
- **Flag management** — add, edit, toggle, and delete feature flags per project
- **Environment scoping** — define environments (Production, Staging, etc.) with independent flag overrides
- **Client-level targeting** — override flags for specific clients (Web App, Mobile App, API Server)
- **3-tier evaluation API** — resolve the effective flag value through project → environment → client cascade
- **Authentication** — JWT-based login with username or email, HTTP-only cookie sessions
- **Role-based access control** — three roles with cascading permissions (see below)
- **User management API** — admins can create users and assign them to projects or clients
- **SDK** — lightweight client SDK (`@launchdarkly-nx/sdk`) for evaluating flags from any JS/TS app

## Roles & Permissions

| Role              | Scope                          | Can Do                                                         |
|-------------------|--------------------------------|----------------------------------------------------------------|
| **Admin**         | Everything                     | Full CRUD on projects, flags, environments, clients, and users |
| **Project Admin** | Assigned projects              | Manage flags, environments, and clients within those projects  |
| **Client Admin**  | Assigned clients               | Toggle flag overrides for their specific clients               |

- Admins can assign any user to any project or client
- Project Admins see only the projects they are assigned to
- Client Admins see only the projects containing their assigned clients

## Structure

```
pulse-nx/
├── apps/
│   └── dashboard/               # Next.js dashboard app
│       ├── prisma/
│       │   ├── schema.prisma    # Database schema
│       │   └── seed.ts          # Seed data
│       └── src/
│           ├── app/
│           │   ├── api/         # REST API routes
│           │   ├── projects/    # Project detail pages
│           │   ├── layout.tsx
│           │   └── page.tsx     # Home — project list
│           ├── components/      # UI components and modals
│           ├── lib/             # Client-side stores
│           └── types/
├── libs/
│   └── sdk/                     # Feature-flag client SDK
├── nx.json
├── tsconfig.base.json
└── package.json
```

| Project       | Path             | Tech                      | Description                                 |
|---------------|------------------|---------------------------|---------------------------------------------|
| **dashboard** | `apps/dashboard` | Next.js, Prisma, Tailwind | UI and API for managing flags and overrides  |
| **sdk**       | `libs/sdk`       | TypeScript                | Client SDK for evaluating flags at runtime   |

## Quick Start

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up the database:**

   ```bash
   cd apps/dashboard
   npx prisma db push
   npx prisma db seed
   ```

3. **Run the dashboard:**

   ```bash
   npx nx dev dashboard
   ```

4. **Open:** http://localhost:4200

5. **Login with the seeded admin account:**

   - Username: `arun-admin`
   - Password: `P@ssw0rd1!`

## Database Schema

| Model                | Key Fields                                      | Relationships                          |
|----------------------|-------------------------------------------------|----------------------------------------|
| **Project**          | `id`, `name`, `slug`, `createdAt`, `updatedAt`  | → Environments, Flags                  |
| **Environment**      | `id`, `name`, `slug`, `projectId`               | → Project, Clients, EnvFlagOverrides   |
| **Client**           | `id`, `name`, `environmentId`                   | → Environment, ClientFlagOverrides     |
| **Flag**             | `id`, `key`, `name`, `description`, `on`        | → Project, EnvFlagOverrides, ClientFlagOverrides |
| **EnvFlagOverride**  | `id`, `environmentId`, `flagId`, `on`           | → Environment, Flag                    |
| **ClientFlagOverride** | `id`, `clientId`, `flagId`, `on`              | → Client, Flag                         |
| **User**             | `id`, `username`, `email`, `passwordHash`, `role` | → UserProjectAccess, UserClientAccess |
| **UserProjectAccess** | `id`, `userId`, `projectId`                    | → User, Project                        |
| **UserClientAccess** | `id`, `userId`, `clientId`                      | → User, Client                         |

## API

All endpoints are served by the dashboard app under `/api`.

### Projects

| Method   | Path                      | Body / Params                | Description        |
|----------|---------------------------|------------------------------|--------------------|
| `GET`    | `/api/projects`           | —                            | List all projects  |
| `POST`   | `/api/projects`           | `{ name, slug? }`           | Create a project   |
| `GET`    | `/api/projects/:slug`     | —                            | Get project        |
| `PATCH`  | `/api/projects/:slug`     | `{ name? }`                 | Update project     |
| `DELETE` | `/api/projects/:slug`     | —                            | Delete project     |

### Environments

| Method   | Path                                              | Body / Params        | Description          |
|----------|----------------------------------------------------|----------------------|----------------------|
| `GET`    | `/api/projects/:slug/environments`                | —                    | List environments    |
| `POST`   | `/api/projects/:slug/environments`                | `{ name, slug? }`   | Create environment   |
| `GET`    | `/api/projects/:slug/environments/:envSlug`       | —                    | Get environment      |
| `PATCH`  | `/api/projects/:slug/environments/:envSlug`       | `{ name? }`         | Update environment   |
| `DELETE` | `/api/projects/:slug/environments/:envSlug`       | —                    | Delete environment   |

### Clients

| Method   | Path                                                              | Body / Params  | Description     |
|----------|-------------------------------------------------------------------|----------------|-----------------|
| `GET`    | `/api/projects/:slug/environments/:envSlug/clients`              | —              | List clients    |
| `POST`   | `/api/projects/:slug/environments/:envSlug/clients`              | `{ name }`    | Create client   |
| `PATCH`  | `/api/projects/:slug/environments/:envSlug/clients/:clientId`    | `{ name? }`   | Update client   |
| `DELETE` | `/api/projects/:slug/environments/:envSlug/clients/:clientId`    | —              | Delete client   |

### Flags

| Method   | Path                              | Body / Params                        | Description             |
|----------|-----------------------------------|--------------------------------------|-------------------------|
| `GET`    | `/api/projects/:slug/flags`      | —                                    | List flags with overrides |
| `POST`   | `/api/projects/:slug/flags`      | `{ key, name?, description? }`      | Create flag             |
| `GET`    | `/api/projects/:slug/flags/:key` | —                                    | Get flag with overrides |
| `PATCH`  | `/api/projects/:slug/flags/:key` | `{ name?, description?, on? }`      | Update flag             |
| `DELETE` | `/api/projects/:slug/flags/:key` | —                                    | Delete flag             |

### Overrides

| Method   | Path                                                          | Body          | Description               |
|----------|---------------------------------------------------------------|---------------|---------------------------|
| `PUT`    | `/api/projects/:slug/flags/:key/env-overrides/:environmentId`| `{ on }`     | Set environment override  |
| `DELETE` | `/api/projects/:slug/flags/:key/env-overrides/:environmentId`| —            | Remove environment override |
| `PUT`    | `/api/projects/:slug/flags/:key/overrides/:clientId`         | `{ on }`     | Set client override       |
| `DELETE` | `/api/projects/:slug/flags/:key/overrides/:clientId`         | —            | Remove client override    |

### Authentication

| Method | Path                | Body / Params                | Description                    |
|--------|---------------------|------------------------------|--------------------------------|
| `POST` | `/api/auth/login`   | `{ login, password }`        | Login (username or email)      |
| `POST` | `/api/auth/logout`  | —                            | Logout (clears session cookie) |
| `GET`  | `/api/auth/me`      | —                            | Get current authenticated user |

### Users (Admin only)

| Method   | Path                              | Body / Params                              | Description                |
|----------|-----------------------------------|--------------------------------------------|----------------------------|
| `GET`    | `/api/users`                     | —                                          | List all users             |
| `POST`   | `/api/users`                     | `{ username, email, password, role? }`    | Create a user              |
| `GET`    | `/api/users/:userId`             | —                                          | Get user with access list  |
| `PATCH`  | `/api/users/:userId`             | `{ username?, email?, password?, role? }` | Update user                |
| `DELETE` | `/api/users/:userId`             | —                                          | Delete user                |
| `POST`   | `/api/users/:userId/projects`    | `{ projectId }`                           | Grant project access       |
| `DELETE` | `/api/users/:userId/projects`    | `{ projectId }`                           | Revoke project access      |
| `POST`   | `/api/users/:userId/clients`     | `{ clientId }`                            | Grant client access        |
| `DELETE` | `/api/users/:userId/clients`     | `{ clientId }`                            | Revoke client access       |

### Evaluation

| Method | Path                                    | Query Params                    | Description                              |
|--------|-----------------------------------------|---------------------------------|------------------------------------------|
| `GET`  | `/api/eval/:projectSlug/:flagKey`       | `environmentId?`, `clientId?`   | Evaluate a flag through the 3-tier cascade |

**Response:**

```json
{ "key": "dark-mode", "on": true, "source": "env-override" }
```

`source` is one of `"project"`, `"env-override"`, or `"client-override"`.

## SDK

The `@launchdarkly-nx/sdk` package (`libs/sdk`) provides a lightweight client for evaluating flags.

```typescript
import { createClient } from '@launchdarkly-nx/sdk';

const client = createClient({
  baseUrl: 'http://localhost:4200',
  defaultValue: false,
});

const isEnabled = await client.variation('dark-mode');
const allFlags  = await client.variationAll(['dark-mode', 'new-checkout']);
```

| Method                          | Returns                              | Description                       |
|---------------------------------|--------------------------------------|-----------------------------------|
| `variation(flagKey, ctx?)`      | `Promise<boolean>`                   | Evaluate a single flag            |
| `variationAll(flagKeys, ctx?)`  | `Promise<Record<string, boolean | null>>` | Evaluate multiple flags      |

## Scripts

| Command                    | Description                     |
|----------------------------|---------------------------------|
| `npm start`                | Serve the dashboard (`nx serve dashboard`) |
| `npm run build`            | Build dashboard and SDK         |
| `npm run build:dashboard`  | Build dashboard only            |
| `npx nx dev dashboard`     | Dev server with hot reload      |
| `npx prisma db push`       | Apply schema to SQLite          |
| `npx prisma db seed`       | Seed the database               |

## Stack

- **Nx 22** — monorepo tooling and task runner
- **Next.js 14** — dashboard app (App Router)
- **Prisma** + **SQLite** — data layer
- **Tailwind CSS** — styling
- **TypeScript** — throughout
