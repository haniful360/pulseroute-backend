export interface ICreateReviewPayload {
  tripId: string;
  rating: number;
  comment?: string;
}

export interface IReviewFilterRequest {
  rating?: string | number;
  driverId?: string;
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
