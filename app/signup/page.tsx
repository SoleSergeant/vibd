import { PageShell } from "@/components/page-shell";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignUpPage({
  searchParams
}: {
  searchParams?: {
    role?: string;
  };
}) {
  const defaultRole = searchParams?.role === "organization" ? "ORGANIZATION" : "VOLUNTEER";

  return (
    <PageShell className="max-w-3xl">
      <SignupForm defaultRole={defaultRole} />
    </PageShell>
  );
}
