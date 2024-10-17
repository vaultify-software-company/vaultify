import { supabase } from "@/lib/supabase/browser-client"
import { toast } from "sonner"

export const uploadFile = async (
  file: File,
  payload: {
    name: string
    title: string
    user_id: string
    file_id: string
  }
) => {
  const SIZE_LIMIT = parseInt("50000000")

  if (file.size > SIZE_LIMIT) {
    throw new Error(
      `File must be less than ${Math.floor(SIZE_LIMIT / 1000000)}MB`
    )
  }

  const filePath = `${payload.user_id}/${Buffer.from(payload.file_id).toString("base64")}`

  const { error } = await supabase.storage
    .from("files")
    .upload(filePath, file, {
      upsert: true
    })

  if (error) {
    throw new Error("Error uploading file")
  }

  return filePath
}

export const deleteFileFromStorage = async (filePath: string) => {
  const { error } = await supabase.storage.from("files").remove([filePath])

  if (error) {
    toast.error("Failed to remove file!")
    return
  }
}

export const getFileFromStorage = async (filePath: string) => {
  const response = await supabase.storage
    .from("files")
    .createSignedUrl(filePath, 60 * 60 * 24) // 24hrs

  return response
}
