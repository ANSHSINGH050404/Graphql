import type { AuthUser } from "../auth/jwt";
import type { Ticket } from "../../generated/prisma/client";
import { AppError } from "../../errors/AppError";

export function requireUser(
  user: AuthUser | undefined,
): AuthUser {
  if (!user) {
    throw new AppError(
      "UNAUTHORIZED",
      "Authentication required.",
    );
  }

  return user;
}

export function canViewTicket(
  user: AuthUser,
  ticket: Ticket,
): boolean {
  if (user.role === "AGENT") {
    return true;
  }

  return ticket.reporterId === user.id;
}

export function requireTicketAccess(
  user: AuthUser | undefined,
  ticket: Ticket,
): AuthUser {
  const authenticatedUser = requireUser(user);

  if (!canViewTicket(authenticatedUser, ticket)) {
    throw new AppError(
      "FORBIDDEN",
      "You do not have access to this ticket.",
    );
  }

  return authenticatedUser;
}