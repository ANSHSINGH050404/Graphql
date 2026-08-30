import jwt from "jsonwebtoken";




const JWT_EXPIRES_IN = "7d";

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error("JWT_SECRET is not configured");
}

type Role = "REPORTER" | "AGENT";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export function createToken(user: AuthUser): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    jwtSecret as string,
    {
      expiresIn: JWT_EXPIRES_IN,
    },
  );
}
export function authenticate(header: string): AuthUser {
  const [scheme, token] = header.split(" ");

  // console.log("Scheme:", scheme);
  // console.log("Token:", token);

  if (scheme !== "Bearer" || !token) {
    throw new Error("UNAUTHORIZED");
  }

  try {
    const payload = jwt.verify(token, jwtSecret as string) as jwt.JwtPayload & {
      sub?: unknown;
      email?: unknown;
      name?: unknown;
      role?: unknown;
    };

    if (typeof payload !== "object" || payload === null) {
      throw new Error("UNAUTHORIZED");
    }

    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.name !== "string" ||
      (payload.role !== "REPORTER" && payload.role !== "AGENT")
    ) {
      throw new Error("UNAUTHORIZED");
    }

    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
  } catch {
    throw new Error("UNAUTHORIZED");
  }
}


// console.log(
//   authenticate("Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJuYW1lIjoiSm9obiBEb2UiLCJyb2xlIjoiUkVQT1JURVIiLCJpYXQiOjE3ODgwMzE1NDQsImV4cCI6MTc4ODYzNjM0NH0.Zb-YJTeYBH8P-vjCtTgyLQJ80AIXkuNW4-xslmE8fbU"
// ));