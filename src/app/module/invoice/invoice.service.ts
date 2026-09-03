import httpStatus from "http-status";
import {
  PaymentMethod,
  PaymentStatus,
  Role,
} from "../../../generated/prisma/enums";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { IRequestUser } from "../auth/auth.interface";
import { WalletService } from "../wallet/wallet.service";
import { IInvoiceFilterRequest, IPayInvoicePayload } from "./invoice.interface";

// Generates human-readable invoice reference code (e.g. INV-20260903-XXXX)
function generateInvoiceNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${dateStr}-${randomSuffix}`;
}

const generateInvoiceForTrip = async (tripId: string) => {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      invoice: true,
      driver: true,
    },
  });

  if (!trip) {
    throw new AppError(httpStatus.NOT_FOUND, "Trip not found");
  }

  // If trip already has an existing invoice, return it
  if (trip.invoice) {
    return trip.invoice;
  }

  if (!trip.driverId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Cannot generate an invoice for a trip without an assigned driver.",
    );
  }

  // Get pricing rules for commission calculation
  const pricingConfig = await prisma.pricingConfig.findUnique({
    where: { ambulanceType: trip.ambulanceType },
  });

  const baseFare = Number(pricingConfig?.baseFare || 500.0);
  const distanceFare = Number(
    (
      (trip.distanceKm || 1.0) * Number(pricingConfig?.perKmRate || 50.0)
    ).toFixed(2),
  );
  const totalAmount = trip.estimatedFare
    ? Number(trip.estimatedFare)
    : Number((baseFare + distanceFare).toFixed(2));

  const commissionRate = pricingConfig?.platformCommissionRate || 0.12;
  const platformCommission = Number((totalAmount * commissionRate).toFixed(2));
  const driverEarning = Number((totalAmount - platformCommission).toFixed(2));

  const invoiceNumber = generateInvoiceNumber();

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      tripId: trip.id,
      patientId: trip.patientId,
      driverId: trip.driverId,
      baseFare,
      distanceFare,
      totalAmount,
      platformCommission,
      driverEarning,
      paymentStatus: PaymentStatus.UNPAID,
      paymentMethod: PaymentMethod.CASH,
    },
    include: {
      trip: {
        select: {
          tripCode: true,
          pickupAddress: true,
          destinationAddress: true,
        },
      },
    },
  });

  return invoice;
};

const payInvoice = async (
  authUser: IRequestUser,
  invoiceId: string,
  payload: IPayInvoicePayload,
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
      "This invoice has already been settled and marked as PAID.",
    );
  }

  // Permission: Patient of invoice, Driver of invoice, or Admin can confirm settlement
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
  } else if (authUser.role === Role.DRIVER) {
    const driver = await prisma.driver.findUnique({
      where: { userId: authUser.userId },
    });
    if (!driver || driver.id !== invoice.driverId) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You do not have authorization to settle this invoice",
      );
    }
  }

  const paidAmount = payload.paidAmount || Number(invoice.totalAmount);
  const now = new Date();

  const updatedInvoice = await prisma.$transaction(async (tx) => {
    // 1. Update Invoice Status
    const settled = await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: payload.paymentMethod,
        paidAmount,
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
        amount: paidAmount,
        paymentMethod: payload.paymentMethod,
        status: PaymentStatus.PAID,
        paymentGateway:
          payload.paymentGateway ||
          (payload.paymentMethod === PaymentMethod.STRIPE
            ? "STRIPE"
            : "CASH_IN_HAND"),
        gatewayTransactionId: payload.gatewayTransactionId,
        paidAt: now,
      },
    });

    // 3. Trigger Driver Wallet Accounting
    await WalletService.processTripPayment(tx, settled);

    return settled;
  });

  return updatedInvoice;
};

const getInvoiceById = async (authUser: IRequestUser, id: string) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      trip: true,
      patient: {
        select: {
          id: true,
          name: true,
          email: true,
          contactNumber: true,
        },
      },
      driver: {
        select: {
          id: true,
          name: true,
          contactNumber: true,
          licenseNumber: true,
        },
      },
      paymentRecords: true,
    },
  });

  if (!invoice) {
    throw new AppError(httpStatus.NOT_FOUND, "Invoice not found");
  }

  // Role access validation
  if (authUser.role === Role.USER) {
    const patient = await prisma.patient.findUnique({
      where: { userId: authUser.userId },
    });
    if (!patient || patient.id !== invoice.patientId) {
      throw new AppError(httpStatus.FORBIDDEN, "Access denied to this invoice");
    }
  } else if (authUser.role === Role.DRIVER) {
    const driver = await prisma.driver.findUnique({
      where: { userId: authUser.userId },
    });
    if (!driver || driver.id !== invoice.driverId) {
      throw new AppError(httpStatus.FORBIDDEN, "Access denied to this invoice");
    }
  }

  return invoice;
};

const getMyInvoices = async (authUser: IRequestUser) => {
  if (authUser.role === Role.USER) {
    const patient = await prisma.patient.findUnique({
      where: { userId: authUser.userId },
    });
    if (!patient) return [];

    return prisma.invoice.findMany({
      where: { patientId: patient.id },
      include: {
        trip: {
          select: {
            tripCode: true,
            pickupAddress: true,
            destinationAddress: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } else if (authUser.role === Role.DRIVER) {
    const driver = await prisma.driver.findUnique({
      where: { userId: authUser.userId },
    });
    if (!driver) return [];

    return prisma.invoice.findMany({
      where: { driverId: driver.id },
      include: {
        trip: {
          select: {
            tripCode: true,
            pickupAddress: true,
            destinationAddress: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  return [];
};

const getAllInvoices = async (filters: IInvoiceFilterRequest) => {
  const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
  const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 10;
  const skip = (page - 1) * limit;

  const sortBy = filters.sortBy || "createdAt";
  const sortOrder = filters.sortOrder === "asc" ? "asc" : "desc";

  const andConditions: any[] = [];

  if (filters.searchTerm) {
    andConditions.push({
      invoiceNumber: { contains: filters.searchTerm, mode: "insensitive" },
    });
  }

  if (filters.paymentStatus) {
    andConditions.push({ paymentStatus: filters.paymentStatus });
  }

  if (filters.paymentMethod) {
    andConditions.push({ paymentMethod: filters.paymentMethod });
  }

  const whereCondition = andConditions.length > 0 ? { AND: andConditions } : {};

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where: whereCondition,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        patient: { select: { name: true, contactNumber: true } },
        driver: { select: { name: true, contactNumber: true } },
      },
    }),
    prisma.invoice.count({
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
    data: invoices,
  };
};

export const InvoiceService = {
  generateInvoiceForTrip,
  payInvoice,
  getInvoiceById,
  getMyInvoices,
  getAllInvoices,
};
