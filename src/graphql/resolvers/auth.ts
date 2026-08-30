import {
  loginUser,
  registerUser,
} from "../../services/auth/authService";
import type { Context } from "../context";

interface RegisterArgs {
  name: string;
  email: string;
  password: string;
}

interface LoginArgs {
  email: string;
  password: string;
}

export const authResolvers = {
  Mutation: {
    register: async (
      _: unknown,
      args: RegisterArgs,
    ) => {
      return registerUser({
        name: args.name,
        email: args.email,
        password: args.password,
        role: "REPORTER",
      });
    },

    login: async (
      _: unknown,
      args: LoginArgs,
    ) => {
      return loginUser(args);
    },
  },

  Query: {
    me: (
      _: unknown,
      __: unknown,
      context: Context,
    ) => {
      return context.user ?? null;
    },
  },
};