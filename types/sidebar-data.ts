import { Tables } from "@/supabase/types"

export type DataListType =
  | Tables<"collections">[]
  | Tables<"chats">[]
  | Tables<"presets">[]
  | Tables<"prompts">[]
  | Tables<"profiles">[]
  | Tables<"files">[]
  | Tables<"assistants">[]
  | Tables<"tools">[]
  | Tables<"models">[]

export type DataItemType =
  | Tables<"collections">
  | Tables<"chats">
  | Tables<"presets">
  | Tables<"prompts">
  | Tables<"profiles">
  | Tables<"files">
  | Tables<"assistants">
  | Tables<"tools">
  | Tables<"models">
