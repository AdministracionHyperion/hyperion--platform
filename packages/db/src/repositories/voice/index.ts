import type {
  CallEventRepositoryPort,
  CallSessionRepositoryPort,
} from "../../../../../modules/voice/voice-core/src";
import type { HandoffRepositoryPort } from "../../../../../modules/voice/handoff/src";
import {
  callEventFromPrisma,
  callEventToPrisma,
  callParticipantToPrisma,
  callSessionFromPrisma,
  callSessionToPrisma,
  conversationTurnFromPrisma,
  conversationTurnToPrisma,
  handoffRequestFromPrisma,
  handoffRequestToPrisma,
} from "../../mappers/voice";
import {
  fromPersistedRow,
  fromPersistedRows,
  type HyperionPrismaClient,
} from "../../prisma/prisma-types";

export class PrismaCallSessionRepository implements CallSessionRepositoryPort {
  constructor(private readonly prisma: HyperionPrismaClient) {}

  async save(
    ...args: Parameters<CallSessionRepositoryPort["save"]>
  ): ReturnType<CallSessionRepositoryPort["save"]> {
    const session = args[0];
    const data = callSessionToPrisma(session);
    await this.prisma.callSession.upsert({ where: { id: data.id }, create: data, update: data });

    for (const participant of session.participants) {
      const participantData = callParticipantToPrisma(
        participant,
        session.tenantId,
        session.callId,
      );
      await this.prisma.callParticipant.upsert({
        where: { id: participantData.id },
        create: participantData,
        update: participantData,
      });
    }
  }

  async findById(
    ...args: Parameters<CallSessionRepositoryPort["findById"]>
  ): ReturnType<CallSessionRepositoryPort["findById"]> {
    const [tenantId, callId] = args;
    const row = await this.prisma.callSession.findFirst({ where: { tenantId, id: callId } });
    return row ? fromPersistedRow(callSessionFromPrisma, row) : null;
  }

  async appendTurn(
    ...args: Parameters<CallSessionRepositoryPort["appendTurn"]>
  ): ReturnType<CallSessionRepositoryPort["appendTurn"]> {
    await this.prisma.conversationTurn.create({ data: conversationTurnToPrisma(args[0]) });
  }

  async findTurns(
    ...args: Parameters<CallSessionRepositoryPort["findTurns"]>
  ): ReturnType<CallSessionRepositoryPort["findTurns"]> {
    const [tenantId, callId] = args;
    const rows = await this.prisma.conversationTurn.findMany({
      where: { tenantId, callId },
      orderBy: { occurredAt: "asc" },
    });
    return fromPersistedRows(conversationTurnFromPrisma, rows);
  }
}

export class PrismaCallEventRepository implements CallEventRepositoryPort {
  constructor(private readonly prisma: HyperionPrismaClient) {}

  async append(
    ...args: Parameters<CallEventRepositoryPort["append"]>
  ): ReturnType<CallEventRepositoryPort["append"]> {
    await this.prisma.callEvent.create({ data: callEventToPrisma(args[0]) });
  }

  async findByCall(
    ...args: Parameters<CallEventRepositoryPort["findByCall"]>
  ): ReturnType<CallEventRepositoryPort["findByCall"]> {
    const [tenantId, callId] = args;
    const rows = await this.prisma.callEvent.findMany({
      where: { tenantId, callId },
      orderBy: { occurredAt: "asc" },
    });
    return fromPersistedRows(callEventFromPrisma, rows);
  }
}

export class PrismaHandoffRepository implements HandoffRepositoryPort {
  constructor(private readonly prisma: HyperionPrismaClient) {}

  async save(
    ...args: Parameters<HandoffRepositoryPort["save"]>
  ): ReturnType<HandoffRepositoryPort["save"]> {
    const data = handoffRequestToPrisma(args[0]);
    await this.prisma.handoffRequest.upsert({ where: { id: data.id }, create: data, update: data });
  }

  async findById(
    ...args: Parameters<HandoffRepositoryPort["findById"]>
  ): ReturnType<HandoffRepositoryPort["findById"]> {
    const [tenantId, handoffId] = args;
    const row = await this.prisma.handoffRequest.findFirst({ where: { tenantId, id: handoffId } });
    return row ? fromPersistedRow(handoffRequestFromPrisma, row) : null;
  }

  async findByCall(
    ...args: Parameters<HandoffRepositoryPort["findByCall"]>
  ): ReturnType<HandoffRepositoryPort["findByCall"]> {
    const [tenantId, callId] = args;
    const rows = await this.prisma.handoffRequest.findMany({ where: { tenantId, callId } });
    return fromPersistedRows(handoffRequestFromPrisma, rows);
  }
}
