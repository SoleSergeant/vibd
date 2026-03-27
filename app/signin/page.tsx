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

      <Card className="mt-6 border-slate-200 bg-slate-50">
        <CardHeader>
          <CardTitle className="text-base">Demo accounts</CardTitle>
          <CardDescription>Use these seeded logins for the fastest hackathon demo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="font-medium text-slate-950">Strong volunteer demo</p>
            <p>Maya Rahmonova - maya@vibedwork.dev</p>
            <p>Password: password123</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="font-medium text-slate-950">Volunteer accounts</p>
              <ul className="mt-2 space-y-1">
                <li>amina@vibedwork.dev</li>
                <li>james@vibedwork.dev</li>
                <li>sara@vibedwork.dev</li>
                <li>noah@vibedwork.dev</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="font-medium text-slate-950">Organization accounts</p>
              <ul className="mt-2 space-y-1">
                <li>hello@citykind.org</li>
                <li>ops@northstarstudio.co</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
