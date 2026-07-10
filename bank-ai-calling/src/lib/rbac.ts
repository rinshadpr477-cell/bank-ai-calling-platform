import { auth } from "@/auth";

export class UnauthorizedError extends Error {}
export class ForbiddenError extends Error {}


export async function requireRole(allowedRoles: string[]) {
  const session = await auth();

  if (!session?.user) {
    throw new UnauthorizedError("Not signed in");
  }

  if (!allowedRoles.includes(session.user.role)) {
    throw new ForbiddenError(`Requires one of: ${allowedRoles.join(", ")}`);
  }

  return session;
}