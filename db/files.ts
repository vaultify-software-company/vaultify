import { supabase } from "@/lib/supabase/browser-client"
import { TablesInsert, TablesUpdate } from "@/supabase/types"
import mammoth from "mammoth"
import { toast } from "sonner"
import { uploadFile } from "./storage/files"

const FILE_NAME_REGEX =
  /[a-zA-Z0-9_]+(?:_[a-zA-Z0-9_]+)*\.(csv|json|md|pdf|txt|docx)\b/g

export const getFileById = async (fileId: string) => {
  const { data: file, error } = await supabase
    .from("files")
    .select("*")
    .eq("id", fileId)
    .single()

  if (!file) {
    throw new Error(error.message)
  }

  return file
}

export const getFileByName = async (fileName: string) => {
  const response = await supabase.from("files").select("*").eq("name", fileName)
  return response
}

export const getFileWorkspacesByWorkspaceId = async (workspaceId: string) => {
  const { data: workspace, error } = await supabase
    .from("workspaces")
    .select(
      `
      id,
      name,
      files (*)
    `
    )
    .eq("id", workspaceId)
    .single()

  if (!workspace) {
    throw new Error(error.message)
  }

  return workspace
}

export const getFileWorkspacesByFileId = async (fileId: string) => {
  const { data: file, error } = await supabase
    .from("files")
    .select(
      `
      id, 
      name, 
      workspaces (*)
    `
    )
    .eq("id", fileId)
    .single()

  if (!file) {
    throw new Error(error.message)
  }

  return file
}

export const createFileBasedOnExtension = async (
  file: File,
  fileRecord: TablesInsert<"files">,
  workspace_id: string,
  embeddingsProvider: "openai" | "local"
) => {
  const fileExtension = file.name.split(".").pop()

  if (fileExtension === "docx") {
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({
      arrayBuffer
    })

    return createDocXFile(
      result.value,
      file,
      fileRecord,
      workspace_id,
      embeddingsProvider
    )
  } else {
    return createFile(file, fileRecord, workspace_id, embeddingsProvider)
  }
}

// For non-docx files
export const createFile = async (
  file: File,
  fileRecord: TablesInsert<"files">,
  workspace_id: string,
  embeddingsProvider: "openai" | "local"
) => {
  // Generate a valid filename from the original file name
  let validFilename = fileRecord.name.replace(/[^a-z0-9.]/gi, "_").toLowerCase()
  const extension = file.name.split(".").pop()

  // Ensure the base name does not include the extension
  const baseName = validFilename.replace(/\.[^/.]+$/, "") // Remove any existing extension
  const maxBaseNameLength = 100 - (extension?.length || 0) - 1

  if (baseName.length > maxBaseNameLength) {
    fileRecord.name = baseName.substring(0, maxBaseNameLength) + "." + extension
  } else {
    fileRecord.name = baseName + "." + extension
  }

  if (!FILE_NAME_REGEX.test(baseName)) {
    fileRecord.name = baseName.replace(".", "_") + "." + extension
  }

  const { data: createdFile, error } = await supabase
    .from("files")
    .insert([fileRecord])
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  await createFileWorkspace({
    user_id: createdFile.user_id,
    file_id: createdFile.id,
    workspace_id
  })

  const filePath = await uploadFile(file, {
    name: createdFile.name,
    title: file.name,
    user_id: createdFile.user_id,
    file_id: createdFile.id
  })

  await updateFile(createdFile.id, {
    file_path: filePath
  })

  processFile(createdFile.id, embeddingsProvider, extension ? extension : "")

  const fetchedFile = await getFileById(createdFile.id)

  return fetchedFile
}

// // Handle docx files
export const createDocXFile = async (
  text: string,
  file: File,
  fileRecord: TablesInsert<"files">,
  workspace_id: string,
  embeddingsProvider: "openai" | "local"
) => {
  const { data: createdFile, error } = await supabase
    .from("files")
    .insert([fileRecord])
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  await createFileWorkspace({
    user_id: createdFile.user_id,
    file_id: createdFile.id,
    workspace_id
  })

  const filePath = await uploadFile(file, {
    name: createdFile.name,
    title: file.name,
    user_id: createdFile.user_id,
    file_id: createdFile.name
  })

  await updateFile(createdFile.id, {
    file_path: filePath
  })

  processFile(createdFile.id, embeddingsProvider, "docx")

  const fetchedFile = await getFileById(createdFile.id)

  return fetchedFile
}

export const createFiles = async (
  files: TablesInsert<"files">[],
  workspace_id: string
) => {
  const { data: createdFiles, error } = await supabase
    .from("files")
    .insert(files)
    .select("*")

  if (error) {
    throw new Error(error.message)
  }

  await createFileWorkspaces(
    createdFiles.map(file => ({
      user_id: file.user_id,
      file_id: file.id,
      workspace_id
    }))
  )

  return createdFiles
}

export const createFileWorkspace = async (item: {
  user_id: string
  file_id: string
  workspace_id: string
}) => {
  const { data: createdFileWorkspace, error } = await supabase
    .from("file_workspaces")
    .insert([item])
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return createdFileWorkspace
}

export const createFileWorkspaces = async (
  items: { user_id: string; file_id: string; workspace_id: string }[]
) => {
  const { data: createdFileWorkspaces, error } = await supabase
    .from("file_workspaces")
    .insert(items)
    .select("*")

  if (error) throw new Error(error.message)

  return createdFileWorkspaces
}

export const updateFile = async (
  fileId: string,
  file: TablesUpdate<"files">
) => {
  const { data: updatedFile, error } = await supabase
    .from("files")
    .update(file)
    .eq("id", fileId)
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  const { data: fileItems, error: fileItemsError } = await supabase
    .from("file_items")
    .update({
      file_name: file.name,
      file_description: file.description
    })
    .eq("file_id", fileId)
    .select("*")

  if (fileItemsError) {
    throw new Error(fileItemsError.message)
  }

  return updatedFile
}

export const deleteFile = async (fileId: string) => {
  const { error } = await supabase.from("files").delete().eq("id", fileId)

  if (error) {
    throw new Error(error.message)
  }

  return true
}

export const deleteFileWorkspace = async (
  fileId: string,
  workspaceId: string
) => {
  const { error } = await supabase
    .from("file_workspaces")
    .delete()
    .eq("file_id", fileId)
    .eq("workspace_id", workspaceId)

  if (error) throw new Error(error.message)

  return true
}

const processFile = async (
  fileId: string,
  embeddingsProvider: "openai" | "local",
  type: string
) => {
  const formData = new FormData()
  formData.append("file_id", fileId)
  formData.append("embeddingsProvider", embeddingsProvider)

  const file = await getFileById(fileId)

  fetch("/api/retrieval/process", {
    method: "POST",
    body: formData
  })
    .then(async (response: any) => {})
    .catch(async (error: any) => {
      if (!error.ok) {
        const jsonText = await error.text()
        const json = JSON.parse(jsonText)

        toast.error("Failed to process file. Reason:" + json.message, {
          duration: 10000
        })
        await deleteFile(fileId)
      }
    })
}
