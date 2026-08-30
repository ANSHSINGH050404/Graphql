import type { TicketStatus } from "@prisma/client";

export const ALLOWED_STATUS_TRANSITIONS:
  Record<TicketStatus, TicketStatus[]> = {
    OPEN: [
      "IN_PROGRESS",
      "WAITING_ON_CUSTOMER",
      "CLOSED",
    ],

    IN_PROGRESS: [
      "OPEN",
      "WAITING_ON_CUSTOMER",
      "RESOLVED",
    ],

    WAITING_ON_CUSTOMER: [
      "OPEN",
      "IN_PROGRESS",
    ],

    RESOLVED: [
      "CLOSED",
    ],

    CLOSED: [],
  };

  export function assertValidStatusTransition(
  from: TicketStatus,
  to: TicketStatus,
) {
  if (from === to) {
    return;
  }

  const allowed =
    ALLOWED_STATUS_TRANSITIONS[from];

  if (!allowed.includes(to)) {
    throw new AppError(
      "INVALID_STATUS_TRANSITION",
      `Cannot transition ticket from ${from} to ${to}.`,
    );
  }
}

export async function updateTicket(
  db: PrismaClient,
  user: AuthUser | undefined,
  ticketId: string,
  input: {
    title?: string;
    description?: string;
    priority?: Priority;
    status?: TicketStatus;
    assigneeId?: string | null;
  },
) {
  const authenticatedUser = requireUser(user);

  if (authenticatedUser.role !== "AGENT") {
    throw new AppError(
      "FORBIDDEN",
      "Only agents can update tickets.",
    );
  }

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

  if (
    input.status &&
    input.status !== ticket.status
  ) {
    assertValidStatusTransition(
      ticket.status,
      input.status,
    );
  }

  if (
    input.status === "RESOLVED"
  ) {
    throw new AppError(
      "INVALID_OPERATION",
      "Use resolveTicket to resolve a ticket.",
    );
  }

  return db.$transaction(async (tx) => {
    const updated = await tx.ticket.update({
      where: {
        id: ticket.id,
      },

      data: {
        ...(input.title !== undefined
          ? { title: input.title.trim() }
          : {}),

        ...(input.description !== undefined
          ? {
              description:
                input.description.trim(),
            }
          : {}),

        ...(input.priority !== undefined
          ? {
              priority: input.priority,
            }
          : {}),

        ...(input.status !== undefined
          ? {
              status: input.status,
            }
          : {}),

        ...(input.assigneeId !== undefined
          ? {
              assigneeId: input.assigneeId,
            }
          : {}),
      },
    });

    if (
      input.status &&
      input.status !== ticket.status
    ) {
      await tx.ticketEvent.create({
        data: {
          ticketId: ticket.id,
          actorId: authenticatedUser.id,
          type: "STATUS_CHANGED",
          fromStatus: ticket.status,
          toStatus: input.status,
        },
      });
    }

    return updated;
  });
}
if (
  input.assigneeId !== undefined &&
  input.assigneeId !== ticket.assigneeId
) {
  await tx.ticketEvent.create({
    data: {
      ticketId: ticket.id,
      actorId: authenticatedUser.id,
      type: "ASSIGNED",
      fromAssigneeId:
        ticket.assigneeId,
      toAssigneeId:
        input.assigneeId,
    },
  });
}

if (input.assigneeId) {
  const assignee =
    await db.user.findUnique({
      where: {
        id: input.assigneeId,
      },
      select: {
        id: true,
        role: true,
      },
    });

  if (!assignee) {
    throw new AppError(
      "NOT_FOUND",
      "Assignee not found.",
    );
  }

  if (assignee.role !== "AGENT") {
    throw new AppError(
      "VALIDATION_ERROR",
      "Tickets can only be assigned to agents.",
    );
  }
}

const result = await tx.ticket.updateMany({
  where: {
    id: ticket.id,
    firstResponseAt: null,
  },

  data: {
    firstResponseAt: new Date(),
  },
});
if (result.count === 1) {
  await tx.ticketEvent.create({
    data: {
      ticketId: ticket.id,
      actorId: authenticatedUser.id,
      type: "FIRST_RESPONSE",
    },
  });
}


