-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'DRIVER', 'USER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'BLOCKED', 'DELETED', 'PENDING_APPROVAL');

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('LOCAL', 'GOOGLE');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "DriverVerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "DutyStatus" AS ENUM ('ONLINE', 'OFFLINE', 'ON_TRIP', 'BUSY');

-- CreateEnum
CREATE TYPE "AmbulanceType" AS ENUM ('BASIC', 'AC', 'ICU', 'CCU', 'FREEZER', 'NEONATAL');

-- CreateEnum
CREATE TYPE "VehicleVerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('REQUESTED', 'ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EmergencySeverity" AS ENUM ('CRITICAL', 'HIGH', 'MODERATE', 'LOW');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PENDING', 'PAID', 'REFUNDED', 'FAILED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('STRIPE', 'CASH');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('TRIP_EARNING', 'COMMISSION_DEDUCTION', 'PAYOUT_WITHDRAWAL', 'BONUS', 'PENALTY', 'REFUND');

-- CreateEnum
CREATE TYPE "TransactionDirection" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('REQUESTED', 'PROCESSING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "orgEmail" TEXT,
    "contactNumber" TEXT,
    "department" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drivers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "licenseExpiry" TIMESTAMP(3),
    "nidNumber" TEXT,
    "experienceYears" INTEGER NOT NULL DEFAULT 0,
    "verificationStatus" "DriverVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "rejectionReason" TEXT,
    "dutyStatus" "DutyStatus" NOT NULL DEFAULT 'OFFLINE',
    "currentLatitude" DOUBLE PRECISION,
    "currentLongitude" DOUBLE PRECISION,
    "currentHeading" DOUBLE PRECISION,
    "lastLocationUpdate" TIMESTAMP(3),
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "totalTrips" INTEGER NOT NULL DEFAULT 0,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "currentVehicleId" TEXT,

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "baseFare" DECIMAL(10,2) NOT NULL,
    "distanceFare" DECIMAL(10,2) NOT NULL,
    "surgeFare" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "platformCommission" DECIMAL(10,2) NOT NULL,
    "driverEarning" DECIMAL(10,2) NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "paidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_records" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentGateway" TEXT,
    "gatewayTransactionId" TEXT,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "gatewayResponse" JSONB,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "contactNumber" TEXT,
    "address" TEXT,
    "emergencyContactName" TEXT,
    "bloodGroup" TEXT,
    "gender" "Gender",
    "dateOfBirth" TIMESTAMP(3),
    "medicalHistory" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_configs" (
    "id" TEXT NOT NULL,
    "ambulanceType" "AmbulanceType" NOT NULL,
    "baseFare" DECIMAL(10,2) NOT NULL,
    "perKmRate" DECIMAL(10,2) NOT NULL,
    "perMinuteRate" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "platformCommissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.12,
    "nightSurgeMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.00,
    "emergencySurgeMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.00,
    "minFare" DECIMAL(10,2) NOT NULL,
    "cancellationFee" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driver_location_logs" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "tripId" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "heading" DOUBLE PRECISION,
    "speed" DOUBLE PRECISION,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "driver_location_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips" (
    "id" TEXT NOT NULL,
    "tripCode" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "driverId" TEXT,
    "vehicleId" TEXT,
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
    "estimatedFare" DECIMAL(10,2),
    "patientNotes" TEXT,
    "cancellationReason" TEXT,
    "cancelledById" TEXT,
    "cancelledByRole" "Role",
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "enRouteAt" TIMESTAMP(3),
    "arrivedAt" TIMESTAMP(3),
    "inTransitAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispatch_offers" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "status" "OfferStatus" NOT NULL DEFAULT 'PENDING',
    "distanceToPickupKm" DOUBLE PRECISION,
    "estimatedArrivalMins" DOUBLE PRECISION,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispatch_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_status_logs" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "status" "TripStatus" NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "notes" TEXT,
    "changedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_status_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "googleId" TEXT,
    "authProvider" "AuthProvider" NOT NULL DEFAULT 'LOCAL',
    "phone" TEXT,
    "avatarUrl" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "needPasswordChange" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "ambulanceType" "AmbulanceType" NOT NULL,
    "vehicleNumber" TEXT NOT NULL,
    "model" TEXT,
    "manufacturer" TEXT,
    "year" INTEGER,
    "hasOxygen" BOOLEAN NOT NULL DEFAULT true,
    "hasVentilator" BOOLEAN NOT NULL DEFAULT false,
    "hasDefibrillator" BOOLEAN NOT NULL DEFAULT false,
    "hasSuctionMachine" BOOLEAN NOT NULL DEFAULT false,
    "equipmentDetails" TEXT,
    "verificationStatus" "VehicleVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "rejectionReason" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driver_wallets" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "totalEarnings" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "totalCommissionPaid" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "totalWithdrawn" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "driver_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "tripId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "type" "TransactionType" NOT NULL,
    "direction" "TransactionDirection" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'COMPLETED',
    "balanceAfter" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_requests" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountDetails" TEXT,
    "status" "PayoutStatus" NOT NULL DEFAULT 'REQUESTED',
    "processedAt" TIMESTAMP(3),
    "processedById" TEXT,
    "rejectionReason" TEXT,
    "transactionReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payout_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admins_userId_key" ON "admins"("userId");

-- CreateIndex
CREATE INDEX "idx_admin_email" ON "admins"("email");

-- CreateIndex
CREATE INDEX "idx_admin_isDeleted" ON "admins"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_email_key" ON "drivers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_licenseNumber_key" ON "drivers"("licenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_userId_key" ON "drivers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_currentVehicleId_key" ON "drivers"("currentVehicleId");

-- CreateIndex
CREATE INDEX "idx_driver_email" ON "drivers"("email");

-- CreateIndex
CREATE INDEX "idx_driver_contact" ON "drivers"("contactNumber");

-- CreateIndex
CREATE INDEX "idx_driver_license" ON "drivers"("licenseNumber");

-- CreateIndex
CREATE INDEX "idx_driver_verification" ON "drivers"("verificationStatus");

-- CreateIndex
CREATE INDEX "idx_driver_dutyStatus" ON "drivers"("dutyStatus");

-- CreateIndex
CREATE INDEX "idx_driver_location" ON "drivers"("currentLatitude", "currentLongitude");

-- CreateIndex
CREATE INDEX "idx_driver_isDeleted" ON "drivers"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_tripId_key" ON "invoices"("tripId");

-- CreateIndex
CREATE INDEX "idx_invoice_number" ON "invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX "idx_invoice_tripId" ON "invoices"("tripId");

-- CreateIndex
CREATE INDEX "idx_invoice_patientId" ON "invoices"("patientId");

-- CreateIndex
CREATE INDEX "idx_invoice_driverId" ON "invoices"("driverId");

-- CreateIndex
CREATE INDEX "idx_invoice_paymentStatus" ON "invoices"("paymentStatus");

-- CreateIndex
CREATE INDEX "idx_payment_invoiceId" ON "payment_records"("invoiceId");

-- CreateIndex
CREATE INDEX "idx_payment_gatewayTxnId" ON "payment_records"("gatewayTransactionId");

-- CreateIndex
CREATE INDEX "idx_payment_status" ON "payment_records"("status");

-- CreateIndex
CREATE UNIQUE INDEX "patients_email_key" ON "patients"("email");

-- CreateIndex
CREATE UNIQUE INDEX "patients_userId_key" ON "patients"("userId");

-- CreateIndex
CREATE INDEX "idx_patient_email" ON "patients"("email");

-- CreateIndex
CREATE INDEX "idx_patient_contact" ON "patients"("contactNumber");

-- CreateIndex
CREATE INDEX "idx_patient_isDeleted" ON "patients"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "pricing_configs_ambulanceType_key" ON "pricing_configs"("ambulanceType");

-- CreateIndex
CREATE INDEX "idx_pricing_ambulanceType" ON "pricing_configs"("ambulanceType");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_tripId_key" ON "reviews"("tripId");

-- CreateIndex
CREATE INDEX "idx_review_patientId" ON "reviews"("patientId");

-- CreateIndex
CREATE INDEX "idx_review_driverId" ON "reviews"("driverId");

-- CreateIndex
CREATE INDEX "idx_review_rating" ON "reviews"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE INDEX "idx_setting_key" ON "system_settings"("key");

-- CreateIndex
CREATE INDEX "idx_loc_driver_time" ON "driver_location_logs"("driverId", "recordedAt");

-- CreateIndex
CREATE INDEX "idx_loc_trip_time" ON "driver_location_logs"("tripId", "recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "trips_tripCode_key" ON "trips"("tripCode");

-- CreateIndex
CREATE INDEX "idx_trip_patientId" ON "trips"("patientId");

-- CreateIndex
CREATE INDEX "idx_trip_driverId" ON "trips"("driverId");

-- CreateIndex
CREATE INDEX "idx_trip_vehicleId" ON "trips"("vehicleId");

-- CreateIndex
CREATE INDEX "idx_trip_status" ON "trips"("status");

-- CreateIndex
CREATE INDEX "idx_trip_ambulanceType" ON "trips"("ambulanceType");

-- CreateIndex
CREATE INDEX "idx_trip_pickup_location" ON "trips"("pickupLatitude", "pickupLongitude");

-- CreateIndex
CREATE INDEX "idx_trip_requestedAt" ON "trips"("requestedAt");

-- CreateIndex
CREATE INDEX "idx_offer_driver_status" ON "dispatch_offers"("driverId", "status");

-- CreateIndex
CREATE INDEX "idx_offer_expiresAt" ON "dispatch_offers"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "dispatch_offers_tripId_driverId_key" ON "dispatch_offers"("tripId", "driverId");

-- CreateIndex
CREATE INDEX "idx_status_log_tripId" ON "trip_status_logs"("tripId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- CreateIndex
CREATE INDEX "idx_user_email" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_user_googleId" ON "users"("googleId");

-- CreateIndex
CREATE INDEX "idx_user_role" ON "users"("role");

-- CreateIndex
CREATE INDEX "idx_user_status" ON "users"("status");

-- CreateIndex
CREATE INDEX "idx_user_isDeleted" ON "users"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_vehicleNumber_key" ON "vehicles"("vehicleNumber");

-- CreateIndex
CREATE INDEX "idx_vehicle_driverId" ON "vehicles"("driverId");

-- CreateIndex
CREATE INDEX "idx_vehicle_number" ON "vehicles"("vehicleNumber");

-- CreateIndex
CREATE INDEX "idx_vehicle_type" ON "vehicles"("ambulanceType");

-- CreateIndex
CREATE INDEX "idx_vehicle_verification" ON "vehicles"("verificationStatus");

-- CreateIndex
CREATE INDEX "idx_vehicle_isDeleted" ON "vehicles"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "driver_wallets_driverId_key" ON "driver_wallets"("driverId");

-- CreateIndex
CREATE INDEX "idx_wallet_driverId" ON "driver_wallets"("driverId");

-- CreateIndex
CREATE INDEX "idx_txn_walletId" ON "wallet_transactions"("walletId");

-- CreateIndex
CREATE INDEX "idx_txn_tripId" ON "wallet_transactions"("tripId");

-- CreateIndex
CREATE INDEX "idx_txn_type" ON "wallet_transactions"("type");

-- CreateIndex
CREATE INDEX "idx_txn_createdAt" ON "wallet_transactions"("createdAt");

-- CreateIndex
CREATE INDEX "idx_payout_driverId" ON "payout_requests"("driverId");

-- CreateIndex
CREATE INDEX "idx_payout_walletId" ON "payout_requests"("walletId");

-- CreateIndex
CREATE INDEX "idx_payout_status" ON "payout_requests"("status");

-- AddForeignKey
ALTER TABLE "admins" ADD CONSTRAINT "admins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_currentVehicleId_fkey" FOREIGN KEY ("currentVehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_records" ADD CONSTRAINT "payment_records_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_location_logs" ADD CONSTRAINT "driver_location_logs_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_location_logs" ADD CONSTRAINT "driver_location_logs_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatch_offers" ADD CONSTRAINT "dispatch_offers_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatch_offers" ADD CONSTRAINT "dispatch_offers_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_status_logs" ADD CONSTRAINT "trip_status_logs_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_wallets" ADD CONSTRAINT "driver_wallets_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "driver_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "driver_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
