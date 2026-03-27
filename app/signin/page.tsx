import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

export default function SignInPage() {
  return (
    <PageShell className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Sign in to Vibd</CardTitle>
          <CardDescription>Continue into your volunteer or organization dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action="/api/auth/signin" method="post" className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Email</label>
              <Input name="email" type="email" required />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Password</label>
              <Input name="password" type="password" required />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Role</label>
              <Select name="role" defaultValue="VOLUNTEER">
                <option value="VOLUNTEER">Volunteer</option>
                <option value="ORGANIZATION">Organization</option>
              </Select>
            </div>
            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>
          <p className="mt-4 text-sm text-slate-500">
            New here? <Link href="/signup" className="font-medium text-slate-950 underline">Create an account</Link>
          </p>
        </CardContent>
      </Card>
    </PageShell>
  );
}
