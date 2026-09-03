import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { WalletController } from "./wallet.controller";
import { WalletValidation } from "./wallet.validation";

const router = Router();

// Driver wallet endpoints
router.get("/my-wallet", auth(Role.DRIVER), WalletController.getMyWallet);

router.get(
  "/my-transactions",
  auth(Role.DRIVER),
  WalletController.getMyTransactions,
);

router.get(
  "/statement/export",
  auth(Role.DRIVER),
  WalletController.exportDriverStatement,
);

router.post(
  "/payout-request",
  auth(Role.DRIVER),
  validateRequest(WalletValidation.createPayoutRequestSchema),
  WalletController.createPayoutRequest,
);

// Admin payout processing endpoints
router.get(
  "/admin/payouts",
  auth(Role.SUPER_ADMIN),
  WalletController.getAllPayoutRequests,
);

router.patch(
  "/admin/payouts/:id",
  auth(Role.SUPER_ADMIN),
  validateRequest(WalletValidation.processPayoutSchema),
  WalletController.processPayoutRequest,
);

export const WalletRoutes = router;
