import { describe, expect, test } from "bun:test";
import {
  createToken,
  authenticate,
  type AuthUser,
} from "./jwt";

describe("JWT", () => {
  test("creates and verifies a token", () => {
    const user: AuthUser = {
      id: "user-123",
      email: "agent@example.com",
      name: "Support Agent",
      role: "AGENT",
    };

    const token = createToken(user);

    const result = authenticate(`Bearer ${token}`);

    expect(result).toEqual(user);
  });

  test("rejects malformed authorization header", () => {
    expect(() => authenticate("invalid-token")).toThrow(
      "UNAUTHORIZED",
    );
  });
});