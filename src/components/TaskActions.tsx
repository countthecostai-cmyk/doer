"use client";

import { useActionState, useState } from "react";
import { acceptTask, markEnRoute, markArrived, startTask, completeTask, cancelTask } from "@/app/tasks/actions";
import type { TaskStatus } from "@/lib/task-state-machine";

// Doer-only action gating — mirrors TRANSITION_ACTORS for actor "doer".
// Never render a button for a move the state machine doesn't allow a doer
// to initiate from the current status; RLS is the real enforcement, this is
// just so the UI doesn't dangle a dead button.
const DOER_CANCELLABLE_STATUSES: TaskStatus[] = [
  "accepted",
  "scheduled",
  "en_route",
  "arrived",
  "in_progress",
];

export function TaskActions({
  taskId,
  status,
  requiresPhotoProof,
  isAssignedDoer,
  canClaim,
}: {
  taskId: string;
  status: TaskStatus;
  requiresPhotoProof: boolean;
  isAssignedDoer: boolean;
  canClaim: boolean;
}) {
  if (canClaim && status === "matching") {
    return (
      <form action={acceptTask.bind(null, taskId)}>
        <button className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800">
          Accept this task
        </button>
      </form>
    );
  }

  if (!isAssignedDoer) return null;

  return (
    <div className="space-y-3">
      {status === "accepted" && (
        <div className="grid grid-cols-2 gap-2">
          <form action={markEnRoute.bind(null, taskId)}>
            <button className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-900 hover:bg-neutral-50">
              On my way
            </button>
          </form>
          <form action={startTask.bind(null, taskId)}>
            <button className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800">
              Start task
            </button>
          </form>
        </div>
      )}

      {status === "scheduled" && (
        <form action={markEnRoute.bind(null, taskId)}>
          <button className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-900 hover:bg-neutral-50">
            On my way
          </button>
        </form>
      )}

      {status === "en_route" && (
        <form action={markArrived.bind(null, taskId)}>
          <button className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800">
            I&apos;ve arrived
          </button>
        </form>
      )}

      {status === "arrived" && (
        <form action={startTask.bind(null, taskId)}>
          <button className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800">
            Start task
          </button>
        </form>
      )}

      {status === "in_progress" && <CompleteForm taskId={taskId} requiresPhotoProof={requiresPhotoProof} />}

      {DOER_CANCELLABLE_STATUSES.includes(status) && <CancelForm taskId={taskId} />}
    </div>
  );
}

function CompleteForm({
  taskId,
  requiresPhotoProof,
}: {
  taskId: string;
  requiresPhotoProof: boolean;
}) {
  const boundAction = async (
    prevState: { error?: string } | undefined,
    formData: FormData
  ) => completeTask(taskId, formData);
  const [state, formAction, pending] = useActionState(boundAction, undefined);

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4">
      <p className="text-sm font-medium text-neutral-900">Mark this task complete</p>
      <div>
        <label className="block text-xs font-medium text-neutral-600" htmlFor="photo">
          {requiresPhotoProof ? "Completion photo (required)" : "Completion photo (optional)"}
        </label>
        <input
          id="photo"
          name="photo"
          type="file"
          accept="image/*"
          capture="environment"
          required={requiresPhotoProof}
          className="mt-1 w-full text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-neutral-600" htmlFor="note">
          Note (optional)
        </label>
        <textarea id="note" name="note" rows={2} className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        {pending ? "Submitting…" : "Mark complete"}
      </button>
    </form>
  );
}

function CancelForm({ taskId }: { taskId: string }) {
  const boundAction = async (
    prevState: { error?: string } | undefined,
    formData: FormData
  ) => cancelTask(taskId, formData);
  const [state, formAction, pending] = useActionState(boundAction, undefined);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-500 hover:bg-neutral-50"
      >
        Cancel task
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-2 rounded-lg border border-neutral-200 bg-white p-4">
      <input
        name="reason"
        type="text"
        placeholder="Reason (optional)"
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
      />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {pending ? "Cancelling…" : "Confirm cancel"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-neutral-300 px-4 py-2 text-sm">
          Back
        </button>
      </div>
    </form>
  );
}
