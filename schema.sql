-- =============================================================================
-- PULSEROUTE DATABASE SCHEMA (PostgreSQL DDL)
-- Emergency Ambulance Dispatch & Fleet Management Platform
-- =============================================================================

-- Enable UUID extension for unique identifier generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. ENUMS
-- =============================================================================

CREATE TYPE "Role" AS ENUM (
  'SUPER_ADMIN',
  'DRIVER',
  'USER'
);

CREATE TYPE "UserStatus" AS ENUM (
  'ACTIVE',
  'BLOCKED',
  'DELETED',
  'PENDING_APPROVAL'
);

CREATE TYPE "AuthProvider" AS ENUM (
  'LOCAL',
  'GOOGLE'
);

CREATE TYPE "Gender" AS ENUM (
  'MALE',
  'FEMALE',
  'OTHER'
);

CREATE TYPE "DriverVerificationStatus" AS ENUM (
  'PENDING',
  'APPROVED',
  'REJECTED',
  'SUSPENDED'
);

CREATE TYPE "DutyStatus" AS ENUM (
  'ONLINE',
  'OFFLINE',
  'ON_TRIP',
  'BUSY'
);

CREATE TYPE "AmbulanceType" AS ENUM (
  'BASIC',
  'AC',
  'ICU',
  'CCU',
  'FREEZER',
  'NEONATAL'
);

CREATE TYPE "VehicleVerificationStatus" AS ENUM (
  'PENDING',
  'APPROVED',
  'REJECTED'
);

CREATE TYPE "TripStatus" AS ENUM (
  'REQUESTED',
  'ACCEPTED',
  'EN_ROUTE',
  'ARRIVED',
  'IN_TRANSIT',
  'COMPLETED',
  'CANCELLED'
);

CREATE TYPE "EmergencySeverity" AS ENUM (
  'CRITICAL',
  'HIGH',
  'MODERATE',
  'LOW'
);

CREATE TYPE "OfferStatus" AS ENUM (
  'PENDING',
  'ACCEPTED',
  'REJECTED',
  'EXPIRED'
);

CREATE TYPE "PaymentStatus" AS ENUM (
  'UNPAID',
  'PENDING',
  'PAID',
  'REFUNDED',
  'FAILED'
);

CREATE TYPE "PaymentMethod" AS ENUM (
  'STRIPE'
);

CREATE TYPE "TransactionType" AS ENUM (
  'TRIP_EARNING',
  'COMMISSION_DEDUCTION',
  'PAYOUT_WITHDRAWAL',
  'BONUS',
  'PENALTY',
  'REFUND'
);

CREATE TYPE "TransactionDirection" AS ENUM (
  'CREDIT',
  'DEBIT'
);

CREATE TYPE "TransactionStatus" AS ENUM (
  'PENDING',
  'COMPLETED',
  'FAILED',
  'CANCELLED'
);

CREATE TYPE "PayoutStatus" AS ENUM (
  'REQUESTED',
  'PROCESSING',
  'APPROVED',
  'REJECTED'
);

CREATE TYPE "NotificationType" AS ENUM (
  'TRIP',
  'PAYMENT',
  'WALLET',
  'ACCOUNT',
  'SYSTEM'
);

-- =============================================================================
-- 2. CORE USERS & AUTHENTICATION
-- =============================================================================

CREATE TABLE "users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "password" VARCHAR(255),
  "googleId" VARCHAR(255) UNIQUE,
  "authProvider" "AuthProvider" NOT NULL DEFAULT 'LOCAL',
  "phone" VARCHAR(50),
  "avatarUrl" TEXT,
  "role" "Role" NOT NULL DEFAULT 'USER',
  "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  "needPasswordChange" BOOLEAN NOT NULL DEFAULT false,
  "isDeleted" BOOLEAN NOT NULL DEFAULT false,
  "deletedAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX "idx_user_email" ON "users" ("email");
CREATE INDEX "idx_user_googleId" ON "users" ("googleId");
CREATE INDEX "idx_user_role" ON "users" ("role");
CREATE INDEX "idx_user_status" ON "users" ("status");
CREATE INDEX "idx_user_isDeleted" ON "users" ("isDeleted");

-- =============================================================================
-- 3. ACTOR PROFILES (Admin, Patient, Driver)
-- =============================================================================

CREATE TABLE "admins" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "name" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "orgEmail" VARCHAR(255),
  "contactNumber" VARCHAR(50),
  "department" VARCHAR(255),
  "isDeleted" BOOLEAN NOT NULL DEFAULT false,
  "deletedAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX "idx_admin_email" ON "admins" ("email");
CREATE INDEX "idx_admin_isDeleted" ON "admins" ("isDeleted");

CREATE TABLE "patients" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "name" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "contactNumber" VARCHAR(50),
  "address" TEXT,
  "emergencyContactNumber" VARCHAR(50),
  "bloodGroup" VARCHAR(10),
  "gender" "Gender",
  "dateOfBirth" TIMESTAMP WITH TIME ZONE,
  "medicalHistory" TEXT,
  "profilePhoto" TEXT,
  "isDeleted" BOOLEAN NOT NULL DEFAULT false,
  "deletedAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX "idx_patient_email" ON "patients" ("email");
CREATE INDEX "idx_patient_contact" ON "patients" ("contactNumber");
CREATE INDEX "idx_patient_isDeleted" ON "patients" ("isDeleted");

CREATE TABLE "drivers" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "name" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "contactNumber" VARCHAR(50) NOT NULL,
  "licenseNumber" VARCHAR(100) NOT NULL UNIQUE,
  "licenseExpiry" TIMESTAMP WITH TIME ZONE,
  "licensePhotoUrl" TEXT,
  "licensePhotos" TEXT[] DEFAULT '{}',
  "nidNumber" VARCHAR(50),
  "nidPhotoUrl" TEXT,
  "nidPhotos" TEXT[] DEFAULT '{}',
  "experienceYears" INTEGER NOT NULL DEFAULT 0,
  "verificationStatus" "DriverVerificationStatus" NOT NULL DEFAULT 'PENDING',
  "verifiedAt" TIMESTAMP WITH TIME ZONE,
  "verifiedById" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "rejectionReason" TEXT,
  "dutyStatus" "DutyStatus" NOT NULL DEFAULT 'OFFLINE',
  "currentLatitude" DOUBLE PRECISION,
  "currentLongitude" DOUBLE PRECISION,
  "currentHeading" DOUBLE PRECISION,
  "lastLocationUpdate" TIMESTAMP WITH TIME ZONE,
  "rating" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
  "totalTrips" INTEGER NOT NULL DEFAULT 0,
  "currentVehicleId" UUID UNIQUE,
  "isDeleted" BOOLEAN NOT NULL DEFAULT false,
  "deletedAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX "idx_driver_email" ON "drivers" ("email");
CREATE INDEX "idx_driver_contact" ON "drivers" ("contactNumber");
CREATE INDEX "idx_driver_license" ON "drivers" ("licenseNumber");
CREATE INDEX "idx_driver_verification" ON "drivers" ("verificationStatus");
CREATE INDEX "idx_driver_dutyStatus" ON "drivers" ("dutyStatus");
CREATE INDEX "idx_driver_location" ON "drivers" ("currentLatitude", "currentLongitude");
CREATE INDEX "idx_driver_isDeleted" ON "drivers" ("isDeleted");

-- =============================================================================
-- 4. VEHICLES & FLEET
-- =============================================================================

CREATE TABLE "vehicles" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "driverId" UUID NOT NULL REFERENCES "drivers"("id") ON DELETE CASCADE,
  "ambulanceType" "AmbulanceType" NOT NULL,
  "vehicleNumber" VARCHAR(100) NOT NULL UNIQUE,
  "photoUrl" TEXT,
  "photos" TEXT[] DEFAULT '{}',
  "model" VARCHAR(255),
  "manufacturer" VARCHAR(255),
  "year" INTEGER,
  "hasOxygen" BOOLEAN NOT NULL DEFAULT true,
  "hasVentilator" BOOLEAN NOT NULL DEFAULT false,
  "hasDefibrillator" BOOLEAN NOT NULL DEFAULT false,
  "hasSuctionMachine" BOOLEAN NOT NULL DEFAULT false,
  "equipmentDetails" TEXT,
  "verificationStatus" "VehicleVerificationStatus" NOT NULL DEFAULT 'PENDING',
  "verifiedAt" TIMESTAMP WITH TIME ZONE,
  "verifiedById" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "rejectionReason" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isDeleted" BOOLEAN NOT NULL DEFAULT false,
  "deletedAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Foreign key for driver's active vehicle
ALTER TABLE "drivers"
  ADD CONSTRAINT "fk_driver_current_vehicle"
  FOREIGN KEY ("currentVehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL;

CREATE INDEX "idx_vehicle_driverId" ON "vehicles" ("driverId");
CREATE INDEX "idx_vehicle_number" ON "vehicles" ("vehicleNumber");
CREATE INDEX "idx_vehicle_type" ON "vehicles" ("ambulanceType");
CREATE INDEX "idx_vehicle_verification" ON "vehicles" ("verificationStatus");
CREATE INDEX "idx_vehicle_isDeleted" ON "vehicles" ("isDeleted");

-- =============================================================================
-- 5. PRICING & FARE CONFIGURATIONS
-- =============================================================================

CREATE TABLE "pricing_configs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ambulanceType" "AmbulanceType" NOT NULL UNIQUE,
  "baseFare" NUMERIC(10, 2) NOT NULL,
  "perKmRate" NUMERIC(10, 2) NOT NULL,
  "perMinuteRate" NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  "platformCommissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.12,
  "nightSurgeMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.00,
  "emergencySurgeMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.00,
  "minFare" NUMERIC(10, 2) NOT NULL,
  "cancellationFee" NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX "idx_pricing_ambulanceType" ON "pricing_configs" ("ambulanceType");

-- =============================================================================
-- 6. TRIPS & DISPATCH MANAGEMENT
-- =============================================================================

CREATE TABLE "trips" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tripCode" VARCHAR(100) NOT NULL UNIQUE,
  "patientId" UUID NOT NULL REFERENCES "patients"("id"),
  "driverId" UUID REFERENCES "drivers"("id"),
  "vehicleId" UUID REFERENCES "vehicles"("id"),
  "ambulanceType" "AmbulanceType" NOT NULL,
  "status" "TripStatus" NOT NULL DEFAULT 'REQUESTED',
  "emergencySeverity" "EmergencySeverity" NOT NULL DEFAULT 'HIGH',
  "pickupAddress" TEXT NOT NULL,
  "pickupLatitude" DOUBLE PRECISION NOT NULL,
  "pickupLongitude" DOUBLE PRECISION NOT NULL,
  "destinationAddress" TEXT,
  "destinationLatitude" DOUBLE PRECISION,
  "destinationLongitude" DOUBLE PRECISION,
  "distanceKm" DOUBLE PRECISION,
  "estimatedDurationMins" DOUBLE PRECISION,
  "estimatedFare" NUMERIC(10, 2),
  "patientNotes" TEXT,
  "cancellationReason" TEXT,
  "cancelledById" UUID,
  "cancelledByRole" "Role",
  "requestedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "acceptedAt" TIMESTAMP WITH TIME ZONE,
  "enRouteAt" TIMESTAMP WITH TIME ZONE,
  "arrivedAt" TIMESTAMP WITH TIME ZONE,
  "inTransitAt" TIMESTAMP WITH TIME ZONE,
  "completedAt" TIMESTAMP WITH TIME ZONE,
  "cancelledAt" TIMESTAMP WITH TIME ZONE,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX "idx_trip_patientId" ON "trips" ("patientId");
CREATE INDEX "idx_trip_driverId" ON "trips" ("driverId");
CREATE INDEX "idx_trip_vehicleId" ON "trips" ("vehicleId");
CREATE INDEX "idx_trip_status" ON "trips" ("status");
CREATE INDEX "idx_trip_ambulanceType" ON "trips" ("ambulanceType");
CREATE INDEX "idx_trip_pickup_location" ON "trips" ("pickupLatitude", "pickupLongitude");
CREATE INDEX "idx_trip_requestedAt" ON "trips" ("requestedAt");

CREATE TABLE "dispatch_offers" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tripId" UUID NOT NULL REFERENCES "trips"("id") ON DELETE CASCADE,
  "driverId" UUID NOT NULL REFERENCES "drivers"("id") ON DELETE CASCADE,
  "status" "OfferStatus" NOT NULL DEFAULT 'PENDING',
  "distanceToPickupKm" DOUBLE PRECISION,
  "estimatedArrivalMins" DOUBLE PRECISION,
  "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "respondedAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "idx_offer_trip_driver" UNIQUE ("tripId", "driverId")
);

CREATE INDEX "idx_offer_driver_status" ON "dispatch_offers" ("driverId", "status");
CREATE INDEX "idx_offer_expiresAt" ON "dispatch_offers" ("expiresAt");

CREATE TABLE "trip_status_logs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tripId" UUID NOT NULL REFERENCES "trips"("id") ON DELETE CASCADE,
  "status" "TripStatus" NOT NULL,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "notes" TEXT,
  "changedById" UUID,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX "idx_status_log_tripId" ON "trip_status_logs" ("tripId");

CREATE TABLE "driver_location_logs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "driverId" UUID NOT NULL REFERENCES "drivers"("id") ON DELETE CASCADE,
  "tripId" UUID REFERENCES "trips"("id") ON DELETE SET NULL,
  "latitude" DOUBLE PRECISION NOT NULL,
  "longitude" DOUBLE PRECISION NOT NULL,
  "heading" DOUBLE PRECISION,
  "speed" DOUBLE PRECISION,
  "recordedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX "idx_loc_driver_time" ON "driver_location_logs" ("driverId", "recordedAt");
CREATE INDEX "idx_loc_trip_time" ON "driver_location_logs" ("tripId", "recordedAt");

-- =============================================================================
-- 7. INVOICING & PAYMENT RECORDS
-- =============================================================================

CREATE TABLE "invoices" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "invoiceNumber" VARCHAR(100) NOT NULL UNIQUE,
  "tripId" UUID NOT NULL UNIQUE REFERENCES "trips"("id") ON DELETE CASCADE,
  "patientId" UUID NOT NULL REFERENCES "patients"("id"),
  "driverId" UUID NOT NULL REFERENCES "drivers"("id"),
  "baseFare" NUMERIC(10, 2) NOT NULL,
  "distanceFare" NUMERIC(10, 2) NOT NULL,
  "surgeFare" NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  "discountAmount" NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  "taxAmount" NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  "totalAmount" NUMERIC(10, 2) NOT NULL,
  "platformCommission" NUMERIC(10, 2) NOT NULL,
  "driverEarning" NUMERIC(10, 2) NOT NULL,
  "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
  "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'STRIPE',
  "paidAmount" NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  "issuedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "paidAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX "idx_invoice_number" ON "invoices" ("invoiceNumber");
CREATE INDEX "idx_invoice_tripId" ON "invoices" ("tripId");
CREATE INDEX "idx_invoice_patientId" ON "invoices" ("patientId");
CREATE INDEX "idx_invoice_driverId" ON "invoices" ("driverId");
CREATE INDEX "idx_invoice_paymentStatus" ON "invoices" ("paymentStatus");

CREATE TABLE "payment_records" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "invoiceId" UUID NOT NULL REFERENCES "invoices"("id") ON DELETE CASCADE,
  "amount" NUMERIC(10, 2) NOT NULL,
  "paymentGateway" VARCHAR(100),
  "gatewayTransactionId" VARCHAR(255),
  "paymentMethod" "PaymentMethod" NOT NULL,
  "status" "PaymentStatus" NOT NULL,
  "gatewayResponse" JSONB,
  "paidAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX "idx_payment_invoiceId" ON "payment_records" ("invoiceId");
CREATE INDEX "idx_payment_gatewayTxnId" ON "payment_records" ("gatewayTransactionId");
CREATE INDEX "idx_payment_status" ON "payment_records" ("status");

-- =============================================================================
-- 8. DRIVER WALLET & FINANCIAL ACCOUNTING
-- =============================================================================

CREATE TABLE "driver_wallets" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "driverId" UUID NOT NULL UNIQUE REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "balance" NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  "totalEarnings" NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  "totalCommissionPaid" NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  "totalWithdrawn" NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  "currency" VARCHAR(10) NOT NULL DEFAULT 'BDT',
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX "idx_wallet_driverId" ON "driver_wallets" ("driverId");

CREATE TABLE "wallet_transactions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "walletId" UUID NOT NULL REFERENCES "driver_wallets"("id") ON DELETE CASCADE,
  "tripId" UUID REFERENCES "trips"("id") ON DELETE SET NULL,
  "amount" NUMERIC(12, 2) NOT NULL,
  "type" "TransactionType" NOT NULL,
  "direction" "TransactionDirection" NOT NULL,
  "status" "TransactionStatus" NOT NULL DEFAULT 'COMPLETED',
  "balanceAfter" NUMERIC(12, 2) NOT NULL,
  "description" TEXT,
  "referenceId" VARCHAR(255),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX "idx_txn_walletId" ON "wallet_transactions" ("walletId");
CREATE INDEX "idx_txn_tripId" ON "wallet_transactions" ("tripId");
CREATE INDEX "idx_txn_type" ON "wallet_transactions" ("type");
CREATE INDEX "idx_txn_createdAt" ON "wallet_transactions" ("createdAt");

CREATE TABLE "payout_requests" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "driverId" UUID NOT NULL REFERENCES "drivers"("id") ON DELETE CASCADE,
  "walletId" UUID NOT NULL REFERENCES "driver_wallets"("id") ON DELETE CASCADE,
  "amount" NUMERIC(12, 2) NOT NULL,
  "paymentMethod" "PaymentMethod" NOT NULL,
  "accountNumber" VARCHAR(100) NOT NULL,
  "accountDetails" TEXT,
  "status" "PayoutStatus" NOT NULL DEFAULT 'REQUESTED',
  "processedAt" TIMESTAMP WITH TIME ZONE,
  "processedById" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "rejectionReason" TEXT,
  "transactionReference" VARCHAR(255),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX "idx_payout_driverId" ON "payout_requests" ("driverId");
CREATE INDEX "idx_payout_walletId" ON "payout_requests" ("walletId");
CREATE INDEX "idx_payout_status" ON "payout_requests" ("status");

-- =============================================================================
-- 9. REVIEWS & RATINGS
-- =============================================================================

CREATE TABLE "reviews" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tripId" UUID NOT NULL UNIQUE REFERENCES "trips"("id") ON DELETE CASCADE,
  "patientId" UUID NOT NULL REFERENCES "patients"("id"),
  "driverId" UUID NOT NULL REFERENCES "drivers"("id"),
  "rating" INTEGER NOT NULL CHECK ("rating" >= 1 AND "rating" <= 5),
  "comment" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX "idx_review_patientId" ON "reviews" ("patientId");
CREATE INDEX "idx_review_driverId" ON "reviews" ("driverId");
CREATE INDEX "idx_review_rating" ON "reviews" ("rating");

-- =============================================================================
-- 11. NOTIFICATIONS & SYSTEM CONFIGURATION
-- =============================================================================

CREATE TABLE "notifications" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "title" VARCHAR(255) NOT NULL,
  "message" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL DEFAULT 'SYSTEM',
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "link" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX "idx_notification_user_isRead" ON "notifications" ("userId", "isRead");
CREATE INDEX "idx_notification_createdAt" ON "notifications" ("createdAt");

CREATE TABLE "system_settings" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "key" VARCHAR(255) NOT NULL UNIQUE,
  "value" TEXT NOT NULL,
  "description" TEXT,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX "idx_setting_key" ON "system_settings" ("key");
