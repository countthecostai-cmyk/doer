"use server";

import { createClient } from "@/lib/supabase/server";
import { transitionTask, TransitionConflictError, IllegalTransitionError } from "@/lib/task-transitions";
import { notify } from "@/lib/notify";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Task } from "@/lib/database.types";

// Doer app only — the Requester-only transitions (`completed -> payout_pending`
// via confirmCompletion, `completed -> disputed` via reportCompletionProblem;
// see TRANSITION_ACTORS in task-state-machine.ts) live in the Done (customer)
// app, not here. Do not re-add them without re-checking that actor map.

function friendlyError(e: unknown): string {
  if (e instanceof TransitionConflictError || e instanceof IllegalTransitionError) {
    return e.message;
  }
  console.error(e);
  return "Something went wrong. Please try again.";
}

// acceptTask/startTask/markEnRoute/markArrived are invoked directly as
// <form action> references (no local error UI), so per the Next.js
// data-security guidance for destructive/state-changing actions with no
// inline error display, failures throw (a loud failure, caught by the
// nearest error boundary) rather than returning a value — a value returned
// from a bare `<form action>` isn't rendered anywhere anyway, and Next's
// `action` prop type requires void | Promise<void>. A claim conflict
// (someone else already took the task) surfaces via TransitionConflictError's
// message in that boundary.

export async function acceptTask(taskId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");

  const task = await transitionTask<Partial<Task>>(supabase, {
    taskId,
    from: "matching",
    to: "accepted",
    actor: "doer",
    changedByUser: user.id,
    extraPatch: { doer_id: user.id },
  });
  await notify(
    task.requester_id,
    "task_accepted",
    "A Doer accepted your task",
    "Your task has been claimed and will begin soon."
  );

  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/pool");
  revalidatePath("/jobs");
  revalidatePath("/dashboard");
  redirect(`/tasks/${taskId}`);
}

export async function markEnRoute(taskId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");

  const { data: current } = await supabase.from("tasks").select("status").eq("id", taskId).maybeSingle();
  if (!current) throw new Error("Task not found.");
  const from = current.status === "scheduled" ? "scheduled" : "accepted";

  const task = await transitionTask<Partial<Task>>(supabase, {
    taskId,
    from,
    to: "en_route",
    actor: "doer",
    changedByUser: user.id,
  });
  await notify(task.requester_id, "task_en_route", "Your Doer is on the way");

  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/jobs");
}

export async function markArrived(taskId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");

  const task = await transitionTask<Partial<Task>>(supabase, {
    taskId,
    from: "en_route",
    to: "arrived",
    actor: "doer",
    changedByUser: user.id,
  });
  await notify(task.requester_id, "task_arrived", "Your Doer has arrived");

  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/jobs");
}

/** Starts the work. Valid from "accepted" (skip travel states) or "arrived". */
export async function startTask(taskId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");

  const { data: task } = await supabase.from("tasks").select("status").eq("id", taskId).maybeSingle();
  if (!task) throw new Error("Task not found.");
  const from = task.status === "arrived" ? "arrived" : "accepted";

  await transitionTask(supabase, {
    taskId,
    from,
    to: "in_progress",
    actor: "doer",
    changedByUser: user.id,
  });

  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/jobs");
}

export async function completeTask(
  taskId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data: task } = await supabase
    .from("tasks")
    .select("requires_photo_proof")
    .eq("id", taskId)
    .maybeSingle();
  if (!task) return { error: "Task not found." };

  const photo = formData.get("photo") as File | null;
  const note = String(formData.get("note") ?? "").slice(0, 2000);

  // The Doer marking a task complete must never be sufficient on its own to
  // trigger payout — proof is required server-side, not just hinted at in
  // the UI (see payout trust gate in the architecture doc).
  if (task.requires_photo_proof && (!photo || photo.size === 0)) {
    return { error: "A completion photo is required for this task type." };
  }

  let completionPhotoUrl: string | null = null;
  if (photo && photo.size > 0) {
    const ext = photo.name.split(".").pop() ?? "jpg";
    const path = `${taskId}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("task-photos")
      .upload(path, photo, { contentType: photo.type, upsert: false });
    if (uploadError) return { error: `Photo upload failed: ${uploadError.message}` };
    completionPhotoUrl = path;
  }

  try {
    const updated = await transitionTask<Partial<Task>>(supabase, {
      taskId,
      from: "in_progress",
      to: "completed",
      actor: "doer",
      changedByUser: user.id,
      note: note || undefined,
      extraPatch: {
        completion_photo_url: completionPhotoUrl,
        completion_note: note || null,
      },
    });
    await notify(
      updated.requester_id,
      "task_completed",
      "Your task is marked complete",
      "Review the completion photo and confirm to release payment."
    );
  } catch (e) {
    return { error: friendlyError(e) };
  }

  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/jobs");
  return {};
}

export async function cancelTask(taskId: string, formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  const reason = String(formData.get("reason") ?? "").trim();

  const { data: task } = await supabase.from("tasks").select("*").eq("id", taskId).maybeSingle();
  if (!task) return { error: "Task not found." };
  if (task.doer_id !== user.id) return { error: "Only the assigned Doer can cancel from here." };

  try {
    await transitionTask(supabase, {
      taskId,
      from: task.status,
      to: "cancelled",
      actor: "doer",
      changedByUser: user.id,
      note: reason || undefined,
      extraPatch: { cancellation_reason: reason || null },
    });
  } catch (e) {
    return { error: friendlyError(e) };
  }

  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/jobs");
  revalidatePath("/dashboard");
  return {};
}
