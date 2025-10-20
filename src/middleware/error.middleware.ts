import { Request, Response, NextFunction } from "express";
import ApiError from "../utils/api.error";

const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err.stack);

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  res.status(statusCode);

  res.json({
    message: message,
    stack: process.env.NODE_ENV === "production" ? "#&#337;" : err.stack,
  });
};

export { errorHandler };
