import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AvailabilityToggle } from "@/components/AvailabilityToggle";
import { ProfileForm } from "@/components/ProfileForm";
import type { DoerProfile, Profile } from "@/lib/database.types";

export const dynamic = "force-dynamic";

const STATUS_COPY: Record<DoerProfile["status"], { label: string; tone: string }> = {
  pending: { label: "Application pending", tone: "bg-amber-50 text-amber-800 border-amber-200" },
  approved: { label: "Approved", tone: "bg-green-50 text-green-800 border-green-200" },
  rejected: { label: "Not approved", tone: "bg-red-50 text-red-800 border-red-200" },
  suspended: { label: "Suspended", tone: "bg-red-50 text-red-800 border-red-200" },
};

function VerificationBadge({ label, ok, pendingLabel }: { label: string; ok: boolean; pendingLabel: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm">
      <span className="text-neutral-700">{label}</span>
      <span className={ok ? "font-medium text-green-700" : "text-neutral-500"}>
        {ok ? "Verified" : pendingLabel}
      </span>
    </div>
  );
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/profile");

  const [{ data: profileData }, { data: doerProfileData }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("doer_profiles").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  const profile = profileData as Profile | null;
  const doerProfile = doerProfileData as DoerProfile | null;

  if (!doerProfile) {
    return (
      <div className="mx-auto max-w-lg px-6 py-10">
        <h1 className="mb-1 text-2xl font-semibold">Profile</h1>
        <p className="mb-6 text-sm text-neutral-500">
          You haven&apos;t applied to be a Doer yet.
        </p>
        <Link
          href="/doer/apply"
          className="inline-block rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Apply to be a Doer
        </Link>
      </div>
    );
  }

  const statusCopy = STATUS_COPY[doerProfile.status];

  return (
    <div className="mx-auto max-w-lg space-y-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="text-sm text-neutral-500">Your application status, verification, and details.</p>
      </div>

      <div className={`rounded-lg border px-4 py-3 text-sm font-medium ${statusCopy.tone}`}>
        {statusCopy.label}
      </div>

      {doerProfile.status === "approved" && <AvailabilityToggle initial={doerProfile.is_available} />}

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-neutral-700">Verification</h2>
        <VerificationBadge label="Identity" ok={doerProfile.identity_verified} pendingLabel="Not yet verified" />
        <VerificationBadge
          label="Background check"
          ok={doerProfile.background_check_status === "clear"}
          pendingLabel={
            doerProfile.background_check_status === "flagged"
              ? "Flagged — contact support"
              : doerProfile.background_check_status === "pending"
                ? "In progress"
                : "Not started"
          }
        />
        <p className="px-1 text-xs text-neutral-400">
          Verification status is set by Done and can&apos;t be edited here.
        </p>
      </div>

      {doerProfile.rating_count > 0 && (
        <div className="rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm">
          <span className="font-medium text-neutral-900">
            ⭐ {doerProfile.rating_avg?.toFixed(1) ?? "—"}
          </span>{" "}
          <span className="text-neutral-500">
            ({doerProfile.rating_count} {doerProfile.rating_count === 1 ? "review" : "reviews"})
          </span>
        </div>
      )}

      <div>
        <h2 className="mb-2 text-sm font-semibold text-neutral-700">Your details</h2>
        <ProfileForm fullName={profile?.full_name ?? null} phone={profile?.phone ?? null} bio={doerProfile.bio} />
      </div>

      <Link href="/doer/payouts" className="block text-sm font-medium text-neutral-900 underline">
        Manage payouts →
      </Link>
    </div>
  );
}
