import { supabase } from "@/lib/supabase/browser-client"
import { TablesInsert, TablesUpdate } from "@/supabase/types"

export const getRoleById = async (roleId: string) => {
  const { data: role, error } = await supabase
    .from("roles")
    .select("*")
    .eq("id", roleId)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  if (!role) {
    throw new Error("Role not found")
  }

  return role
}

export const getRoleByName = async (roleName: string) => {
  const { data: role, error } = await supabase
    .from("roles")
    .select("*")
    .eq("name", roleName)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  if (!role) {
    throw new Error("Role not found")
  }

  return role
}

export const getRoles = async () => {
  const { data: roles, error } = await supabase.from("roles").select("*")

  if (!roles) {
    throw new Error(error.message)
  }

  return roles
}

export const createOrganization = async (role: TablesInsert<"roles">) => {
  const { data: createdRole, error } = await supabase
    .from("roles")
    .insert([role])
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return createdRole
}
