"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { subscribeToDoerTasks } from "@/lib/realtime";
import { STATUS_LABELS } from "@/lib/task-state-machine";
import { formatCents } from "@/lib/pricing";
import type { Task, TaskType } from "@/lib/database.types";

type TaskWithType = Task & { task_types: Pick<TaskType, "name" | "slug"> | null };

export function MyJobsRealtime({ userId }: { userId: string }) {
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const unsubscribe = subscribeToDoerTasks(supabase, userId, () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => router.refresh(), 400);
    });
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      unsubscribe();
    };
  }, [router, userId]);

  return null;
}

export function TaskListSection({ tasks, emptyLabel }: { tasks: TaskWithType[]; emptyLabel: string }) {
  if (tasks.length === 0) {
    return <p className="text-sm text-neutral-500">{emptyLabel}</p>;
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
            </div>
            <div className="shrink-0 text-right">
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
