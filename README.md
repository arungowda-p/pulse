# Pulse

A feature flag management platform built with **Nx**, **Next.js**, **Prisma**, and **Tailwind CSS**.

## Architecture

Pulse uses a **3-tier flag evaluation** model:

```
Project Defaults → Environment Overrides → Client Overrides
```

- **Projects** contain flags and environments
- **Environments** (e.g. Production, Staging) scope flag overrides and contain clients
- **Clients** (e.g. Web App, Mobile App) can override flags at the most granular level
- Flag evaluation resolves: client override > environment override > project default

## Structure

| Project       | Path               | Tech                        | Description                              |
|---------------|--------------------|-----------------------------|------------------------------------------|
| **dashboard** | `apps/dashboard`   | Next.js, Prisma, Tailwind   | UI to manage projects, flags, and overrides |

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

## API

### Projects

- `GET /api/projects` — list all projects
- `POST /api/projects` — create project `{ name, slug }`
- `GET /api/projects/:slug` — get project details
- `PUT /api/projects/:slug` — update project
- `DELETE /api/projects/:slug` — delete project

### Environments

- `GET /api/projects/:slug/environments` — list environments
- `POST /api/projects/:slug/environments` — create environment `{ name }`
- `GET /api/projects/:slug/environments/:envSlug` — get environment
- `PUT /api/projects/:slug/environments/:envSlug` — update environment
- `DELETE /api/projects/:slug/environments/:envSlug` — delete environment

### Clients

- `GET /api/projects/:slug/environments/:envSlug/clients` — list clients
- `POST /api/projects/:slug/environments/:envSlug/clients` — create client `{ name }`
- `PUT /api/projects/:slug/environments/:envSlug/clients/:clientId` — update client
- `DELETE /api/projects/:slug/environments/:envSlug/clients/:clientId` — delete client

### Flags

- `GET /api/projects/:slug/flags` — list flags
- `POST /api/projects/:slug/flags` — create flag `{ key, name?, description? }`
- `GET /api/projects/:slug/flags/:key` — get flag with overrides
- `PATCH /api/projects/:slug/flags/:key` — update flag `{ name?, description?, on? }`
- `DELETE /api/projects/:slug/flags/:key` — delete flag

### Overrides

- `PUT /api/projects/:slug/flags/:key/env-overrides/:environmentId` — set environment override
- `DELETE /api/projects/:slug/flags/:key/env-overrides/:environmentId` — remove environment override
- `PUT /api/projects/:slug/flags/:key/overrides/:clientId` — set client override
- `DELETE /api/projects/:slug/flags/:key/overrides/:clientId` — remove client override

### Evaluation

- `GET /api/eval/:projectSlug/:flagKey?environmentId=...&clientId=...` — evaluate a flag

## Stack

- **Nx** — monorepo and task runner
- **Next.js 15** — dashboard (App Router)
- **Prisma** + **SQLite** — data layer
- **Tailwind CSS** — styling
- **TypeScript** — throughout
