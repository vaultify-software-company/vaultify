import { FileItemChunk } from "@/types"
import { PDFOCRService } from "@/utils/ocrServices"
import { getServerProfile } from "@/lib/server/server-chat-helpers"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { Database } from "@/supabase/types"

export const processPdf = async (
  pdf: Blob,
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
  console.log("I was here >> ocr service")
  // Call the OCR service and return the result
  PDFOCRService(pdf, session, profile, file)

  return []
}
