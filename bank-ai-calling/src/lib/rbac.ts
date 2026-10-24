import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export class UnauthorizedError extends Error {}
export class ForbiddenError extends Error {}

export async function requireRole(allowedRoles: string[]) {
  const session = await auth();

  if (!session?.user) {
    throw new UnauthorizedError("Not signed in");
  }

  let role = session.user.role;
  if (!allowedRoles.includes(role) && session.user.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    if (dbUser?.role) role = dbUser.role;
  }

  if (!allowedRoles.includes(role)) {
    throw new ForbiddenError(`Requires one of: ${allowedRoles.join(", ")}`);
  }

  return session;
}