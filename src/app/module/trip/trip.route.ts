import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { TripController } from "./trip.controller";
import { TripValidation } from "./trip.validation";

const router = Router();

// Patient ambulance request
router.post(
  "/",
  auth(Role.USER, Role.SUPER_ADMIN),
  validateRequest(TripValidation.createTripSchema),
  TripController.createTripRequest,
);

// Driver dispatch offers
router.get("/offers/my-offers", auth(Role.DRIVER), TripController.getMyOffers);

router.patch(
  "/offers/:offerId/accept",
  auth(Role.DRIVER),
  TripController.acceptDispatchOffer,
);

router.patch(
  "/offers/:offerId/reject",
  auth(Role.DRIVER),
  TripController.rejectDispatchOffer,
);

// History & Monitoring
router.get(
  "/my-trips",
  auth(Role.USER, Role.DRIVER),
  TripController.getMyTrips,
);

router.get("/", auth(Role.SUPER_ADMIN), TripController.getAllTrips);

// Specific trip operations
router.get(
  "/:id",
  auth(Role.USER, Role.DRIVER, Role.SUPER_ADMIN),
  TripController.getTripById,
);

router.patch(
  "/:id/status",
  auth(Role.DRIVER),
  validateRequest(TripValidation.updateTripStatusSchema),
  TripController.updateTripStatus,
);

router.patch(
  "/:id/cancel",
  auth(Role.USER, Role.DRIVER, Role.SUPER_ADMIN),
  validateRequest(TripValidation.cancelTripSchema),
  TripController.cancelTrip,
);

export const TripRoutes = router;
