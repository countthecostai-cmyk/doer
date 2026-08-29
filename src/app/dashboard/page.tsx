import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { DoerProfile, Profile, Task, TaskType } from "@/lib/database.types";
import { STATUS_LABELS, ACTIVE_TASK_STATUSES } from "@/lib/task-state-machine";
import { formatCents, totalDoerPayoutCents } from "@/lib/pricing";

export const dynamic = "force-dynamic";

type TaskWithType = Task & { task_types: Pick<TaskType, "name" | "slug"> | null };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const [{ data: profileData }, { data: doerProfileData }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("doer_profiles").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  const profile = profileData as Profile | null;
  const doerProfile = doerProfileData as DoerProfile | null;
  const isApprovedDoer = doerProfile?.status === "approved";

  let openPoolCount = 0;
  let activeJobs: TaskWithType[] = [];
  let lifetimeEarningsCents = 0;

  if (isApprovedDoer) {
    const [poolCountRes, activeRes, paidRes] = await Promise.all([
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("status", "matching")
        .is("doer_id", null),
      supabase
        .from("tasks")
        .select("*, task_types(name, slug)")
        .eq("doer_id", user.id)
        .in("status", ACTIVE_TASK_STATUSES)
        .order("created_at", { ascending: false }),
      supabase
        .from("tasks")
        .select("doer_payout_cents, tip_cents")
        .eq("doer_id", user.id)
        .eq("status", "payout_completed"),
    ]);
    openPoolCount = poolCountRes.count ?? 0;
    activeJobs = (activeRes.data as TaskWithType[]) ?? [];
    lifetimeEarningsCents = (paidRes.data ?? []).reduce(
      (sum, t) => sum + totalDoerPayoutCents(t.doer_payout_cents, t.tip_cents),
      0
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-6 py-10">
      <h1 className="text-2xl font-semibold">Hi {profile?.full_name?.split(" ")[0] ?? "there"} 👋</h1>

      {!doerProfile && (
        <div className="rounded-lg border border-neutral-200 bg-white p-6 text-center">
          <p className="mb-4 text-sm text-neutral-600">
            Apply to become a Doer to start browsing and claiming tasks near you.
          </p>
          <Link
            href="/doer/apply"
            className="inline-block rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Apply to be a Doer
          </Link>
        </div>
      )}

      {doerProfile && doerProfile.status === "pending" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Your Doer application is pending review.
        </div>
      )}

      {doerProfile && doerProfile.status === "rejected" && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Your Doer application wasn&apos;t approved.{" "}
          <Link href="/doer/apply" className="underline">
            View details
          </Link>
        </div>
      )}

      {doerProfile && doerProfile.status === "suspended" && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Your Doer account is currently suspended.
        </div>
      )}

      {isApprovedDoer && (
        <>
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Open tasks" value={String(openPoolCount)} href="/pool" />
            <StatCard label="Active jobs" value={String(activeJobs.length)} href="/jobs" />
            <StatCard label="Lifetime earned" value={formatCents(lifetimeEarningsCents)} href="/earnings" />
            <StatCard
              label="Rating"
              value={doerProfile.rating_count > 0 ? `⭐ ${doerProfile.rating_avg?.toFixed(1)}` : "—"}
              href="/profile"
            />
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-medium">Your active jobs</h2>
              <Link href="/jobs" className="text-sm font-medium text-neutral-900 underline">
                View all
              </Link>
            </div>
            <TaskList tasks={activeJobs.slice(0, 5)} emptyLabel="Nothing active — check the job pool." />
          </section>

          <section className="flex flex-wrap gap-3">
            <QuickLink href="/pool" label="Browse job pool" />
            <QuickLink href="/jobs" label="My jobs" />
            <QuickLink href="/earnings" label="Earnings" />
            <QuickLink href="/profile" label="Profile & availability" />
            <QuickLink href="/doer/payouts" label="Payouts" />
          </section>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-300 hover:bg-neutral-50"
    >
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-neutral-900">{value}</p>
    </Link>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
    >
      {label}
    </Link>
  );
}

function TaskList({ tasks, emptyLabel }: { tasks: TaskWithType[]; emptyLabel: string }) {
  if (tasks.length === 0) {
    return <p className="text-sm text-neutral-500">{emptyLabel}</p>;
  }
  return (
    <ul className="divide-y divide-neutral-200 overflow-hidden rounded-lg border border-neutral-200 bg-white">
      {tasks.map((task) => (
        <li key={task.id}>
          <Link
            href={`/tasks/${task.id}`}
            className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50"
          >
            <div>
              <p className="font-medium text-neutral-900">{task.task_types?.name ?? task.title}</p>
              <p className="text-sm text-neutral-500">{task.address}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-neutral-900">
                {formatCents(task.doer_payout_cents, task.currency)}
              </p>
              <p className="text-xs text-neutral-500">{STATUS_LABELS[task.status]}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
