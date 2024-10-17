import { getFileById } from "@/db/files"
import { generateLocalEmbedding } from "@/lib/generate-local-embedding"
import {
  processCSV,
  processDocX,
  processJSON,
  processMarkdown,
  processPdf,
  processTxt,
  processExcel
} from "@/lib/retrieval/processing"
import { checkApiKey, getServerProfile } from "@/lib/server/server-chat-helpers"
import { Database } from "@/supabase/types"
import { FileItemChunk } from "@/types"
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import OpenAI from "openai"

export const maxDuration = 60
export const dynamic = "force-dynamic"

async function fetchProfileAndFormData(req: Request) {
  return Promise.all([getServerProfile(), req.formData()])
}

async function fetchFileMetadata(supabaseAdmin: any, file_id: string) {
  const { data, error } = await supabaseAdmin
    .from("files")
    .select("*")
    .eq("id", file_id)
    .single()

  if (error || !data) {
    throw new Error(
      `Failed to retrieve file metadata: ${error?.message || "File not found"}`
    )
  }

  return data
}

async function downloadFile(supabaseAdmin: any, filePath: string) {
  const { data, error } = await supabaseAdmin.storage
    .from("files")
    .download(filePath)

  if (error || !data) {
    throw new Error(`Failed to retrieve file: ${error?.message}`)
  }

  return Buffer.from(await data.arrayBuffer())
}

function validateApiKey(profile: any, embeddingsProvider: string) {
  if (embeddingsProvider === "openai") {
    const apiKey = profile.use_azure_openai
      ? profile.azure_openai_api_key
      : profile.openai_api_key
    checkApiKey(apiKey, profile.use_azure_openai ? "Azure OpenAI" : "OpenAI")
  }
}

async function processFile(
  blob: Blob,
  file: any,
  fileExtension: string
): Promise<FileItemChunk[]> {
  console.log({ fileExtension })

  switch (fileExtension) {
    case "csv":
      return processCSV(blob)
    case "xlsx":
      return processExcel(blob)
    case "json":
      return processJSON(blob)
    case "md":
      return processMarkdown(blob)
    case "docx":
      return processDocX(blob, file)
    case "pdf":
      console.log("process pdf called")
      return processPdf(blob, file)
    case "txt":
      return processTxt(blob)
    default:
      throw new Error("Unsupported file type")
  }
}

async function generateEmbeddings(
  chunks: FileItemChunk[],
  profile: any,
  embeddingsProvider: string
) {
  const openaiConfig = profile.use_azure_openai
    ? {
        apiKey: profile.azure_openai_api_key || "",
        baseURL: `${profile.azure_openai_endpoint}/openai/deployments/${profile.azure_openai_embeddings_id}`,
        defaultQuery: { "api-version": "2023-12-01-preview" },
        defaultHeaders: { "api-key": profile.azure_openai_api_key }
      }
    : {
        apiKey: profile.openai_api_key || "",
        organization: profile.openai_organization_id
      }

  const openai = new OpenAI(openaiConfig)

  const embeddingPromises = chunks.map(chunk => {
    if (embeddingsProvider === "openai") {
      return openai.embeddings
        .create({
          model: "text-embedding-ada-002",
          input: [chunk.content]
        })
        .then(response => response.data[0].embedding)
    } else if (embeddingsProvider === "local") {
      return generateLocalEmbedding(chunk.content)
    }
  })

  return Promise.all(embeddingPromises)
}

async function upsertFileItems(
  supabaseAdmin: any,
  file_items: any[],
  file_id: string,
  totalTokens: number
) {
  const batchSize = 100 // Define a suitable batch size
  const batchedFileItems = []

  for (let i = 0; i < file_items.length; i += batchSize) {
    batchedFileItems.push(file_items.slice(i, i + batchSize))
  }
  try {
    for (const batch of batchedFileItems) {
      const response = await supabaseAdmin.from("file_items").upsert(batch)
      if (response.error) {
        console.error("Batch Upsert error:", response.error)
        throw new Error("Failed to upsert file items")
      }
    }

    await supabaseAdmin
      .from("files")
      .update({ tokens: totalTokens })
      .eq("id", file_id)

    console.log("Upsert completed")
  } catch (error) {
    console.error("Error in batch upsert:", error)
  }
}

export async function POST(req: Request) {
  try {
    const supabaseAdmin = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const [profile, formData] = await fetchProfileAndFormData(req)
    const file_id = formData.get("file_id") as string
    const embeddingsProvider = formData.get("embeddingsProvider") as string

    const fileMetadata = await fetchFileMetadata(supabaseAdmin, file_id)

    if (fileMetadata.user_id !== profile.user_id) {
      throw new Error("Unauthorized")
    }

    const fileBuffer = await downloadFile(supabaseAdmin, fileMetadata.file_path)
    validateApiKey(profile, embeddingsProvider)

    const file = await getFileById(file_id)

    const blob = new Blob([fileBuffer])
    const fileExtension = fileMetadata.name.split(".").pop()?.toLowerCase()
    const chunks = await processFile(blob, file, fileExtension)

    const embeddings = await generateEmbeddings(
      chunks,
      profile,
      embeddingsProvider
    )

    const file_items = chunks.map((chunk, index) => ({
      file_id,
      file_name: fileMetadata.name,
      file_path: fileMetadata.file_path,
      user_id: profile.user_id,
      content: chunk.content,
      tokens: chunk.tokens,
      openai_embedding:
        embeddingsProvider === "openai" ? embeddings[index] : null,
      local_embedding: embeddingsProvider === "local" ? embeddings[index] : null
    }))

    const totalTokens = file_items.reduce((acc, item) => acc + item.tokens, 0)
    await upsertFileItems(supabaseAdmin, file_items, file_id, totalTokens)

    return new NextResponse("Embed Successful", { status: 200 })
  } catch (error: any) {
    console.log(`Error in retrieval/process: ${error.stack}`)
    return new Response(
      JSON.stringify({
        message: error?.message || "An unexpected error occurred"
      }),
      {
        status: error.status || 500
      }
    )
  }
}
