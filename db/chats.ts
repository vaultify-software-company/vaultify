import { supabase } from "@/lib/supabase/browser-client"
import { TablesInsert, TablesUpdate } from "@/supabase/types"

export const getChatById = async (chatId: string) => {
  const { data: chat } = await supabase
    .from("chats")
    .select("*")
    .eq("id", chatId)
    .maybeSingle()

  return chat
}

export const getChatsByWorkspaceId = async (workspaceId: string) => {
  const { data: chats, error } = await supabase
    .from("chats")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })

  if (!chats) {
    throw new Error(error.message)
  }

  return chats
}

export const createChat = async (chat: TablesInsert<"chats">) => {
  const { data: createdChat, error } = await supabase
    .from("chats")
    .insert([chat])
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return createdChat
}

export const createChats = async (chats: TablesInsert<"chats">[]) => {
  const { data: createdChats, error } = await supabase
    .from("chats")
    .insert(chats)
    .select("*")

  if (error) {
    throw new Error(error.message)
  }

  return createdChats
}

export const updateChat = async (
  chatId: string,
  chat: TablesUpdate<"chats">
) => {
  const { data: updatedChat, error } = await supabase
    .from("chats")
    .update(chat)
    .eq("id", chatId)
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return updatedChat
}

export const deleteChat = async (chatId: string) => {
  const { error } = await supabase.from("chats").delete().eq("id", chatId)

  if (error) {
    throw new Error(error.message)
  }

  return true
}

export const createSharedChats = async (chatId: string) => {
  try {
    const { data: sharedChats, error: sharedChatsByIdError } = await supabase
      .from("shared_chats")
      .select("*")
      .eq("chat_id", chatId)
      .single()

    if (sharedChatsByIdError) {
      console.log(sharedChatsByIdError)
    }

    const { data, error } = await supabase
      .from("chats")
      .select("*")
      .eq("id", chatId)
      .single()
    if (error) {
      throw new Error(error.message)
    }

    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
    if (messagesError) {
      throw new Error(messagesError.message)
    }
    console.log(sharedChats)
    if (sharedChats) {
      const { data: updatedChat, error: updatedChatError } = await supabase
        .from("shared_chats")
        .update({
          messages: JSON.stringify(messages)
        })
        .eq("id", sharedChats.id)
        .select("*")
        .single()
      if (updatedChatError) {
        console.log(updatedChatError)
      }
      if (updatedChat) return updatedChat
    }

    const sharedChat = {
      chat_id: chatId,
      chat_name: data?.name,
      user_id: data?.user_id,
      created_at: new Date().toISOString(),
      messages: JSON.stringify(messages)
    }

    const { data: sharedChatData, error: sharedChatsError } = await supabase
      .from("shared_chats")
      .insert({
        ...sharedChat
      })
      .select("*")
      .single()

    if (sharedChatsError) {
      throw new Error(sharedChatsError.message)
    }

    return sharedChatData
  } catch (error) {
    console.log(error)
    throw new Error("Error creating shared chat")
  }
}

export const getSharedChats = async (id: string) => {
  try {
    const { data: shared_chats, error } = await supabase
      .from("shared_chats")
      .select("*")
      .eq("id", id)
      .single()
    if (error) {
      throw new Error(error.message)
    }
    return shared_chats
  } catch (err) {
    console.log(err)
    throw new Error("Error getting shared chats")
  }
}
