import type { FastifyReply, FastifyRequest } from "fastify";

export type AsyncRouteHandler = (request: FastifyRequest, reply: FastifyReply) => Promise<unknown>;

export function asyncHandler(handler: AsyncRouteHandler): AsyncRouteHandler {
  return async (request, reply) => handler(request, reply);
}
