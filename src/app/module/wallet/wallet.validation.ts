import { z } from "zod";
import { PaymentMethod, PayoutStatus } from "../../../generated/prisma/enums";

const createPayoutRequestSchema = z.object({
  amount: z
    .number({ message: "Payout amount is required" })
    .positive("Payout amount must be greater than 0")
    .min(100, "Minimum withdrawal amount is 100 BDT"),
  paymentMethod: z.enum([PaymentMethod.CASH, PaymentMethod.STRIPE], {
    message: "Payment method must be CASH or STRIPE",
  }),
  accountNumber: z
    .string({ message: "Account number / Mobile banking number is required" })
    .min(5, "Account number must be at least 5 digits"),
  accountDetails: z.string().optional(),
});

const processPayoutSchema = z.object({
  status: z.enum([
    PayoutStatus.APPROVED,
    PayoutStatus.REJECTED,
    PayoutStatus.PROCESSING,
  ]),
  transactionReference: z.string().optional(),
  rejectionReason: z.string().optional(),
});

export const WalletValidation = {
  createPayoutRequestSchema,
  processPayoutSchema,
};

