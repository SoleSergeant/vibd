import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { aiRateLimited } from "@/lib/rate-limit";
import { draftTaskBrief } from "@/lib/ai";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.organizationProfile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const limited = aiRateLimited(user.id);
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const notes = String(body?.notes || "").trim().slice(0, 4000);
  if (!notes) {
    return NextResponse.json({ error: "notes are required" }, { status: 400 });
  }

  const draft = await draftTaskBrief({
    notes,
    organizationName: user.organizationProfile.name,
    current: {
      title: String(body?.current?.title || "").trim(),
      description: String(body?.current?.description || "").trim(),
      category: String(body?.current?.category || "").trim(),
      skills: Array.isArray(body?.current?.skills) ? body.current.skills.filter((item: unknown) => typeof item === "string") : [],
      rewardType: String(body?.current?.rewardType || "").trim(),
      difficulty: String(body?.current?.difficulty || "").trim(),
      visibility: String(body?.current?.visibility || "").trim(),
      location: String(body?.current?.location || "").trim(),
      stipendAmount: typeof body?.current?.stipendAmount === "number" ? body.current.stipendAmount : null
    }
  });

  return NextResponse.json({ draft });
}
