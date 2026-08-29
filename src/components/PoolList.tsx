"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { subscribeToOpenPool } from "@/lib/realtime";
import { STATUS_LABELS } from "@/lib/task-state-machine";
import { formatCents } from "@/lib/pricing";
import type { Task, TaskType } from "@/lib/database.types";

type TaskWithType = Task & { task_types: Pick<TaskType, "name" | "slug"> | null };

/**
 * Live-updating open job pool. The realtime channel is deliberately
 * unfiltered server-side (see subscribeToOpenPool) — RLS already restricts
 * what actually reaches this client, so any change event on `tasks` is a
 * cue to re-fetch the RLS-filtered, joined list from the server rather than
 * trying to patch a partial payload into shape client-side.
 */
export function PoolList({ tasks }: { tasks: TaskWithType[] }) {
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const unsubscribe = subscribeToOpenPool(supabase, () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => router.refresh(), 400);
    });
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      unsubscribe();
    };
  }, [router]);

  if (tasks.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-neutral-300 px-4 py-8 text-center text-sm text-neutral-500">
        No open tasks right now — check back soon. This list updates live.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-neutral-200 overflow-hidden rounded-lg border border-neutral-200 bg-white">
      {tasks.map((task) => (
        <li key={task.id}>
          <Link
            href={`/tasks/${task.id}`}
            className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-neutral-50"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-neutral-900">{task.task_types?.name ?? task.title}</p>
              <p className="truncate text-sm text-neutral-500">{task.address}</p>
              <p className="text-xs text-neutral-400">{STATUS_LABELS[task.status]}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-medium text-neutral-900">
                {formatCents(task.doer_payout_cents, task.currency)}
              </p>
              <span className="mt-1 inline-block rounded-lg bg-neutral-900 px-3 py-1 text-xs font-medium text-white">
                View
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
