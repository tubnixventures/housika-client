import { ErrorCode, ErrorCodes } from '../types/errors';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly status: number;
  public readonly details?: unknown;

  constructor(code: ErrorCode, message: string, status = 400, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function notFound(msg = 'Resource not found'): never {
  throw new AppError(ErrorCodes.NOT_FOUND, msg, 404);
}

export function unauthorized(msg = 'Unauthorized'): never {
  throw new AppError(ErrorCodes.UNAUTHORIZED, msg, 401);
}

export function forbidden(code: ErrorCode, msg = 'Forbidden'): never {
  throw new AppError(code, msg, 403);
}

export function conflict(msg: string): never {
  throw new AppError(ErrorCodes.CONFLICT, msg, 409);
}

export function validationErr(msg: string, details?: unknown): never {
  throw new AppError(ErrorCodes.VALIDATION_ERROR, msg, 422, details);
}
