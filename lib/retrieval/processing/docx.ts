import { getServerProfile } from "@/lib/server/server-chat-helpers"
import { Database } from "@/supabase/types"
import { FileItemChunk } from "@/types"
import { DOCXOCRService, PDFOCRService } from "@/utils/ocrServices"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export const processDocX = async (
  docx: Blob,
  file: any
): Promise<FileItemChunk[]> => {
  const profile = await getServerProfile()

  const cookieStore = cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        }
      }
    }
  )

  // Get the session from Supabase
  const {
    data: { session }
  } = await supabase.auth.getSession()

  if (!session || !session.access_token) {
    throw new Error("Session is invalid or access token is missing")
  }

  // Call the OCR service and return the result
  DOCXOCRService(docx, session, profile, file)

  return []
}
