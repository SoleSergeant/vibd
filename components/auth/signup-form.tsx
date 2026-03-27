"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  defaultRole: "VOLUNTEER" | "ORGANIZATION";
};

export function SignupForm({ defaultRole }: Props) {
  const [role, setRole] = useState<"VOLUNTEER" | "ORGANIZATION">(defaultRole);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your Vibd account</CardTitle>
        <CardDescription>
          Volunteers complete a richer pre-registration profile so organizations can discover them with better context.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action="/api/auth/signup" method="post" className="space-y-5">
          <div className="grid gap-2">
            <label className="text-sm font-medium">{role === "ORGANIZATION" ? "Organization name" : "Full name"}</label>
            <Input name="name" required placeholder={role === "ORGANIZATION" ? "CityKind Collective" : "Amina Karimova"} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Email</label>
            <Input name="email" type="email" required placeholder="you@example.com" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Password</label>
            <Input name="password" type="password" minLength={8} required placeholder="At least 8 characters" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Role</label>
            <Select
              name="role"
              defaultValue={defaultRole}
              onChange={(event) => setRole(event.target.value as "VOLUNTEER" | "ORGANIZATION")}
            >
              <option value="VOLUNTEER">Volunteer</option>
              <option value="ORGANIZATION">Organization</option>
            </Select>
          </div>

          {role === "VOLUNTEER" ? (
            <Card className="border-dashed border-slate-300 bg-slate-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Volunteer pre-registration profile</CardTitle>
                <CardDescription>
                  This helps organizations understand your skills, availability, and fit before you apply.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Where are you from?</label>
                  <Input name="location" placeholder="City, country" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">What skills do you already have?</label>
                  <Input name="skills" placeholder="Project coordination, writing, research..." required />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">What kinds of work interest you?</label>
                  <Input name="interests" placeholder="Operations, design, community, data..." required />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Languages</label>
                  <Input name="languages" placeholder="English, Uzbek..." />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">How much free time do you have?</label>
                  <Input name="availability" required placeholder="10 hours/week, mostly evenings" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Opportunity status</label>
                  <Select name="opportunityStatus" defaultValue="OPEN_VOLUNTEER_WORK">
                    <option value="OPEN_VOLUNTEER_WORK">Open to volunteer work</option>
                    <option value="OPEN_INTERNSHIPS">Open to internships</option>
                    <option value="OPEN_PAID_WORK">Open to paid work</option>
                    <option value="UNAVAILABLE">Unavailable</option>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Headline</label>
                  <Input name="headline" placeholder="Short one-line summary" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Bio</label>
                  <Textarea
                    name="bio"
                    required
                    placeholder="Tell organizations what you have done, what you want to learn, and what kind of impact you like to make."
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Discoverable</label>
                  <Select name="discoverable" defaultValue="true">
                    <option value="true">Visible in discovery</option>
                    <option value="false">Hidden from discovery</option>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed border-slate-300 bg-slate-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Organization profile details</CardTitle>
                <CardDescription>Organizations can add richer context so volunteers understand who they are joining.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Industry</label>
                  <Input name="industry" placeholder="Nonprofit, startup, agency..." />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Location</label>
                  <Input name="organizationLocation" placeholder="Remote, Tashkent..." />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Website</label>
                  <Input name="website" type="url" placeholder="https://example.com" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea name="description" placeholder="What do you do, and what kind of volunteers do you work with?" />
                </div>
              </CardContent>
            </Card>
          )}

          <Button type="submit" className="w-full">
            Create account
          </Button>
        </form>
        <p className="mt-4 text-sm text-slate-500">
          Already have an account? <Link href="/signin" className="font-medium text-slate-950 underline">Sign in</Link>
        </p>
      </CardContent>
    </Card>
  );
}
