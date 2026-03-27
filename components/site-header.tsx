import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { ButtonLink } from "@/components/ui/button";
import { Button } from "@/components/ui/button";

const publicNav = [
  { href: "/marketplace", label: "Workboard" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/discover", label: "Discover talent" }
];

export async function SiteHeader() {
  const user = await getCurrentUser();
  const dashboardHref =
    user?.role === "ORGANIZATION"
      ? "/organization/dashboard"
      : user?.role === "VOLUNTEER"
        ? "/volunteer/dashboard"
        : "/signin";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-950">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[color:var(--brand-blue)] shadow-[0_0_0_4px_rgba(45,138,227,0.14)]" />
            Vibd
          </Link>
          <nav className="hidden items-center gap-5 md:flex">
            {publicNav.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm text-slate-600 transition hover:text-slate-950">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link href={dashboardHref} className="hidden text-sm font-medium text-slate-700 sm:inline">
                {user.name}
              </Link>
              <form action="/api/auth/signout" method="post">
                <Button variant="outline" size="sm" type="submit">
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <>
              <ButtonLink href="/signin" variant="outline" size="sm">
                Sign in
              </ButtonLink>
              <ButtonLink href="/signup" size="sm">
                Join Vibd
              </ButtonLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
