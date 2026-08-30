import { makeExecutableSchema } from "@graphql-tools/schema";
import { prisma } from "../../db";
import { resolvers } from "../resolvers";

const typeDefs = await Bun.file(
  new URL("./schema.graphql", import.meta.url),
).text();

export function createSchema(
  _db: typeof prisma,
) {
  return makeExecutableSchema({
    typeDefs,
    resolvers,
  });
}

