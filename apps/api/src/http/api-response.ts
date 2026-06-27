import type { RequestContext } from "./request-context";

export interface ApiResponseMeta {
  correlationId: string;
  tenantId?: string;
  timestamp: string;
}

export interface ApiSuccessEnvelope<T> {
  ok: true;
  data: T;
  meta: ApiResponseMeta;
}

export interface ApiErrorEnvelope {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta: ApiResponseMeta;
}

export function createResponseMeta(context?: Partial<RequestContext>): ApiResponseMeta {
  return {
    correlationId: context?.correlationId ?? "public",
    tenantId: context?.tenantId,
    timestamp: new Date().toISOString(),
  };
}

export function ok<T>(data: T, context?: Partial<RequestContext>): ApiSuccessEnvelope<T> {
  return {
    ok: true,
    data,
    meta: createResponseMeta(context),
  };
}

export function fail(
  code: string,
  message: string,
  context?: Partial<RequestContext>,
  details?: unknown,
): ApiErrorEnvelope {
  return {
    ok: false,
    error: {
      code,
      message,
      ...(details === undefined ? {} : { details }),
    },
    meta: createResponseMeta(context),
  };
}
