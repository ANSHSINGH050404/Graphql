import type {
  PrismaClient,
  Priority,
  TicketStatus,
} from "@prisma/client";

import {
  calculateSlaDeadlines,
} from "../sla/slaService";

import {
  createBusinessCalendar,
  DEFAULT_BUSINESS_HOURS,
} from "../sla/businessHours";

import {
  requireUser,
  requireTicketAccess,
} from "./ticketPolicy";

import type { AuthUser } from "../auth/jwt";

import { AppError } from "../../errors/AppError";

export async function createTicket(
  db: PrismaClient,
  user: AuthUser | undefined,
  input: {
    title: string;
    description: string;
    priority?: Priority;
  },
) {
  const authenticatedUser = requireUser(user);

  if (authenticatedUser.role !== "REPORTER") {
    throw new AppError(
      "FORBIDDEN",
      "Only reporters can create tickets.",
    );
  }

  if (!input.title.trim()) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Title is required.",
    );
  }

  if (!input.description.trim()) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Description is required.",
    );
  }

  const priority = input.priority ?? "MEDIUM";

  const createdAt = new Date();

  const calendar = createBusinessCalendar([]);

  const deadlines = calculateSlaDeadlines(
    createdAt,
    priority,
    calendar,
    DEFAULT_BUSINESS_HOURS,
  );

  return db.$transaction(async (tx) => {
    const ticket = await tx.ticket.create({
      data: {
        title: input.title.trim(),
        description: input.description.trim(),
        priority,
        reporterId: authenticatedUser.id,
        responseDeadline: deadlines.responseDeadline,
        resolutionDeadline: deadlines.resolutionDeadline,
      },
    });

    await tx.resolutionAttempt.create({
      data: {
        ticketId: ticket.id,
        startedAt: createdAt,
        dueAt: deadlines.resolutionDeadline,
        state: "ON_TRACK",
      },
    });

    await tx.ticketEvent.create({
      data: {
        ticketId: ticket.id,
        actorId: authenticatedUser.id,
        type: "CREATED",
      },
    });

    return ticket;
  });
}

export async function getTicket(
  db: PrismaClient,
  user: AuthUser | undefined,
  ticketId: string,
) {
  const authenticatedUser = requireUser(user);

  const ticket = await db.ticket.findUnique({
    where: {
      id: ticketId,
    },
  });

  if (!ticket) {
    throw new AppError(
      "NOT_FOUND",
      "Ticket not found.",
    );
  }

  requireTicketAccess(
    authenticatedUser,
    ticket,
  );

  return ticket;
}

export async function listTickets(
  db: PrismaClient,
  user: AuthUser | undefined,
  filters?: {
    status?: TicketStatus;
    priority?: Priority;
    assigneeId?: string;
  },
) {
  const authenticatedUser = requireUser(user);

  const where = {
    ...(authenticatedUser.role === "REPORTER"
      ? {
          reporterId: authenticatedUser.id,
        }
      : {}),

    ...(filters?.status
      ? {
          status: filters.status,
        }
      : {}),

    ...(filters?.priority
      ? {
          priority: filters.priority,
        }
      : {}),

    ...(filters?.assigneeId
      ? {
          assigneeId: filters.assigneeId,
        }
      : {}),
  };

  return db.ticket.findMany({
    where,
    orderBy: [
      {
        createdAt: "desc",
      },
      {
        id: "desc",
      },
    ],
  });
}