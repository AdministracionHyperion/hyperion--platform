export type ApiErrorCode =
  | "validation_error"
  | "missing_actor"
  | "forbidden"
  | "not_found"
  | "policy_blocked"
  | "rate_limit_exceeded"
  | "conflict"
  | "runtime_action_blocked"
  | "internal_error";

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: ApiErrorCode;
  public readonly details?: unknown;

  public constructor(statusCode: number, code: ApiErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function validationError(message: string, details?: unknown): ApiError {
  return new ApiError(400, "validation_error", message, details);
}

export function missingActorError(message = "Actor context is required."): ApiError {
  return new ApiError(401, "missing_actor", message);
}

export function forbiddenError(message = "Actor is not allowed to perform this action."): ApiError {
  return new ApiError(403, "forbidden", message);
}

export function notFoundError(message = "Resource was not found."): ApiError {
  return new ApiError(404, "not_found", message);
}

export function policyBlockedError(
  message = "Action is blocked by policy gate.",
  details?: unknown,
): ApiError {
  return new ApiError(403, "policy_blocked", message, details);
}

export function rateLimitExceededError(
  message = "Rate limit exceeded.",
  details?: unknown,
): ApiError {
  return new ApiError(429, "rate_limit_exceeded", message, details);
}

export function conflictError(message = "Resource conflict.", details?: unknown): ApiError {
  return new ApiError(409, "conflict", message, details);
}

export function runtimeActionBlockedError(
  message = "Runtime action is blocked.",
  details?: unknown,
): ApiError {
  return new ApiError(403, "runtime_action_blocked", message, details);
}
