import { prisma } from "../src/db";
import bcrypt from "bcrypt";


async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash(
    "agent12345",
    12,
  );

  await prisma.user.upsert({
    where: {
      email: "agent@example.com",
    },
    update: {},
    create: {
      name: "Support Agent",
      email: "agent@example.com",
      passwordHash,
      role: "AGENT",
    },
  });

  await prisma.user.upsert({
    where: {
      email: "reporter@example.com",
    },
    update: {},
    create: {
      name: "Demo Reporter",
      email: "reporter@example.com",
      passwordHash,
      role: "REPORTER",
    },
  });
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });