import httpStatus from "http-status";
import {
  PayoutStatus,
  TransactionDirection,
  TransactionStatus,
  TransactionType,
} from "../../../generated/prisma/enums";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { IRequestUser } from "../auth/auth.interface";
import {
  ICreatePayoutRequestPayload,
  IPayoutFilterRequest,
  IProcessPayoutPayload,
  ITransactionFilterRequest,
} from "./wallet.interface";

// Helper to ensure DriverWallet exists
const getOrCreateDriverWallet = async (driverId: string, tx = prisma) => {
  let wallet = await tx.driverWallet.findUnique({
    where: { driverId },
  });

  if (!wallet) {
    wallet = await tx.driverWallet.create({
      data: {
        driverId,
        balance: 0.0,
        totalEarnings: 0.0,
        totalCommissionPaid: 0.0,
        totalWithdrawn: 0.0,
        currency: "BDT",
      },
    });
  }

  return wallet;
};

const getMyWallet = async (authUser: IRequestUser) => {
  const driver = await prisma.driver.findUnique({
    where: { userId: authUser.userId },
  });

  if (!driver || driver.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "Driver profile not found");
  }

  const wallet = await getOrCreateDriverWallet(driver.id);
  return wallet;
};

const getMyTransactions = async (
  authUser: IRequestUser,
  filters: ITransactionFilterRequest,
) => {
  const driver = await prisma.driver.findUnique({
    where: { userId: authUser.userId },
  });

  if (!driver || driver.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "Driver profile not found");
  }

  const wallet = await getOrCreateDriverWallet(driver.id);

  const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
  const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 10;
  const skip = (page - 1) * limit;

  const whereCondition: any = { walletId: wallet.id };
  if (filters.type) {
    whereCondition.type = filters.type;
  }

  const [transactions, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where: whereCondition,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        trip: {
          select: {
            tripCode: true,
            pickupAddress: true,
            destinationAddress: true,
          },
        },
      },
    }),
    prisma.walletTransaction.count({
      where: whereCondition,
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
    data: transactions,
  };
};

// Internal accounting triggered atomically when an invoice is PAID
const processTripPayment = async (tx: any, invoice: any) => {
  const wallet = await getOrCreateDriverWallet(invoice.driverId, tx);
  const totalAmount = Number(invoice.totalAmount);
  const platformCommission = Number(invoice.platformCommission);
  const driverEarning = Number(invoice.driverEarning);
  const currentBalance = Number(wallet.balance);

  if (invoice.paymentMethod === "CASH") {
    // Patient paid cash in person to the driver.
    // Driver holds totalAmount. Platform commission is debited from driver's wallet.
    const newBalance = Number((currentBalance - platformCommission).toFixed(2));

    await tx.driverWallet.update({
      where: { id: wallet.id },
      data: {
        balance: newBalance,
        totalEarnings: { increment: driverEarning },
        totalCommissionPaid: { increment: platformCommission },
      },
    });

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        tripId: invoice.tripId,
        amount: platformCommission,
        type: TransactionType.COMMISSION_DEDUCTION,
        direction: TransactionDirection.DEBIT,
        status: TransactionStatus.COMPLETED,
        balanceAfter: newBalance,
        description: `Platform commission deducted for Cash Trip (${invoice.invoiceNumber})`,
      },
    });
  } else {
    // Online / Stripe payment: money went to platform.
    // Driver wallet is credited with net earnings (totalAmount - commission).
    const newBalance = Number((currentBalance + driverEarning).toFixed(2));

    await tx.driverWallet.update({
      where: { id: wallet.id },
      data: {
        balance: newBalance,
        totalEarnings: { increment: driverEarning },
        totalCommissionPaid: { increment: platformCommission },
      },
    });

    // 1. Credit trip earning record
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        tripId: invoice.tripId,
        amount: totalAmount,
        type: TransactionType.TRIP_EARNING,
        direction: TransactionDirection.CREDIT,
        status: TransactionStatus.COMPLETED,
        balanceAfter: currentBalance + totalAmount,
        description: `Trip earning for Invoice ${invoice.invoiceNumber}`,
      },
    });

    // 2. Debit commission record
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        tripId: invoice.tripId,
        amount: platformCommission,
        type: TransactionType.COMMISSION_DEDUCTION,
        direction: TransactionDirection.DEBIT,
        status: TransactionStatus.COMPLETED,
        balanceAfter: newBalance,
        description: `Platform commission deduction for Invoice ${invoice.invoiceNumber}`,
      },
    });
  }
};

const createPayoutRequest = async (
  authUser: IRequestUser,
  payload: ICreatePayoutRequestPayload,
) => {
  const driver = await prisma.driver.findUnique({
    where: { userId: authUser.userId },
  });

  if (!driver || driver.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "Driver profile not found");
  }

  const wallet = await getOrCreateDriverWallet(driver.id);
  const currentBalance = Number(wallet.balance);

  if (currentBalance < payload.amount) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Insufficient wallet balance. Current balance is BDT ${currentBalance.toFixed(
        2,
      )}, but requested BDT ${payload.amount.toFixed(2)}.`,
    );
  }

  // Prevent multiple simultaneous pending payout requests
  const pendingRequest = await prisma.payoutRequest.findFirst({
    where: {
      driverId: driver.id,
      status: { in: [PayoutStatus.REQUESTED, PayoutStatus.PROCESSING] },
    },
  });

  if (pendingRequest) {
    throw new AppError(
      httpStatus.CONFLICT,
      "You already have a pending payout request in progress. Please await its completion.",
    );
  }

  const payout = await prisma.payoutRequest.create({
    data: {
      driverId: driver.id,
      walletId: wallet.id,
      amount: payload.amount,
      paymentMethod: payload.paymentMethod,
      accountNumber: payload.accountNumber,
      accountDetails: payload.accountDetails,
      status: PayoutStatus.REQUESTED,
    },
  });

  return payout;
};

const getAllPayoutRequests = async (filters: IPayoutFilterRequest) => {
  const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
  const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 10;
  const skip = (page - 1) * limit;

  const sortBy = filters.sortBy || "createdAt";
  const sortOrder = filters.sortOrder === "asc" ? "asc" : "desc";

  const whereCondition: any = {};
  if (filters.status) {
    whereCondition.status = filters.status;
  }

  const [payouts, total] = await Promise.all([
    prisma.payoutRequest.findMany({
      where: whereCondition,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
            contactNumber: true,
          },
        },
        wallet: true,
      },
    }),
    prisma.payoutRequest.count({
      where: whereCondition,
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
    data: payouts,
  };
};

const processPayoutRequest = async (
  adminUser: IRequestUser,
  payoutId: string,
  payload: IProcessPayoutPayload,
) => {
  const payout = await prisma.payoutRequest.findUnique({
    where: { id: payoutId },
    include: { wallet: true },
  });

  if (!payout) {
    throw new AppError(httpStatus.NOT_FOUND, "Payout request not found");
  }

  if (
    payout.status === PayoutStatus.APPROVED ||
    payout.status === PayoutStatus.REJECTED
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Payout request has already been ${payout.status}. Cannot modify further.`,
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const amount = Number(payout.amount);
    const currentBalance = Number(payout.wallet.balance);

    if (payload.status === PayoutStatus.APPROVED) {
      if (currentBalance < amount) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `Cannot approve payout. Driver wallet balance is BDT ${currentBalance.toFixed(
            2,
          )}, which is lower than requested BDT ${amount.toFixed(2)}.`,
        );
      }

      const newBalance = Number((currentBalance - amount).toFixed(2));

      // 1. Deduct balance and update total withdrawn
      await tx.driverWallet.update({
        where: { id: payout.walletId },
        data: {
          balance: newBalance,
          totalWithdrawn: { increment: amount },
        },
      });

      // 2. Ledger record
      await tx.walletTransaction.create({
        data: {
          walletId: payout.walletId,
          amount,
          type: TransactionType.PAYOUT_WITHDRAWAL,
          direction: TransactionDirection.DEBIT,
          status: TransactionStatus.COMPLETED,
          balanceAfter: newBalance,
          description: `Withdrawal payout via ${payout.paymentMethod} to ${payout.accountNumber}`,
          referenceId: payload.transactionReference,
        },
      });
    }

    // 3. Update Payout Request status
    const updatedPayout = await tx.payoutRequest.update({
      where: { id: payoutId },
      data: {
        status: payload.status,
        processedById: adminUser.userId,
        processedAt: new Date(),
        rejectionReason:
          payload.status === PayoutStatus.REJECTED
            ? payload.rejectionReason ||
              "Withdrawal request rejected by administration"
            : null,
        transactionReference: payload.transactionReference,
      },
    });

    return updatedPayout;
  });

  return result;
};

export const WalletService = {
  getMyWallet,
  getMyTransactions,
  processTripPayment,
  createPayoutRequest,
  getAllPayoutRequests,
  processPayoutRequest,
};
