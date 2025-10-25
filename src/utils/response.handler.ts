import { Response, Request } from 'express';

interface ApiResponse<T> {
  statusCode: number;
  message: string;
  result?: T;
  success: boolean;
}
interface SuccessResponseParams<T> {
  result: T;
  statusCode?: number;
  message?: string;
}
const successResponse = <T>(
  _req: Request,
  res: Response,
  params: SuccessResponseParams<T>
): Response<ApiResponse<T>> => {
  const { result, statusCode = 200, message = 'Success' } = params;
  return res.status(statusCode).json({
    statusCode,
    message,
    result,
    success: true,
  });
};

const errorResponse = (
  res: Response,
  statusCode: number,
  message: string
): Response<ApiResponse<null>> => {
  return res.status(statusCode).json({
    statusCode,
    message,
    success: false,
  });
};

export { successResponse, errorResponse };
