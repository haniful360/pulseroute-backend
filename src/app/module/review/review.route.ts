import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { ReviewController } from "./review.controller";
import { ReviewValidation } from "./review.validation";

const router = Router();

// Submit review for completed trip
router.post(
  "/",
  auth(Role.USER),
  validateRequest(ReviewValidation.createReviewSchema),
  ReviewController.createReview,
);

// Review histories
router.get(
  "/my-reviews",
  auth(Role.USER, Role.DRIVER),
  ReviewController.getMyReviews,
);

// Public driver review listing
router.get("/driver/:driverId", ReviewController.getDriverReviews);

// Admin review management
router.get("/", auth(Role.SUPER_ADMIN), ReviewController.getAllReviews);

router.delete("/:id", auth(Role.SUPER_ADMIN), ReviewController.deleteReview);

export const ReviewRoutes = router;
