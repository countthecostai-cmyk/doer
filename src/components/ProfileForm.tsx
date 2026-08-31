"use client";

import { useActionState } from "react";
import { updateProfile } from "@/app/profile/actions";

export function ProfileForm({
  fullName,
  phone,
  bio,
}: {
  fullName: string | null;
  phone: string | null;
  bio: string | null;
}) {
  const [state, formAction, pending] = useActionState(updateProfile, undefined);

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-neutral-200 bg-white p-6">
      <div>
        <label className="block text-sm font-medium text-neutral-700" htmlFor="full_name">
          Full name
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          defaultValue={fullName ?? ""}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-700" htmlFor="phone">
          Phone
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={phone ?? ""}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-700" htmlFor="bio">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          defaultValue={bio ?? ""}
          placeholder="What kind of tasks are you great at?"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>
      {state?.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-700">Saved.</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
