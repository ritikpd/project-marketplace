import { type Request, type Response, type NextFunction } from "express";
import { z } from "zod/v4";

// ─────────────────────────────────────────────────────────────────────────────
// Validation Error Response Helper
// ─────────────────────────────────────────────────────────────────────────────
export function sendValidationError(
  res: Response,
  error: z.ZodError,
  statusCode: number = 400,
): void {
  res.status(statusCode).json({
    error: "Validation error",
    details: error.flatten().fieldErrors,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Middleware to validate request body
// ─────────────────────────────────────────────────────────────────────────────
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      sendValidationError(res, result.error);
      return;
    }
    (req as any).validatedBody = result.data;
    next();
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Middleware to validate query parameters
// ─────────────────────────────────────────────────────────────────────────────
export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      sendValidationError(res, result.error);
      return;
    }
    (req as any).validatedQuery = result.data;
    next();
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Middleware to validate request parameters
// ─────────────────────────────────────────────────────────────────────────────
export function validateParams<T>(schema: z.ZodSchema<T>) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      sendValidationError(res, result.error);
      return;
    }
    (req as any).validatedParams = result.data;
    next();
  };
}