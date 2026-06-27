import { ApiError } from "../http/api-error";

export function apiPersistenceError(message: string, details?: unknown): ApiError {
  return new ApiError(500, "internal_error", message, details);
}
