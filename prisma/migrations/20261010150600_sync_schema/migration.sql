-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('TRIP', 'PAYMENT', 'WALLET', 'ACCOUNT', 'SYSTEM');

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentMethod_new" AS ENUM ('STRIPE');
ALTER TABLE "public"."invoices" ALTER COLUMN "paymentMethod" DROP DEFAULT;
ALTER TABLE "invoices" ALTER COLUMN "paymentMethod" TYPE "PaymentMethod_new" USING ("paymentMethod"::text::"PaymentMethod_new");
ALTER TABLE "payment_records" ALTER COLUMN "paymentMethod" TYPE "PaymentMethod_new" USING ("paymentMethod"::text::"PaymentMethod_new");
ALTER TABLE "payout_requests" ALTER COLUMN "paymentMethod" TYPE "PaymentMethod_new" USING ("paymentMethod"::text::"PaymentMethod_new");
ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";
DROP TYPE "public"."PaymentMethod_old";
ALTER TABLE "invoices" ALTER COLUMN "paymentMethod" SET DEFAULT 'STRIPE';
COMMIT;

-- AlterTable
ALTER TABLE "drivers" ADD COLUMN     "licensePhotoUrl" TEXT,
ADD COLUMN     "licensePhotos" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "nidPhotoUrl" TEXT,
ADD COLUMN     "nidPhotos" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "invoices" ALTER COLUMN "paymentMethod" SET DEFAULT 'STRIPE';

-- AlterTable
ALTER TABLE "patients" DROP COLUMN "emergencyContactName",
ADD COLUMN     "emergencyContactNumber" TEXT,
ADD COLUMN     "profilePhoto" TEXT;

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "photoUrl" TEXT,
ADD COLUMN     "photos" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'SYSTEM',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_notification_user_isRead" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "idx_notification_createdAt" ON "notifications"("createdAt");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
