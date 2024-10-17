import { ChatbotUIContext } from "@/context/context"
import {
  createDocXFile,
  createFile,
  createFileBasedOnExtension
} from "@/db/files"
import { LLM_LIST } from "@/lib/models/llm/llm-list"
import { message } from "antd"
import mammoth from "mammoth"
import { useContext, useEffect, useState } from "react"
import { toast } from "sonner"

export const ACCEPTED_FILE_TYPES = [
  "text/csv",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/json",
  "text/markdown",
  "application/pdf",
  "text/plain",
  "image"
].join(",")

export const useSelectFileHandler = () => {
  const {
    selectedWorkspace,
    profile,
    chatSettings,
    setNewMessageImages,
    setNewMessageFiles,
    setShowFilesDisplay,
    setFiles,
    setUseRetrieval,
    setToolInUse
  } = useContext(ChatbotUIContext)

  const [filesToAccept, setFilesToAccept] = useState(ACCEPTED_FILE_TYPES)

  useEffect(() => {
    handleFilesToAccept()
  }, [chatSettings?.model])

  const handleFilesToAccept = () => {
    const model = chatSettings?.model
    const FULL_MODEL = LLM_LIST.find(llm => llm.modelId === model)

    if (FULL_MODEL) {
      setFilesToAccept(
        FULL_MODEL.imageInput
          ? `${ACCEPTED_FILE_TYPES},image/*`
          : ACCEPTED_FILE_TYPES
      )
    }
  }

  const handleSelectDeviceFile = async (file: File) => {
    if (!profile || !selectedWorkspace || !chatSettings) return

    setShowFilesDisplay(true)
    setUseRetrieval(true)

    if (file) {
      // Remove the last file from newMessageFiles
      setNewMessageFiles(prev => prev.slice(0, -1))
      let simplifiedFileType = file.type.split("/")[1]
      let reader = new FileReader()

      if (file.type.includes("image")) {
        reader.readAsDataURL(file)
      } else if (ACCEPTED_FILE_TYPES.split(",").includes(file.type)) {
        toast.info("Your file is uploading. This could take upto few minutes")

        if (simplifiedFileType.includes("vnd.adobe.pdf")) {
          simplifiedFileType = "pdf"
        } else if (
          [
            "vnd.openxmlformats-officedocument.wordprocessingml.document",
            "docx"
          ].includes(simplifiedFileType)
        ) {
          simplifiedFileType = "docx"
        }
        setNewMessageFiles(prev => [
          ...prev,
          {
            id: "loading",
            name: file.name,
            title: file.name,
            type: simplifiedFileType,
            file: file
          }
        ])

        if (
          file.type.includes(
            "vnd.openxmlformats-officedocument.wordprocessingml.document"
          ) ||
          file.type.includes("docx")
        ) {
          const arrayBuffer = await file.arrayBuffer()
          const result = await mammoth.extractRawText({ arrayBuffer })

          const createdFile = await createDocXFile(
            result.value,
            file,
            {
              user_id: profile.user_id,
              description: "",
              file_path: "",
              name: file.name,
              title: file.name,
              size: file.size,
              tokens: 0,
              type: simplifiedFileType,
              category: "private",
              is_active: true
            },
            selectedWorkspace.id,
            chatSettings.embeddingsProvider
          )

          setFiles(prev => [...prev, createdFile])

          setNewMessageFiles(prev =>
            prev.map(item =>
              item.id === "loading"
                ? {
                    id: createdFile.id,
                    name: createdFile.name,
                    title: file.name,
                    type: createdFile.type,
                    file: file
                  }
                : item
            )
          )

          reader.onloadend = null

          return
        } else {
          // Use readAsArrayBuffer for PDFs and readAsText for other types
          file.type.includes("pdf")
            ? reader.readAsArrayBuffer(file)
            : reader.readAsText(file)
        }
      } else {
        throw new Error("Unsupported file type")
      }

      reader.onloadend = async function () {
        try {
          if (file.type.includes("image")) {
            // Create a temp url for the image file
            const imageUrl = URL.createObjectURL(file)

            // This is a temporary image for display purposes in the chat input
            setNewMessageImages(prev => [
              ...prev,
              {
                messageId: "temp",
                path: "",
                base64: reader.result, // base64 image
                url: imageUrl,
                file
              }
            ])
          } else {
            const createdFile = await createFile(
              file,
              {
                user_id: profile.user_id,
                description: "",
                file_path: "",
                name: file.name,
                title: file.name,
                size: file.size,
                tokens: 0,
                type: simplifiedFileType,
                category: "private",
                is_active: true
              },
              selectedWorkspace.id,
              chatSettings.embeddingsProvider
            )

            setFiles(prev => [...prev, createdFile])

            setNewMessageFiles(prev =>
              prev.map(item =>
                item.id === "loading"
                  ? {
                      id: createdFile.id,
                      name: createdFile.name,
                      title: createdFile.name,
                      type: createdFile.type,
                      file: file
                    }
                  : item
              )
            )
          }
        } catch (error: any) {
          toast.error("Failed to upload. " + error?.message, {
            duration: 10000
          })
          setNewMessageImages(prev =>
            prev.filter(img => img.messageId !== "temp")
          )
          setNewMessageFiles(prev => prev.filter(file => file.id !== "loading"))
        }
      }
    }
  }

  return {
    handleSelectDeviceFile,
    filesToAccept
  }
}
