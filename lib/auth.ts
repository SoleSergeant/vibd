import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, verifySession } from "@/lib/security";

export async function getCurrentSession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return verifySession(token);
}

// Deduplicated per request: the site header and the page both ask for the current user.
export const getCurrentUser = cache(async () => {
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
});

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
