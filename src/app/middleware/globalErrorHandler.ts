import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { ZodError } from "zod";
import { Prisma } from "../../generated/prisma/client";
import config from "../config";
import AppError from "../errors/AppError";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const globalErrorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (config.node_env === "development") {
    console.error("Error from Global Error Handler:", err);
  }

  let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;
  let errorMessage = err.message || "Internal Server Error";
  let errorName = err.name || "Error";

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorMessage = err.message;
    errorName = "AppError";
  } else if (err instanceof ZodError) {
    statusCode = httpStatus.BAD_REQUEST;
    errorName = "ZodValidationError";
    errorMessage = err.issues
      .map((issue) => `${issue.path.join(".") || "field"}: ${issue.message}`)
      .join("; ");
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = httpStatus.BAD_REQUEST;
    errorMessage =
      "You have provided incorrect field types or missing fields in database query";
    errorName = "PrismaValidationError";
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = httpStatus.BAD_REQUEST;
    errorName = "PrismaKnownRequestError";
    if (err.code === "P2002") {
      const target = (err.meta?.target as string[]) || ["field"];
      errorMessage = `Duplicate value error: ${target.join(", ")} already exists`;
    } else if (err.code === "P2003") {
      errorMessage = "Foreign key constraint failed";
    } else if (err.code === "P2025") {
      statusCode = httpStatus.NOT_FOUND;
      errorMessage =
        "Record not found or operation failed because a required record is missing";
    }
  } else if (err instanceof Prisma.PrismaClientInitializationError) {
    if (err.errorCode === "P1000") {
      statusCode = httpStatus.UNAUTHORIZED;
      errorMessage =
        "Authentication failed against database server. Please check credentials.";
    } else if (err.errorCode === "P1001") {
      statusCode = httpStatus.SERVICE_UNAVAILABLE;
      errorMessage = "Cannot reach database server";
    }
  } else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    errorMessage = "Error occurred during query execution";
  } else if (err instanceof Error) {
    errorMessage = err.message;
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    name: config.node_env === "development" ? errorName : undefined,
    message: errorMessage,
    error: config.node_env === "development" ? err : undefined,
    stack: config.node_env === "development" ? err.stack : undefined,
  });
};
