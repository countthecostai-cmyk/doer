import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PoolList } from "@/components/PoolList";
import type { DoerProfile, Task, TaskType } from "@/lib/database.types";

export const dynamic = "force-dynamic";

type TaskWithType = Task & { task_types: Pick<TaskType, "name" | "slug"> | null };

export default async function PoolPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/pool");

  const { data: doerProfileData } = await supabase
    .from("doer_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  const doerProfile = doerProfileData as DoerProfile | null;

  if (doerProfile?.status !== "approved") {
    return (
      <div className="mx-auto max-w-lg px-6 py-10 text-center">
        <h1 className="mb-2 text-2xl font-semibold">Job pool</h1>
        <p className="mb-4 text-sm text-neutral-500">
          {doerProfile
            ? "Your Doer application needs to be approved before you can browse open tasks."
            : "Apply to become a Doer to browse open tasks."}
        </p>
        <Link href="/doer/apply" className="text-sm font-medium text-neutral-900 underline">
          {doerProfile ? "View application status" : "Apply to be a Doer"}
        </Link>
      </div>
    );
  }

  // RLS (tasks_select open-pool branch) already restricts this to approved,
  // non-suspended doers and to unclaimed matching tasks — no client filter
  // needed or trusted here.
  const { data } = await supabase
    .from("tasks")
    .select("*, task_types(name, slug)")
    .eq("status", "matching")
    .is("doer_id", null)
    .order("created_at", { ascending: true });

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Job pool</h1>
        <p className="text-sm text-neutral-500">
          Every open task, oldest first. Tap one to see details and accept it.
        </p>
      </div>
      <PoolList tasks={(data as TaskWithType[]) ?? []} />
    </div>
  );
}
