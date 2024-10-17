import { supabase } from "@/lib/supabase/browser-client"
import { TablesInsert, TablesUpdate } from "@/supabase/types"

export const getOrganizationById = async (organizationId: string) => {
  const { data: organization, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", organizationId)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  if (!organization) {
    throw new Error("Organization not found for the user")
  }

  return organization
}

export const getOrganizations = async () => {
  const { data: organizations, error } = await supabase
    .from("organizations")
    .select("*")

  if (!organizations) {
    throw new Error(error.message)
  }

  return organizations
}

export const createOrganization = async (
  organization: TablesInsert<"organizations">
) => {
  const { data: createdOrganization, error } = await supabase
    .from("organizations")
    .insert([organization])
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return createdOrganization
}

export const updateOrganization = async (
  organizationId: string,
  organization: TablesUpdate<"organizations">
) => {
  const { data: updatedOrganization, error } = await supabase
    .from("organizations")
    .update(organization)
    .eq("id", organizationId)
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return updatedOrganization
}

// export const deleteProfile = async (profileId: string) => {
//   const { error } = await supabase
//     .from("organizations")
//     .delete()
//     .eq("id", profileId)

//   if (error) {
//     throw new Error(error.message)
//   }

//   return true
// }
