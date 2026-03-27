import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formValue } from "@/lib/forms";
import { signSession, verifyPassword } from "@/lib/security";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = formValue(form.get("email")).toLowerCase();
  const password = formValue(form.get("password"));
  const role = formValue(form.get("role"));

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !verifyPassword(password, user.passwordHash) || user.role !== role) {
    return NextResponse.redirect(new URL("/signin?error=invalid", request.url), 303);
  }

  const response = NextResponse.redirect(
    new URL(user.role === "ORGANIZATION" ? "/organization/dashboard" : "/volunteer/dashboard", request.url),
    303
  );
  response.cookies.set("vibedwork_session", signSession({ userId: user.id, role: user.role }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/"
  });
  return response;
}
