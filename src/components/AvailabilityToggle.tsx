"use client";

import { useState, useTransition } from "react";
import { setAvailability } from "@/app/profile/actions";

export function AvailabilityToggle({ initial }: { initial: boolean }) {
  const [available, setAvailableLocal] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    const next = !available;
    setAvailableLocal(next); // optimistic
    setError(null);
    startTransition(async () => {
      const result = await setAvailability(next);
      if (result?.error) {
        setAvailableLocal(!next); // revert
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-4">
      <div>
        <p className="text-sm font-medium text-neutral-900">Available for work</p>
        <p className="text-xs text-neutral-500">
          For your reference only — every open task stays visible to you either way.
        </p>
        {error && <p role="alert" className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={available}
        disabled={pending}
        onClick={toggle}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
          available ? "bg-green-600" : "bg-neutral-300"
        }`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
            available ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
