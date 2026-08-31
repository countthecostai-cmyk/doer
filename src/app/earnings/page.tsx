import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCents, totalDoerPayoutCents } from "@/lib/pricing";
import type { DoerProfile, Payout, Review, Task, TaskType } from "@/lib/database.types";

export const dynamic = "force-dynamic";

type PayoutWithTask = Payout & { tasks: Pick<Task, "title"> & { task_types: Pick<TaskType, "name"> | null } };
type ReviewWithTask = Review & { tasks: Pick<Task, "title"> | null };

export default async function EarningsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/earnings");

  const [{ data: doerProfileData }, { data: paidPayouts }, { data: pendingTasks }, { data: reviewsData }] =
    await Promise.all([
      supabase.from("doer_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("payouts")
        .select("*, tasks(title, task_types(name))")
        .eq("doer_id", user.id)
        .eq("status", "paid")
        .order("created_at", { ascending: false }),
      supabase
        .from("tasks")
        .select("id, title, doer_payout_cents, tip_cents, currency, status")
        .eq("doer_id", user.id)
        .in("status", ["completed", "payout_pending"]),
      supabase
        .from("reviews")
        .select("*, tasks(title)")
        .eq("ratee_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  const doerProfile = doerProfileData as DoerProfile | null;
  const paid = (paidPayouts as PayoutWithTask[]) ?? [];
  const pending = pendingTasks ?? [];
  const reviews = (reviewsData as ReviewWithTask[]) ?? [];

  const totalPaidCents = paid.reduce((sum, p) => sum + p.amount_cents, 0);
  const totalPendingCents = pending.reduce(
    (sum, t) => sum + totalDoerPayoutCents(t.doer_payout_cents, t.tip_cents),
    0
  );

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold">Earnings</h1>
        <p className="text-sm text-neutral-500">Includes 100% of tips on top of your task payout.</p>
      </div>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-500">Paid out</p>
          <p className="mt-1 text-xl font-semibold text-neutral-900">{formatCents(totalPaidCents)}</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-500">Pending</p>
          <p className="mt-1 text-xl font-semibold text-neutral-900">{formatCents(totalPendingCents)}</p>
          <p className="mt-0.5 text-[11px] text-neutral-500">Awaiting Requester confirmation & payment</p>
        </div>
      </section>

      {doerProfile && doerProfile.rating_count > 0 && (
        <section className="rounded-lg border border-neutral-200 bg-white p-4 text-sm">
          <span className="font-medium text-neutral-900">⭐ {doerProfile.rating_avg?.toFixed(1)}</span>{" "}
          <span className="text-neutral-500">
            average over {doerProfile.rating_count} {doerProfile.rating_count === 1 ? "review" : "reviews"}
          </span>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-medium">Payout history</h2>
        {paid.length === 0 ? (
          <p className="text-sm text-neutral-500">No payouts yet.</p>
        ) : (
          <ul className="divide-y divide-neutral-200 overflow-hidden rounded-lg border border-neutral-200 bg-white">
            {paid.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/tasks/${p.task_id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50"
                >
                  <div>
                    <p className="font-medium text-neutral-900">
                      {p.tasks?.task_types?.name ?? p.tasks?.title ?? "Task"}
                    </p>
                    <p className="text-xs text-neutral-500">{new Date(p.created_at).toLocaleDateString()}</p>
                  </div>
                  <p className="text-sm font-medium text-neutral-900">{formatCents(p.amount_cents, p.currency)}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Reviews</h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-neutral-500">No reviews yet.</p>
        ) : (
          <ul className="space-y-3">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-lg border border-neutral-200 bg-white p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-neutral-900">{"⭐".repeat(r.rating)}</span>
                  <span className="text-xs text-neutral-500">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                {r.tasks?.title && <p className="mt-1 text-xs text-neutral-500">{r.tasks.title}</p>}
                {r.comment && <p className="mt-2 text-neutral-700">{r.comment}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
