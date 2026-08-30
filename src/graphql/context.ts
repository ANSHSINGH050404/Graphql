import type { YogaInitialContext } from "graphql-yoga";
import type { AuthUser } from "../services/auth/jwt";
import { authenticate } from "../services/auth/jwt";

export interface Context {
  user?: AuthUser;
}

export function createContext({
  request,
}: YogaInitialContext): Context {
  const header = request.headers.get("authorization");

  if (!header) {
    return {};
  }

  return {
    user: authenticate(header),
  };
}