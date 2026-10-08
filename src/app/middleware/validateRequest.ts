import { NextFunction, Request, Response } from "express";
import { ZodTypeAny } from "zod";
import { catchAsync } from "../utils/catchAsync";

export const validateRequest = (schema: ZodTypeAny) => {
  return catchAsync(
    async (req: Request, _res: Response, next: NextFunction) => {
      if (typeof req.body?.data === "string") {
        try {
          req.body = JSON.parse(req.body.data);
        } catch {
          // keep as is
        }
      }
      req.body = await schema.parseAsync(req.body);
      next();
    },
  );
};
