import { supabase } from "@/lib/supabase/browser-client"
import { Tables, TablesInsert, TablesUpdate } from "@/supabase/types"
import { getProfileById } from "./profile"

export const getHomeWorkspaceByUserId = async (userId: string) => {
  const { data: homeWorkspace, error } = await supabase
    .from("workspaces")
    .select("*")
    .eq("user_id", userId)
    .eq("is_home", true)
    .single()

  if (!homeWorkspace) {
    throw new Error(error.message)
  }

  return homeWorkspace.id
}

export const getWorkspaceById = async (workspaceId: string) => {
  const { data: workspace, error } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .single()

  if (!workspace) {
    throw new Error(error.message)
  }

  return workspace
}

export const getWorkspacesByUserId = async (userId: string) => {
  const { data: workspaces, error } = await supabase
    .from("workspaces")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (!workspaces) {
    throw new Error(error.message)
  }

  return workspaces
}

export const getProfileWorkspacesByProfileId = async (profileId: string) => {
  const profile = await getProfileById(profileId)
  const { data: workspaces, error } = await supabase
    .from("workspaces")
    .select("*")
    .eq("user_id", profile.user_id)
    .order("created_at", { ascending: false })

  if (!workspaces) {
    throw new Error(error.message)
  }

  return workspaces
}

export const createWorkspace = async (
  workspace: TablesInsert<"workspaces">
) => {
  const { data: createdWorkspace, error } = await supabase
    .from("workspaces")
    .insert([workspace])
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return createdWorkspace
}

export const updateWorkspace = async (
  workspaceId: string,
  workspace: TablesUpdate<"workspaces">
) => {
  const { data: updatedWorkspace, error } = await supabase
    .from("workspaces")
    .update(workspace)
    .eq("id", workspaceId)
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return updatedWorkspace
}

export const updateWorkspaceByUserId = async (
  userId: string,
  workspace: TablesUpdate<"workspaces">
) => {
  const { data: updatedWorkspace, error } = await supabase
    .from("workspaces")
    .update(workspace)
    .eq("user_id", userId)
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return updatedWorkspace
}

export const deleteWorkspace = async (workspaceId: string) => {
  const { error } = await supabase
    .from("workspaces")
    .delete()
    .eq("id", workspaceId)

  if (error) {
    throw new Error(error.message)
  }

  return true
}

export const updateWorkspaceByOrganization = async (
  userId: string,
  organization: Tables<"organizations">
) => {
  const updateWorkspacePayload: TablesUpdate<"workspaces"> = {
    default_context_length: organization.default_context_length,
    default_model: organization.default_model,
    default_prompt: organization.default_prompt,
    default_temperature: organization.default_temperature
  }

  console.log({ userId })

  const { data: updatedWorkspace, error } = await supabase
    .from("workspaces")
    .update(updateWorkspacePayload)
    .eq("user_id", userId)
    .select("*")
    .single()

  console.log(error)

  if (error) {
    throw new Error(error.message)
  }

  return updatedWorkspace
}
