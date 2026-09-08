# 🚑 PulseRoute — Emergency Ambulance Dispatch Platform Backend

[![Live API](https://img.shields.io/badge/Live%20API-Vercel-success?style=for-the-badge&logo=vercel)](https://pulseroute-backend.vercel.app)
[![Swagger Docs](https://img.shields.io/badge/API%20Docs-Swagger%20UI-blue?style=for-the-badge&logo=swagger)](https://pulseroute-backend.vercel.app/api-docs)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/haniful360/pulseroute-backend)
[![Demo Video](https://img.shields.io/badge/Demo%20Video-Google%20Drive-red?style=for-the-badge&logo=googledrive)](https://drive.google.com/file/d/11nyfpwiG_Efn5ZrovSw8kIEUC2KTHEpY/view?usp=sharing)

**PulseRoute** is a mission-critical, enterprise-grade emergency ambulance dispatch and fleet management backend system. Built with **Node.js, Express 5, TypeScript, Prisma ORM 7, and PostgreSQL**, it powers instant emergency response, real-time GPS fleet tracking, intelligent geospatial driver dispatching, automated background scheduling, and 100% cashless automated Stripe settlements.

---

## 📌 Project Quick Links & Information

| Property | Details / Link |
| :--- | :--- |
| **Project Name** | **PulseRoute — Emergency Ambulance Dispatch Platform** |
| **Backend Repository** | [https://github.com/haniful360/pulseroute-backend](https://github.com/haniful360/pulseroute-backend) |
| **Live Production API** | [https://pulseroute-backend.vercel.app](https://pulseroute-backend.vercel.app) |
| **Interactive API Docs** | [https://pulseroute-backend.vercel.app/api-docs](https://pulseroute-backend.vercel.app/api-docs) |
| **Project Demo Video** | [Watch Video Walkthrough (Google Drive)](https://drive.google.com/file/d/11nyfpwiG_Efn5ZrovSw8kIEUC2KTHEpY/view?usp=sharing) |

---

## 🔐 Default Demo & Testing Credentials

Use these pre-seeded accounts to explore different roles and permissions in Swagger UI or Postman:

| Role | Email | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `haniful@gmail.com` | `haniful123` | Full admin control, driver/vehicle verification, platform commission & pricing configs, financial ledgers |
| **Approved Driver (Online)** | `kamal.driver@example.com` | `password123` | Online duty toggle, live GPS dispatch acceptance, trip status progression, wallet earnings |
| **Verified Patient / User** | `patient@pulseroute.com` | `password123` | Emergency trip booking, live tracking, Stripe payment intent creation, review submission |

---

## 🌟 Key Platform Features

- ⚡ **Intelligent Geospatial Ambulance Dispatching**: Matches emergency requests with the nearest online, approved ambulance within a 50 km radius using Haversine geospatial calculations.
- 💳 **100% Cashless Stripe Integration**: Built-in Stripe Payment Intents and webhook handlers for secure instant card payments and automated driver earnings settlement.
- 📍 **Real-Time WebSockets (Socket.IO)**: Low-latency bi-directional communication for live GPS coordinates broadcasting, trip state transitions, and instant siren dispatch alerts.
- ⏱️ **Automated Background Cron Engine**: Scheduled tasks automatically clean expired dispatch offers and cancel unassigned requests gracefully.
- 🛡️ **Role-Based Access Control (RBAC) & Rate Limiting**: Secure JWT access & refresh tokens, Redis-backed OTP validation (registration, login, password recovery), and bot-prevention rate limiters.
- 📊 **Dynamic Fare & Surge Engine**: Calculates trip fares based on ambulance category (`BASIC`, `AC`, `ICU`, `CCU`, `FREEZER`, `NEONATAL`), base rates, per-km fees, per-minute duration, and emergency severity multipliers.
- 📄 **Interactive Swagger Documentation**: Comprehensive OpenAPI 3.0 specs with executable "Try it out" requests, response schemas, and JWT Bearer authorization.

---

## 💻 Tech Stack

- **Runtime & Framework**: Node.js 24, Express 5
- **Language**: TypeScript
- **Database & ORM**: PostgreSQL, Prisma ORM 7 (`@prisma/adapter-pg`, `@prisma/client`)
- **In-Memory Cache & OTP**: Redis (`redis` v4/v6)
- **Real-Time Engine**: Socket.IO
- **Payments**: Stripe API (`stripe`)
- **Cloud Media Storage**: Cloudinary SDK (`cloudinary`, `multer`)
- **Mailing**: Nodemailer (EJS HTML templates)
- **Security & Validation**: Zod, Helmet, Express-Rate-Limit, BCryptJS, JsonWebToken
- **Deployment**: Vercel Serverless Platform (`tsup` bundle)

---

## 🚀 Step-by-Step Local Setup & Run Guide

### 1. Prerequisites
Ensure you have the following installed on your machine:
- **Node.js**: v20.x or v22.x+ ([Download Node.js](https://nodejs.org/))
- **pnpm**: v9+ (Run `npm install -g pnpm` or `corepack enable`)
- **PostgreSQL Database**: Local or Cloud instance (Neon, Supabase, Aiven, or Railway)
- **Redis Server**: Local or Cloud instance (Upstash, Redis Cloud)

---

### 2. Clone the Repository
```bash
git clone https://github.com/haniful360/pulseroute-backend.git
cd pulseroute-backend
```

---

### 3. Install Dependencies
```bash
pnpm install
```

---

### 4. Configure Environment Variables
Copy the example environment file and fill in your credentials:
```bash
cp .env.example .env
```

Open `.env` and verify your configuration:
```env
NODE_ENV=development
PORT=5000

# PostgreSQL Connection String (Supports pooled connection with sslmode=require)
DATABASE_URL="postgresql://username:password@localhost:5432/pulseroute_db?schema=public"

# JWT Authentication Secrets
JWT_ACCESS_SECRET="your_jwt_access_secret_key_here"
JWT_REFRESH_SECRET="your_jwt_refresh_secret_key_here"
JWT_ACCESS_EXPIRES_IN="1d"
JWT_REFRESH_EXPIRES_IN="7d"
BCRYPT_SALT_ROUNDS=10

# URLs & CORS Configuration
BACKEND_URL="http://localhost:5000"
FRONTEND_URL="http://localhost:3000"
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:5173,https://pulseroute-backend.vercel.app"

# Redis Configuration (For OTP caching & rate limiting)
REDIS_HOST="127.0.0.1"
REDIS_PORT=6379
REDIS_USERNAME="default"
REDIS_PASSWORD=""
# Or use REDIS_URL directly:
# REDIS_URL="redis://default:password@your-redis-host:6379"

# SMTP Email Configuration (Nodemailer)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_SENDER="PulseRoute Support <your-email@gmail.com>"

# Cloudinary Cloud Storage
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Stripe 100% Cashless Payment Gateway
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

---

### 5. Generate Prisma Client & Run Migrations
```bash
# Generate Prisma Client
pnpm prisma generate

# Apply Database Schema / Migrations
pnpm prisma db push
```

---

### 6. Seed Database with Super Admin, Pricing & Test Accounts
```bash
pnpm seed
```
> **What this does:**
> - Creates default **Super Admin** (`haniful@gmail.com` / `haniful123`)
> - Seeds baseline **Ambulance Pricing Configurations** for all 6 vehicle types (`BASIC`, `AC`, `ICU`, `CCU`, `FREEZER`, `NEONATAL`)
> - Seeds verified online **Test Driver** (`kamal.driver@example.com` / `password123`)
> - Seeds verified **Test Patient** (`patient@pulseroute.com` / `password123`)

---

### 7. Run the Application

#### Development Mode (with hot-reload):
```bash
pnpm dev
```

#### Production Build & Start:
```bash
pnpm build
pnpm start
```

The server will start at: `http://localhost:5000`

---

## 📖 Interactive Swagger API Documentation

Once the server is running, open your browser and navigate to:

- **Local Swagger UI**: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)
- **Live Vercel Swagger UI**: [https://pulseroute-backend.vercel.app/api-docs](https://pulseroute-backend.vercel.app/api-docs)

You can authorize requests directly by clicking the **Authorize 🔓** button and pasting your `Bearer <accessToken>`.

---

## 📡 Core API Endpoints Overview

| Module | Method & Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST /api/v1/auth/register` | Public | Patient registration (Sends 6-digit OTP) |
| **Auth** | `POST /api/v1/auth/register-driver` | Public | Driver registration with license & vehicle upload |
| **Auth** | `POST /api/v1/auth/verify-otp` | Public | Verify OTP & activate account |
| **Auth** | `POST /api/v1/auth/login` | Public | Universal login for User, Driver & Admin |
| **Auth** | `POST /api/v1/auth/google-login` | Public | Google OAuth 2.0 Sign-In |
| **Auth** | `POST /api/v1/auth/forgot-password` | Public | Request password reset OTP |
| **Auth** | `POST /api/v1/auth/reset-password` | Public | Reset password with OTP |
| **Drivers** | `PATCH /api/v1/drivers/duty-status` | Driver | Toggle `ONLINE` / `OFFLINE` status |
| **Drivers** | `PATCH /api/v1/drivers/location` | Driver | Update live GPS coordinates (`lat`, `lng`) |
| **Trips** | `POST /api/v1/trips` | User / Admin | Request an emergency ambulance dispatch |
| **Trips** | `GET /api/v1/trips/offers/my-offers` | Driver | Fetch active pending dispatch offers |
| **Trips** | `PATCH /api/v1/trips/offers/:id/accept` | Driver | Accept emergency dispatch offer |
| **Trips** | `PATCH /api/v1/trips/:id/status` | Driver | Update status: `EN_ROUTE` ➔ `ARRIVED` ➔ `IN_TRANSIT` ➔ `COMPLETED` |
| **Payments** | `POST /api/v1/payments/create-intent` | User / Admin | Create Stripe Cashless Payment Intent |
| **Payments** | `POST /api/v1/payments/confirm` | User / Admin | Confirm payment and settle invoice |
| **Wallets** | `GET /api/v1/wallets/my-wallet` | Driver | View driver balance & earnings breakdown |
| **Wallets** | `POST /api/v1/wallets/payout-request` | Driver | Request wallet withdrawal |
| **Reviews** | `POST /api/v1/reviews` | User | Submit rating & review for completed trip |
| **Analytics**| `GET /api/v1/analytics/overview` | Admin | System dashboard metrics & fleet utilization |

---

## 🧪 Testing the Emergency Dispatch Flow

```mermaid
sequenceDiagram
    autonumber
    actor Driver as 🚑 Driver (kamal.driver@example.com)
    actor Patient as 🧑‍💼 Patient (patient@pulseroute.com)
    participant API as 🌐 PulseRoute API

    Driver->>API: 1. Login (POST /api/v1/auth/login)
    Driver->>API: 2. Set Duty ONLINE (PATCH /api/v1/drivers/duty-status)
    Patient->>API: 3. Request Ambulance (POST /api/v1/trips)
    Driver->>API: 4. View Offer (GET /api/v1/trips/offers/my-offers)
    Driver->>API: 5. Accept Offer (PATCH /api/v1/trips/offers/{id}/accept)
    Driver->>API: 6. Progress Trip Status (PATCH /api/v1/trips/{id}/status)
    Patient->>API: 7. Pay via Stripe (POST /api/v1/payments/create-intent)
```

1. **Log in as Driver**: `kamal.driver@example.com` / `password123` via `POST /api/v1/auth/login`.
2. **Set Duty ONLINE**: `PATCH /api/v1/drivers/duty-status` with `{"dutyStatus": "ONLINE"}`.
3. **Log in as Patient**: `patient@pulseroute.com` / `password123` and send `POST /api/v1/trips` with pickup coordinates.
4. **Fetch & Accept Offer**: Under Driver token, call `GET /api/v1/trips/offers/my-offers` and `PATCH /api/v1/trips/offers/:offerId/accept`.
5. **Complete & Settle**: Progress the trip status to `COMPLETED` and confirm payment via Stripe.

---

## 🛡️ License

This project is licensed under the **ISC License**. Developed by [Haniful Islam](https://github.com/haniful360).
