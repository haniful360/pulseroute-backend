import { z } from "zod";
import { PaymentMethod, PayoutStatus } from "../../../generated/prisma/enums";

const createPayoutRequestSchema = z.object({
  amount: z.preprocess(
    (val) => (val !== undefined && val !== "" ? Number(val) : val),
    z
      .number({ message: "Payout amount is required" })
      .positive("Payout amount must be greater than 0")
      .min(100, "Minimum withdrawal amount is 100 BDT"),
  ),
  paymentMethod: z
    .literal(PaymentMethod.STRIPE, {
      message: "Payment method must be STRIPE",
    })
    .default(PaymentMethod.STRIPE)
    .optional(),
  accountNumber: z
    .string()
    .min(3, "Account number must be at least 3 characters")
    .optional(),
  accountDetails: z.string().optional(),
  notes: z.string().optional(),
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
