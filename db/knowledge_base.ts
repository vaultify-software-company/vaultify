import { supabase } from "@/lib/supabase/browser-client"

export async function getKnowledgeBase(user_id: string) {
  const { data, error } = await supabase
    .from("knowledge_base")
    .select("*")
    .eq("user_id", user_id)
    .single()

  if (error) {
    return null
  }

  return data
}

export async function createKnowledgeBase(knowledge_base: any) {
  const { data, error } = await supabase
    .from("knowledge_base")
    .insert(knowledge_base)
    .select("*")
    .single()

  if (error) {
    return null
  }

  return data
}

export async function updateKnowledgeBase(knowledge_base: any, id: string) {
  const { data, error } = await supabase
    .from("knowledge_base")
    .update(knowledge_base)
    .eq("id", id)
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}
