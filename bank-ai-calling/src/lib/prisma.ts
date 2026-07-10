import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Prisma 7 requires a driver adapter — this is what actually opens the
 * connection to Postgres using the standard `pg` driver under the hood.
 *
 * We reuse a single PrismaClient instance across the whole app (the
 * "singleton" pattern below) instead of creating a new one per request,
 * which would exhaust your database's connection limit under load.
 */
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}