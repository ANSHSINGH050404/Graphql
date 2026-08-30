import { createYoga } from "graphql-yoga";
import { createServer } from "node:http";
import { prisma } from "./db";
import { createSchema } from "./graphql/schema/schema";
import { createContext } from "./graphql/context";

const schema = createSchema(prisma);

const yoga = createYoga({
  schema,
  context: createContext,
});

const server = createServer(yoga);

const port = Number(process.env.PORT ?? 4000);

server.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}/graphql`);
});