import { NextFunction, Request, Response } from "express";
import { ZodTypeAny } from "zod";
import { catchAsync } from "../utils/catchAsync";

export const validateRequest = (schema: ZodTypeAny) => {
  return catchAsync(
    async (req: Request, _res: Response, next: NextFunction) => {
      req.body = await schema.parseAsync(req.body);
      next();
    },
  );
};
