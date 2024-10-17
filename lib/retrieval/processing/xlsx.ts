import { FileItemChunk } from "@/types"
import { encode } from "gpt-tokenizer"
import * as XLSX from "xlsx"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import { CHUNK_OVERLAP, CHUNK_SIZE } from "."

export const processExcel = async (excel: Blob): Promise<FileItemChunk[]> => {
  // Read the Excel file as an array buffer
  const arrayBuffer = await excel.arrayBuffer()

  // Parse the array buffer using xlsx
  const workbook = XLSX.read(arrayBuffer, { type: "array" })

  // Extract the first sheet from the workbook
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]

  // Convert the worksheet to JSON format
  const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

  // Combine all rows and columns into a single string
  let completeText = sheetData.map((row: any) => row.join("\t")).join("\n\n")

  // Initialize the text splitter
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
    separators: ["\n\n"]
  })

  // Split the text into chunks
  const splitDocs = await splitter.createDocuments([completeText])

  // Prepare the chunks array
  let chunks: FileItemChunk[] = []

  // Process each split document
  for (let i = 0; i < splitDocs.length; i++) {
    const doc = splitDocs[i]

    // Push each chunk with its token count
    chunks.push({
      content: doc.pageContent,
      tokens: encode(doc.pageContent).length
    })
  }

  return chunks
}
