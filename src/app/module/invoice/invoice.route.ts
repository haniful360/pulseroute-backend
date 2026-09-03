import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { InvoiceController } from "./invoice.controller";
import { InvoiceValidation } from "./invoice.validation";

const router = Router();

// Invoice generation for completed trips
router.post(
  "/generate/:tripId",
  auth(Role.USER, Role.DRIVER, Role.SUPER_ADMIN),
  InvoiceController.generateInvoiceForTrip
);

// User and driver invoice histories
router.get(
  "/my-invoices",
  auth(Role.USER, Role.DRIVER),
  InvoiceController.getMyInvoices
);

// Admin oversight
router.get(
  "/",
  auth(Role.SUPER_ADMIN),
  InvoiceController.getAllInvoices
);

// Specific invoice operations
router.get(
  "/:id",
  auth(Role.USER, Role.DRIVER, Role.SUPER_ADMIN),
  InvoiceController.getInvoiceById
);

router.patch(
  "/:id/pay",
  auth(Role.USER, Role.DRIVER, Role.SUPER_ADMIN),
  validateRequest(InvoiceValidation.payInvoiceSchema),
  InvoiceController.payInvoice
);

export const InvoiceRoutes = router;

