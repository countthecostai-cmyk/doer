import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TaskActions } from "@/components/TaskActions";
import { TaskMessages } from "@/components/TaskMessages";
import { STATUS_LABELS, type TaskStatus } from "@/lib/task-state-machine";
import { formatCents } from "@/lib/pricing";
import type { DoerProfile, Message, Task, TaskStatusHistoryRow, TaskType } from "@/lib/database.types";

export const dynamic = "force-dynamic";

function navigateUrl(task: Pick<Task, "lat" | "lng" | "address">): string {
  const destination = task.lat != null && task.lng != null ? `${task.lat},${task.lng}` : task.address;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

export default async function TaskDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ payment_error?: string }>;
}) {
  const { id } = await params;
  const { payment_error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?next=/tasks/${id}`);

  const { data: taskData } = await supabase
    .from("tasks")
    .select("*, task_types(*), requester:profiles!tasks_requester_id_fkey(full_name)")
    .eq("id", id)
    .maybeSingle();

  if (!taskData) notFound();

  const task = taskData as unknown as Task & {
    task_types: TaskType | null;
    requester: { full_name: string | null } | null;
  };

  const { data: doerProfileData } = await supabase
    .from("doer_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  const doerProfile = doerProfileData as DoerProfile | null;
  const isApprovedDoer = doerProfile?.status === "approved";

  const { data: history } = await supabase
    .from("task_status_history")
    .select("*")
    .eq("task_id", id)
    .order("created_at", { ascending: true });

  let photoUrl: string | null = null;
  if (task.completion_photo_url) {
    const { data: signed } = await supabase.storage
      .from("task-photos")
      .createSignedUrl(task.completion_photo_url, 3600);
    photoUrl = signed?.signedUrl ?? null;
  }

  const isAssignedDoer = task.doer_id === user.id;
  const canClaim = isApprovedDoer && !task.doer_id;
  const canMessage = isAssignedDoer && !!task.requester_id && !!task.doer_id;

  let initialMessages: Message[] = [];
  if (canMessage) {
    const { data: messagesData } = await supabase
      .from("messages")
      .select("*")
      .eq("task_id", id)
      .order("created_at", { ascending: true });
    initialMessages = (messagesData as Message[]) ?? [];
  }

  const requesterFirstName = task.requester?.full_name?.split(" ")[0] ?? "the Requester";

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-10">
      {payment_error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          This task is confirmed, but payment couldn&apos;t be started automatically. An admin will need to
          resolve it.
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{task.task_types?.name ?? task.title}</h1>
          <p className="text-sm text-neutral-500">{task.address}</p>
        </div>
        <span className="shrink-0 rounded-full bg-neutral-900 px-3 py-1 text-xs font-medium text-white">
          {STATUS_LABELS[task.status]}
        </span>
      </div>

      <a
        href={navigateUrl(task)}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-center text-sm font-medium text-neutral-900 hover:bg-neutral-50"
      >
        📍 Navigate
      </a>

      <div className="grid grid-cols-2 gap-4 rounded-lg border border-neutral-200 bg-white p-4 text-sm">
        <div>
          <p className="text-neutral-500">You&apos;ll earn</p>
          <p className="font-medium">{formatCents(task.doer_payout_cents, task.currency)}</p>
        </div>
        <div>
          <p className="text-neutral-500">Requester</p>
          <p className="font-medium">{task.requester?.full_name?.split(" ")[0] ?? "—"}</p>
        </div>
        {task.quantity != null && task.task_types?.unit_label && (
          <div>
            <p className="text-neutral-500">Quantity</p>
            <p className="font-medium">
              {task.quantity} {task.task_types.unit_label}
              {task.quantity === 1 ? "" : "s"}
            </p>
          </div>
        )}
        {task.scheduled_at && (
          <div>
            <p className="text-neutral-500">Scheduled</p>
            <p className="font-medium">{new Date(task.scheduled_at).toLocaleString()}</p>
          </div>
        )}
      </div>

      {task.description && (
        <p className="rounded-lg bg-neutral-50 p-3 text-sm text-neutral-700">{task.description}</p>
      )}

      {task.requires_photo_proof && (
        <p className="text-xs text-neutral-500">This task requires a completion photo before it can be marked done.</p>
      )}

      {photoUrl && (
        <div>
          <p className="mb-2 text-sm font-medium text-neutral-700">Completion photo</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoUrl} alt="Completion proof" className="w-full rounded-lg border border-neutral-200" />
          {task.completion_note && <p className="mt-2 text-sm text-neutral-600">{task.completion_note}</p>}
        </div>
      )}

      <TaskActions
        taskId={task.id}
        status={task.status}
        requiresPhotoProof={task.requires_photo_proof}
        isAssignedDoer={isAssignedDoer}
        canClaim={canClaim}
      />

      {canMessage && (
        <TaskMessages
          taskId={task.id}
          currentUserId={user.id}
          otherPartyName={requesterFirstName}
          initialMessages={initialMessages}
        />
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold text-neutral-700">Timeline</h2>
        <ol className="space-y-3 border-l border-neutral-200 pl-4">
          {((history as TaskStatusHistoryRow[]) ?? []).map((h) => (
            <li key={h.id} className="text-sm">
              <p className="font-medium text-neutral-900">{STATUS_LABELS[h.status as TaskStatus] ?? h.status}</p>
              <p className="text-xs text-neutral-500">
                {new Date(h.created_at).toLocaleString()} · {h.changed_by_actor}
              </p>
              {h.note && <p className="text-xs text-neutral-600">{h.note}</p>}
            </li>
          ))}
        </ol>
      </div>

      <Link href="/jobs" className="block text-sm font-medium text-neutral-500 underline">
        ← Back to my jobs
      </Link>
    </div>
  );
}
