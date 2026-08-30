import { prisma } from "../../db.ts";
import type { Context } from "../context";
import { AppError } from "../../errors/AppError";

export const userResolvers = {
  Query: {
    users: async (
      _: unknown,
      __: unknown,
      context: Context,
    ) => {
      if (!context.user) {
        throw new AppError(
          "UNAUTHORIZED",
          "Authentication required.",
        );
      }

      if (context.user.role !== "AGENT") {
        throw new AppError(
          "FORBIDDEN",
          "Only agents can view all users.",
        );
      }

      return prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    },
  },
};