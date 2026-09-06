import http from "http";
import jwt from "jsonwebtoken";
import { Server, Socket } from "socket.io";
import config from "../config";
import { IRequestUser } from "../module/auth/auth.interface";

let io: Server | null = null;

export const initSocket = (server: http.Server): Server => {
  io = new Server(server, {
    cors: {
      origin: config.frontend_url || "http://localhost:3000",
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  // JWT Authentication middleware for Socket connections
  io.use((socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "");

      if (token) {
        const decoded = jwt.verify(
          token,
          config.jwt_access_secret,
        ) as IRequestUser;
        socket.data.user = decoded;
      }
      next();
    } catch {
      // Connect as guest or unauthenticated user
      next();
    }
  });

  io.on("connection", (socket: Socket) => {
    const user = socket.data.user as IRequestUser | undefined;

    if (user) {
      // 1. Join user's private notification room
      socket.join(user.userId);

      // 2. Join role broadcast room (e.g. role:DRIVER, role:SUPER_ADMIN)
      socket.join(`role:${user.role}`);
    }

    // 3. Join a specific trip room for live tracking
    socket.on("trip:join", (tripId: string) => {
      if (tripId) {
        socket.join(`trip:${tripId}`);
      }
    });

    // 4. Leave trip room
    socket.on("trip:leave", (tripId: string) => {
      if (tripId) {
        socket.leave(`trip:${tripId}`);
      }
    });

    // 5. Driver live GPS location broadcasting
    socket.on(
      "driver:location-update",
      (data: {
        tripId?: string;
        latitude: number;
        longitude: number;
        heading?: number;
        speed?: number;
      }) => {
        if (data.tripId) {
          // Broadcast live coordinates to patient in the trip room
          socket.to(`trip:${data.tripId}`).emit("trip:location-updated", data);
        }
      },
    );

    // 6. Real-Time Chat message submission via socket
    socket.on(
      "chat:send-message",
      async (data: { tripId: string; message: string }) => {
        if (user && data.tripId && data.message) {
          try {
            const { ChatService } = await import("../module/chat/chat.service");
            await ChatService.sendMessage(user, data.tripId, data.message);
          } catch (err: any) {
            socket.emit("chat:error", { message: err.message });
          }
        }
      },
    );

    // 7. Live typing indicator
    socket.on("chat:typing", (data: { tripId: string; isTyping: boolean }) => {
      if (data.tripId && user) {
        socket.to(`trip:${data.tripId}`).emit("chat:user-typing", {
          userId: user.userId,
          userName: user.name || "Participant",
          isTyping: data.isTyping,
        });
      }
    });

    socket.on("disconnect", () => {
      // Clean disconnect
    });
  });

  return io;
};

export const getIO = (): Server | null => {
  return io;
};

export const emitNotificationToUser = (userId: string, notification: any) => {
  if (io) {
    io.to(userId).emit("notification:new", notification);
  }
};

export const emitTripStatus = (
  tripId: string,
  status: string,
  payload?: any,
) => {
  if (io) {
    io.to(`trip:${tripId}`).emit("trip:status-changed", {
      status,
      ...payload,
    });
  }
};

export const emitDispatchOffer = (driverUserId: string, offer: any) => {
  if (io) {
    io.to(driverUserId).emit("trip:new-offer", offer);
  }
};
