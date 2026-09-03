import { NotificationType } from "../../../generated/prisma/enums";

export interface ICreateNotificationPayload {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;
  metadata?: Record<string, any>;
}

export interface INotificationFilter {
  isRead?: boolean;
  type?: NotificationType;
  page?: number;
  limit?: number;
}
