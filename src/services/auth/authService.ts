import { prisma } from "../../db.ts";
import {
  hashPassword,
  verifyPassword,
} from "./password";
import { createToken } from "./jwt";


export type Role =  "REPORTER" | "AGENT";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: Role;
}

interface LoginInput {
  email: string;
  password: string;
}

interface AuthResult {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
}

export async function registerUser(
  input: RegisterInput,
): Promise<AuthResult> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();

  if (!name || !email || !input.password) {
    throw new Error("VALIDATION_ERROR");
  }

  if (input.password.length < 8) {
    throw new Error("VALIDATION_ERROR");
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    throw new Error("EMAIL_ALREADY_EXISTS");
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: input.role,
    },
  });

  const token = createToken(user);

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

export async function loginUser(
  input: LoginInput,
): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();

  if (!email || !input.password) {
    throw new Error("VALIDATION_ERROR");
  }

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const validPassword = await verifyPassword(
    input.password,
    user.passwordHash,
  );

  if (!validPassword) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const token = createToken(user);

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}