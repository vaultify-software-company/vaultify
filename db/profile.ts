import { supabase } from "@/lib/supabase/browser-client"
import { Tables, TablesInsert, TablesUpdate } from "@/supabase/types"

export const getProfileById = async (profileId: string) => {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  if (!profile) {
    throw new Error("Profile not found for the user")
  }

  return profile
}

export const getProfileByUserId = async (userId: string) => {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  if (!profile) {
    throw new Error("Profile not found for the user")
  }

  return profile
}

export const getProfilesByUserId = async (userId: string) => {
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)

  if (!profiles) {
    throw new Error(error.message)
  }

  return profiles
}

export const getProfilesByRoleId = async (roleId: string) => {
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role_id", roleId)
    .order("display_name", { ascending: true })

  if (!profiles) {
    throw new Error(error.message)
  }

  return profiles
}

export const createProfile = async (profile: TablesInsert<"profiles">) => {
  const { data: createdProfile, error } = await supabase
    .from("profiles")
    .insert([profile])
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return createdProfile
}

export const updateProfile = async (
  profileId: string,
  profile: TablesUpdate<"profiles">
) => {
  const { data: updatedProfile, error } = await supabase
    .from("profiles")
    .update(profile)
    .eq("id", profileId)
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return updatedProfile
}

export const deleteProfile = async (profileId: string) => {
  const { error } = await supabase.from("profiles").delete().eq("id", profileId)

  if (error) {
    throw new Error(error.message)
  }

  return true
}

export const updateProfileByOrganization = async (
  userId: string,
  roleId: string,
  profile: Tables<"profiles">,
  organization: Tables<"organizations">,
  name?: string,
  is_verified?: boolean
) => {
  const updateProfilePayload: TablesUpdate<"profiles"> = {
    ...profile,
    has_onboarded: is_verified ? false : true,
    display_name: organization.display_name,
    name: name ? name : organization.display_name,
    openai_api_key: organization.openai_api_key,
    openai_organization_id: organization.openai_organization_id,
    anthropic_api_key: organization.anthropic_api_key,
    google_gemini_api_key: organization.google_gemini_api_key,
    mistral_api_key: organization.mistral_api_key,
    groq_api_key: organization.groq_api_key,
    perplexity_api_key: organization.perplexity_api_key,
    openrouter_api_key: organization.openrouter_api_key,
    use_azure_openai: organization.use_azure_openai,
    azure_openai_api_key: organization.azure_openai_api_key,
    azure_openai_endpoint: organization.azure_openai_endpoint,
    azure_openai_35_turbo_id: organization.azure_openai_35_turbo_id,
    azure_openai_45_turbo_id: organization.azure_openai_45_turbo_id,
    azure_openai_45_vision_id: organization.azure_openai_45_vision_id,
    azure_openai_embeddings_id: organization.azure_openai_embeddings_id,
    organization_id: organization.id,
    role_id: roleId,
    is_verified: is_verified
  }

  const { data: updatedProfile, error } = await supabase
    .from("profiles")
    .update(updateProfilePayload)
    .eq("user_id", userId)
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return updatedProfile
}
