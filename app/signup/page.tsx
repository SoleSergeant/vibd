import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

export default function SignUpPage({
  searchParams
}: {
  searchParams?: {
    role?: string;
  };
}) {
  const defaultRole = searchParams?.role === "organization" ? "ORGANIZATION" : "VOLUNTEER";

  return (
    <PageShell className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Create your Vibd account</CardTitle>
          <CardDescription>Pick a role and we’ll route you into the right flow.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action="/api/auth/signup" method="post" className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Full name</label>
              <Input name="name" required />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Email</label>
              <Input name="email" type="email" required />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Password</label>
              <Input name="password" type="password" minLength={8} required />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Role</label>
              <Select name="role" defaultValue={defaultRole}>
                <option value="VOLUNTEER">Volunteer</option>
                <option value="ORGANIZATION">Organization</option>
              </Select>
            </div>
            <Button type="submit" className="w-full">
              Create account
            </Button>
          </form>
          <p className="mt-4 text-sm text-slate-500">
            Already have an account? <Link href="/signin" className="font-medium text-slate-950 underline">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </PageShell>
  );
}
