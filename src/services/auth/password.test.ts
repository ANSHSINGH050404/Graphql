import { describe, expect, test } from "bun:test";
import {
  hashPassword,
  verifyPassword,
} from "./password";

describe("password hashing", () => {
  test("hashes a password", async () => {
    const password = "super-secret-password";

    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
  });

  test("verifies the correct password", async () => {
    const password = "super-secret-password";

    const hash = await hashPassword(password);

    expect(
      await verifyPassword(password, hash),
    ).toBe(true);
  });

  test("rejects an incorrect password", async () => {
    const hash = await hashPassword("correct-password");

    expect(
      await verifyPassword("wrong-password", hash),
    ).toBe(false);
  });
});