import { getProfilesByRoleId } from "@/db/profile"
import { getRoleByName } from "@/db/roles"
import { generateLocalEmbedding } from "@/lib/generate-local-embedding"
import { checkApiKey, getServerProfile } from "@/lib/server/server-chat-helpers"
import { Database } from "@/supabase/types"
import { createClient } from "@supabase/supabase-js"
import OpenAI from "openai"

export async function POST(request: Request) {
  try {
    const json = await request.json()
    console.log("Retrieval is calling...")

    const { userInput, fileIds, embeddingsProvider, sourceCount } = json as {
      userInput: string
      fileIds: string[]
      embeddingsProvider: "openai" | "local"
      sourceCount: number
    }

    console.log({
      ["user input:"]: userInput,
      ["active files:"]: fileIds,
      ["embedding provider:"]: embeddingsProvider,
      ["source count:"]: sourceCount
    })

    const clientSelectedFilesIds = [...new Set(fileIds)]
    const supabaseAdmin = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const [profile, adminRole] = await Promise.all([
      getServerProfile(),
      getRoleByName("admin")
    ])

    const adminDetails = await getProfilesByRoleId(adminRole.id)
    const associatedAdmin = adminDetails.find(
      a => a.organization_id === profile.organization_id
    )

    if (!associatedAdmin) {
      throw new Error("No associated admin found for the given organization")
    }

    const [
      { data: fileItemFileIds, error: fileIdsError },
      { data: allFileIds, error: allFileIdsError }
    ] = await Promise.all([
      supabaseAdmin
        .from("file_items")
        .select("file_id")
        .eq("user_id", associatedAdmin.user_id),
      supabaseAdmin
        .from("files")
        .select("id, is_active, description")
        .eq("user_id", associatedAdmin.user_id)
    ])

    if (fileIdsError || !fileItemFileIds) {
      throw fileIdsError || new Error("Failed to fetch file IDs")
    }
    if (allFileIdsError || !allFileIds) {
      throw allFileIdsError || new Error("No file exists")
    }

    const activeFiles = allFileIds.filter(file => file.is_active)
    const serverSelectedFileIds = activeFiles.map(file => file.id)
    const uniqueActiveFileIds =
      clientSelectedFilesIds.length > 0
        ? clientSelectedFilesIds
        : serverSelectedFileIds

    if (serverSelectedFileIds.length === 0) throw new Error("No active files")

    let chunks: any[] = []

    if (embeddingsProvider === "openai") {
      const apiKey = profile.use_azure_openai
        ? profile.azure_openai_api_key
        : profile.openai_api_key
      checkApiKey(apiKey, profile.use_azure_openai ? "Azure OpenAI" : "OpenAI")

      const openai = new OpenAI({
        apiKey: apiKey!,
        baseURL: profile.use_azure_openai
          ? `${profile.azure_openai_endpoint}/openai/deployments/${profile.azure_openai_embeddings_id}`
          : undefined,
        defaultQuery: profile.use_azure_openai
          ? { "api-version": "2023-12-01-preview" }
          : undefined,
        defaultHeaders: profile.use_azure_openai
          ? { "api-key": profile.azure_openai_api_key! }
          : undefined,
        organization: profile.use_azure_openai
          ? undefined
          : profile.openai_organization_id
      })

      const response = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: userInput
      })

      const openaiEmbedding = response.data[0].embedding

      const { data: openaiFileItems, error: openaiError } =
        await supabaseAdmin.rpc("match_file_items_openai", {
          query_embedding: openaiEmbedding as any,
          match_count: sourceCount,
          file_ids: uniqueActiveFileIds
        })

      if (openaiError) {
        throw openaiError
      }

      chunks = openaiFileItems
    } else if (embeddingsProvider === "local") {
      const localEmbedding = await generateLocalEmbedding(userInput)

      const { data: localFileItems, error: localFileItemsError } =
        await supabaseAdmin.rpc("match_file_items_local", {
          query_embedding: localEmbedding as any,
          match_count: sourceCount,
          file_ids: uniqueActiveFileIds
        })

      if (localFileItemsError) {
        throw localFileItemsError
      }

      chunks = localFileItems
    }

    const mostSimilarChunks = chunks.sort((a, b) => b.similarity - a.similarity)

    console.log("mostSimilarChunks", mostSimilarChunks)

    return new Response(JSON.stringify({ results: mostSimilarChunks }), {
      status: 200
    })
  } catch (error: any) {
    console.log({ error })

    const errorMessage = error.error?.message || "An unexpected error occurred"
    const errorCode = error.status || 500
    return new Response(JSON.stringify({ message: errorMessage }), {
      status: errorCode
    })
  }
}
