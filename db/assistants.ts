import { supabase } from "@/lib/supabase/browser-client"
import { TablesInsert, TablesUpdate } from "@/supabase/types"

export const getAssistantById = async (assistantId: string) => {
  const { data: assistant, error } = await supabase
    .from("assistants")
    .select("*")
    .eq("id", assistantId)
    .single()

  if (!assistant) {
    throw new Error(error.message)
  }

  return assistant
}

export const getAssistantWorkspacesByWorkspaceId = async (
  workspaceId: string
) => {
  try {
    const { data: workspace, error } = await supabase
      .from("workspaces")
      .select(
        `
        id,
        name,
        user_id,
        assistants (*)
      `
      )
      .eq("id", workspaceId)
      .single()

    if (error) {
      throw new Error(error.message)
    }

    if (!workspace) {
      throw new Error(`Workspace with ID ${workspaceId} not found.`)
    }

    if (workspace.assistants.length === 0) {
      // Fetch profile of workspace owner
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", workspace.user_id)
        .single()

      if (profileError) {
        throw new Error(profileError.message)
      }

      if (profile) {
        // Find organization admin
        const { data: orgAdmins, error: orgAdminsError } = await supabase
          .from("profiles")
          .select("*, roles(*)")
          .eq("organization_id", profile.organization_id)

        if (orgAdminsError) {
          throw new Error(orgAdminsError.message)
        }

        const admin = orgAdmins?.find(admin => admin.roles?.name === "admin")

        if (admin) {
          // Fetch assistant linked to admin
          const { data: assistants, error: assistantsError } = await supabase
            .from("assistants")
            .select("*")
            .eq("user_id", admin.user_id)

          if (assistantsError) {
            throw new Error(assistantsError.message)
          }

          return { assistants: assistants || [] }
        }
      }
    }

    return workspace
  } catch (error: any) {
    throw new Error(
      `Error in getAssistantWorkspacesByWorkspaceId: ${error.message}`
    )
  }
}

export const getAssistantWorkspacesByAssistantId = async (
  assistantId: string
) => {
  const { data: assistant, error } = await supabase
    .from("assistants")
    .select(
      `
      id, 
      name, 
      workspaces (*)
    `
    )
    .eq("id", assistantId)
    .single()

  if (!assistant) {
    throw new Error(error.message)
  }

  return assistant
}

export const createAssistant = async (
  assistant: TablesInsert<"assistants">,
  workspace_id: string
) => {
  const { data: createdAssistant, error } = await supabase
    .from("assistants")
    .insert([assistant])
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  await createAssistantWorkspace({
    user_id: createdAssistant.user_id,
    assistant_id: createdAssistant.id,
    workspace_id
  })

  return createdAssistant
}

export const createAssistants = async (
  assistants: TablesInsert<"assistants">[],
  workspace_id: string
) => {
  const { data: createdAssistants, error } = await supabase
    .from("assistants")
    .insert(assistants)
    .select("*")

  if (error) {
    throw new Error(error.message)
  }

  await createAssistantWorkspaces(
    createdAssistants.map(assistant => ({
      user_id: assistant.user_id,
      assistant_id: assistant.id,
      workspace_id
    }))
  )

  return createdAssistants
}

export const createAssistantWorkspace = async (item: {
  user_id: string
  assistant_id: string
  workspace_id: string
}) => {
  const { data: createdAssistantWorkspace, error } = await supabase
    .from("assistant_workspaces")
    .insert([item])
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return createdAssistantWorkspace
}

export const createAssistantWorkspaces = async (
  items: { user_id: string; assistant_id: string; workspace_id: string }[]
) => {
  const { data: createdAssistantWorkspaces, error } = await supabase
    .from("assistant_workspaces")
    .insert(items)
    .select("*")

  if (error) throw new Error(error.message)

  return createdAssistantWorkspaces
}

export const updateAssistant = async (
  assistantId: string,
  assistant: TablesUpdate<"assistants">
) => {
  const { data: updatedAssistant, error } = await supabase
    .from("assistants")
    .update(assistant)
    .eq("id", assistantId)
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return updatedAssistant
}

export const deleteAssistant = async (assistantId: string) => {
  const { error } = await supabase
    .from("assistants")
    .delete()
    .eq("id", assistantId)

  if (error) {
    throw new Error(error.message)
  }

  return true
}

export const deleteAssistantWorkspace = async (
  assistantId: string,
  workspaceId: string
) => {
  const { error } = await supabase
    .from("assistant_workspaces")
    .delete()
    .eq("assistant_id", assistantId)
    .eq("workspace_id", workspaceId)

  if (error) throw new Error(error.message)

  return true
}
