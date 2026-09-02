# PulseRoute — Emergency Ambulance Dispatch Platform Backend

High-performance emergency ambulance dispatch backend system built with Node.js, Express, TypeScript, Prisma ORM, and PostgreSQL.

**Stack:** Node.js · Express 5 · TypeScript · Prisma 7 · PostgreSQL · JWT Auth · pnpm

---

## 👥 Core Roles

1. **USER (Patient / Requester):** Request emergency ambulances (AC, ICU, Basic, Freezer, Neonatal), live tracking, billing & invoices.
2. **DRIVER (Ambulance Driver):** Duty management (`ONLINE`/`OFFLINE`), dispatch call acceptance, trip lifecycle updates (`REQUESTED` $\rightarrow$ `ACCEPTED` $\rightarrow$ `EN_ROUTE` $\rightarrow$ `COMPLETED`), wallet earnings.
3. **SUPER_ADMIN:** Driver/vehicle verification, platform pricing & commission configuration (10-15%), payout processing, system analytics.

---

## 🚀 Prerequisites

| Tool | Version | Check with |
| :--- | :--- | :--- |
| **Node.js** | 20+ | `node -v` |
| **pnpm** | 9+ | `pnpm -v` |
| **PostgreSQL** | 14+ | `psql -V` |

---

## 🛠️ Getting Started with pnpm

### 1. Install dependencies
```bash
pnpm install
```

### 2. Set up environment variables
```bash
cp .env.example .env
```
Ensure `DATABASE_URL` in `.env` points to your PostgreSQL database:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pulseroute_db?schema=public"
```

### 3. Generate Prisma Client
```bash
pnpm prisma generate
```

### 4. Seed Super Admin & Platform Pricing
```bash
pnpm seed
```
> Seeds Super Admin (`haniful@gmail.com` / `haniful123`) and default ambulance pricing configs.

### 5. Start Development Server
```bash
pnpm dev
```

---

## 📦 Available pnpm Scripts

```bash
pnpm dev       # Start server in watch mode with tsx
pnpm build     # Type-check and compile with tsc
pnpm start     # Run compiled production server
pnpm seed      # Seed Super Admin and default platform data
pnpm prisma    # Run Prisma CLI commands (generate, migrate, studio)
```

---

## 📡 Authentication API Overview

Base URL: `http://localhost:5000/api/v1/auth`

| Method | Path | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/register` | Public | Register new User (Patient) |
| `POST` | `/register-driver` | Public | Apply as Driver (pending verification) |
| `POST` | `/login` | Public | Dynamic universal login for all roles |
| `GET` | `/me` | Protected | Fetch authenticated user profile |
| `POST` | `/change-password` | Protected | Change account password |
| `POST` | `/refresh-token` | Public | Issue new access token using refresh token |
| `POST` | `/logout` | Public | Clear auth cookies |
