import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MyJobsRealtime, TaskListSection } from "@/components/MyJobsList";
import { ACTIVE_TASK_STATUSES, TERMINAL_STATUSES } from "@/lib/task-state-machine";
import type { Task, TaskType } from "@/lib/database.types";

export const dynamic = "force-dynamic";

type TaskWithType = Task & { task_types: Pick<TaskType, "name" | "slug"> | null };

export default async function MyJobsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/jobs");

  const { data } = await supabase
    .from("tasks")
    .select("*, task_types(name, slug)")
    .eq("doer_id", user.id)
    .order("created_at", { ascending: false });

  const all = (data as TaskWithType[]) ?? [];
  const active = all.filter((t) => ACTIVE_TASK_STATUSES.includes(t.status));
  const history = all.filter((t) => TERMINAL_STATUSES.includes(t.status));

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-6 py-10">
      <MyJobsRealtime userId={user.id} />
      <div>
        <h1 className="text-2xl font-semibold">My jobs</h1>
        <p className="text-sm text-neutral-500">Tasks you&apos;ve claimed, active and past.</p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-medium">Active</h2>
        <TaskListSection tasks={active} emptyLabel="Nothing active — browse the job pool to claim one." />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">History</h2>
        <TaskListSection tasks={history} emptyLabel="No completed jobs yet." />
      </section>
    </div>
  );
}
