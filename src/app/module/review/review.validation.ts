import { z } from "zod";

const createReviewSchema = z.object({
  tripId: z.string({ message: "Trip ID is required" }),
  rating: z
    .number({ message: "Rating is required" })
    .int("Rating must be an integer between 1 and 5")
    .min(1, "Rating must be at least 1 star")
    .max(5, "Rating cannot exceed 5 stars"),
  comment: z.string().optional(),
});

export const ReviewValidation = {
  createReviewSchema,
};
