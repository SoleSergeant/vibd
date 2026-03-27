import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/security";

export async function getCurrentSession() {
  const token = cookies().get("vibedwork_session")?.value;
  return verifySession(token);
}

export async function getCurrentUser() {
  const session = await getCurrentSession();
  if (!session) return null;
  return prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      volunteerProfile: {
        include: {
          skills: { include: { skill: true } },
          badges: { include: { badge: true } },
          portfolioItems: true
        }
      },
      organizationProfile: true
    }
  });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireRole(role: "VOLUNTEER" | "ORGANIZATION") {
  const user = await requireUser();
  if (user.role !== role) {
    throw new Error("Forbidden");
  }
  return user;
}
