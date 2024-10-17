// src/utils/ocrService.ts

import { updateFile } from "@/db/files"

export async function PDFOCRService(
  file: Blob,
  session: any,
  profile: any,
  fileMeta: any
) {
  const formData = new FormData()
  const filename = fileMeta?.name

  const data = {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    meta: fileMeta,
    profile: profile
  }

  formData.append("file", file, filename)
  formData.append("formData", JSON.stringify(data))

  try {
    console.log(`${process.env.NEXT_PUBLIC_OCR_BASE_URL}/api/ocr/pdf`)

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_OCR_BASE_URL}/api/ocr/pdf`,
      {
        method: "POST",
        body: formData
      }
    )

    // Check if the response is okay (status code in the range 200-299)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const responseData = await response.json() // Await the JSON response
    console.log("Success:", responseData) // Log the result or handle it as needed
    return responseData // Return the processed response data
  } catch (error: any) {
    const message = error.message
    console.error("Error:", message) // Log the error message

    // Check for specific error cases
    if (message.includes("Failed to parse URL") || message === "fetch failed") {
      await updateFile(fileMeta?.id, { status: "failed" })
    }

    throw error // Re-throw the error to be handled upstream if necessary
  }
}

export async function DOCXOCRService(
  file: Blob,
  session: any,
  profile: any,
  fileMeta: any
) {
  const formData = new FormData()
  const filename = fileMeta?.name

  const data = {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    meta: fileMeta,
    profile: profile
  }

  formData.append("file", file, filename)
  formData.append("formData", JSON.stringify(data))

  try {
    console.log(`${process.env.NEXT_PUBLIC_OCR_BASE_URL}/api/ocr/docx`)

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_OCR_BASE_URL}/api/ocr/docx`,
      {
        method: "POST",
        body: formData
      }
    )

    // Check if the response is okay (status code in the range 200-299)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const responseData = await response.json() // Await the JSON response
    console.log("Success:", responseData) // Log the result or handle it as needed
    return responseData // Return the processed response data
  } catch (error: any) {
    const message = error.message
    console.error("Error:", message) // Log the error message

    // Check for specific error cases
    if (message.includes("Failed to parse URL") || message === "fetch failed") {
      await updateFile(fileMeta?.id, { status: "failed" })
    }

    throw error // Re-throw the error to be handled upstream if necessary
  }
}
