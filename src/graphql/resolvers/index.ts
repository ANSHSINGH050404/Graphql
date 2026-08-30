import { authResolvers } from "./auth";
import { userResolvers } from "./user";

export const resolvers = {
  Query: {
    ...authResolvers.Query,
    ...userResolvers.Query,
  },

  Mutation: {
    ...authResolvers.Mutation,
  },
};