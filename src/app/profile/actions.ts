"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Availability is purely "am I actively working right now" — shown to the
 * Doer themselves (and to Admin). It must never gate open-pool visibility;
 * see the schema comment on doer_profiles.is_available and the architecture
 * doc's "open-pool visibility" lesson. This action only ever writes
 * doer_profiles.is_available, nothing that touches task visibility.
 */
export async function setAvailability(isAvailable: boolean): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("doer_profiles")
    .update({ is_available: isAvailable })
    .eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return {};
}

export async function updateProfile(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const fullName = String(formData.get("full_name") ?? "").trim().slice(0, 200);
  const phone = String(formData.get("phone") ?? "").trim().slice(0, 40);
  const bio = String(formData.get("bio") ?? "").trim().slice(0, 2000);

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: fullName || null, phone: phone || null })
    .eq("id", user.id);
  if (profileError) return { error: profileError.message };

  const { error: doerError } = await supabase
    .from("doer_profiles")
    .update({ bio: bio || null })
    .eq("user_id", user.id);
  if (doerError) return { error: doerError.message };

  revalidatePath("/profile");
  return { success: true };
}
