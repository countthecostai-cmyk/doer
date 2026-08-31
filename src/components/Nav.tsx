import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import { NotificationBell } from "@/components/NotificationBell";
import type { DoerProfile, NotificationRow } from "@/lib/database.types";

export async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let doerProfile: DoerProfile | null = null;
  let notifications: NotificationRow[] = [];

  if (user) {
    const [{ data: doerData }, { data: notifData }] = await Promise.all([
      supabase.from("doer_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    doerProfile = doerData as DoerProfile | null;
    notifications = (notifData as NotificationRow[]) ?? [];
  }

  const isApprovedDoer = doerProfile?.status === "approved";

  return (
    <header className="border-b border-neutral-200 bg-white">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-lg font-bold tracking-tight text-neutral-900">
          Done <span className="font-normal text-neutral-500">Doer</span>
        </Link>
        <div className="flex items-center gap-3 text-sm sm:gap-4">
          {user ? (
            <>
              <Link href="/dashboard" className="text-neutral-600 hover:text-neutral-900">
                Dashboard
              </Link>
              {isApprovedDoer ? (
                <>
                  <Link href="/pool" className="hidden text-neutral-600 hover:text-neutral-900 sm:inline">
                    Job pool
                  </Link>
                  <Link href="/jobs" className="hidden text-neutral-600 hover:text-neutral-900 sm:inline">
                    My jobs
                  </Link>
                  <Link href="/earnings" className="hidden text-neutral-600 hover:text-neutral-900 sm:inline">
                    Earnings
                  </Link>
                </>
              ) : (
                <Link href="/doer/apply" className="text-neutral-600 hover:text-neutral-900">
                  {doerProfile ? "Application" : "Become a Doer"}
                </Link>
              )}
              <Link href="/profile" className="hidden text-neutral-600 hover:text-neutral-900 sm:inline">
                Profile
              </Link>
              <Link href="/support" className="text-neutral-600 hover:text-neutral-900">
                Support
              </Link>
              <NotificationBell userId={user.id} initialNotifications={notifications} />
              <form action={signOut}>
                <button className="rounded-lg border border-neutral-300 px-3 py-1.5 text-neutral-700 hover:bg-neutral-50">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/sign-in" className="text-neutral-600 hover:text-neutral-900">
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="rounded-lg bg-neutral-900 px-3 py-1.5 text-white hover:bg-neutral-800"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
