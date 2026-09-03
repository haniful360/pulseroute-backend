import httpStatus from "http-status";
import Stripe from "stripe";
import {
  PaymentMethod,
  PaymentStatus,
  Role,
} from "../../../generated/prisma/enums";
import config from "../../config";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { stripe } from "../../lib/stripe";
import { IRequestUser } from "../auth/auth.interface";
import { WalletService } from "../wallet/wallet.service";

const createPaymentIntent = async (
  authUser: IRequestUser,
  invoiceId: string,
) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { trip: true },
  });

  if (!invoice) {
    throw new AppError(httpStatus.NOT_FOUND, "Invoice not found");
  }

  if (invoice.paymentStatus === PaymentStatus.PAID) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This invoice has already been paid and settled.",
    );
  }

  // Verify access permission
  if (authUser.role === Role.USER) {
    const patient = await prisma.patient.findUnique({
      where: { userId: authUser.userId },
    });
    if (!patient || patient.id !== invoice.patientId) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You do not have authorization to pay this invoice",
      );
    }
  }

  // Amount in subunit (paisa / cents)
  const amountSubunit = Math.round(Number(invoice.totalAmount) * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountSubunit,
    currency: "bdt",
    metadata: {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      tripId: invoice.tripId,
      patientId: invoice.patientId,
      driverId: invoice.driverId,
    },
    automatic_payment_methods: {
      enabled: true,
    },
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    amount: Number(invoice.totalAmount),
    currency: "bdt",
    invoiceNumber: invoice.invoiceNumber,
  };
};

const confirmPayment = async (
  authUser: IRequestUser,
  invoiceId: string,
  paymentIntentId: string,
) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
  });

  if (!invoice) {
    throw new AppError(httpStatus.NOT_FOUND, "Invoice not found");
  }

  if (invoice.paymentStatus === PaymentStatus.PAID) {
    return invoice;
  }

  // Verify authorization
  if (authUser.role === Role.USER) {
    const patient = await prisma.patient.findUnique({
      where: { userId: authUser.userId },
    });
    if (!patient || patient.id !== invoice.patientId) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You do not have authorization to settle this invoice",
      );
    }
  }

  // Retrieve payment intent directly from Stripe
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (intent.status !== "succeeded") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Payment has not succeeded yet. Current Stripe status is '${intent.status}'.`,
    );
  }

  if (intent.metadata.invoiceId && intent.metadata.invoiceId !== invoice.id) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Payment intent metadata does not match this invoice.",
    );
  }

  const now = new Date();

  const settledInvoice = await prisma.$transaction(async (tx) => {
    // 1. Update Invoice
    const updated = await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: PaymentMethod.STRIPE,
        paidAmount: invoice.totalAmount,
        paidAt: now,
      },
      include: {
        paymentRecords: true,
      },
    });

    // 2. Create Payment Record
    await tx.paymentRecord.create({
      data: {
        invoiceId: invoice.id,
        amount: invoice.totalAmount,
        paymentGateway: "STRIPE",
        gatewayTransactionId: paymentIntentId,
        paymentMethod: PaymentMethod.STRIPE,
        status: PaymentStatus.PAID,
        gatewayResponse: intent as any,
        paidAt: now,
      },
    });

    // 3. Trigger Driver Wallet Accounting
    await WalletService.processTripPayment(tx, updated);

    return updated;
  });

  return settledInvoice;
};

const handleWebhook = async (rawPayload: Buffer, signature: string) => {
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawPayload,
      signature,
      config.stripe_webhook_secret,
    );
  } catch (err: any) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Webhook signature verification failed: ${err.message}`,
    );
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const invoiceId = intent.metadata?.invoiceId;

    if (invoiceId) {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
      });

      if (invoice && invoice.paymentStatus !== PaymentStatus.PAID) {
        const now = new Date();

        await prisma.$transaction(async (tx) => {
          const updated = await tx.invoice.update({
            where: { id: invoice.id },
            data: {
              paymentStatus: PaymentStatus.PAID,
              paymentMethod: PaymentMethod.STRIPE,
              paidAmount: invoice.totalAmount,
              paidAt: now,
            },
          });

          await tx.paymentRecord.create({
            data: {
              invoiceId: invoice.id,
              amount: invoice.totalAmount,
              paymentGateway: "STRIPE",
              gatewayTransactionId: intent.id,
              paymentMethod: PaymentMethod.STRIPE,
              status: PaymentStatus.PAID,
              gatewayResponse: intent as any,
              paidAt: now,
            },
          });

          await WalletService.processTripPayment(tx, updated);
        });
      }
    }
  }

  return { received: true };
};

export const PaymentService = {
  createPaymentIntent,
  confirmPayment,
  handleWebhook,
};
