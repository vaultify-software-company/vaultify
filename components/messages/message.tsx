/* eslint-disable react-hooks/exhaustive-deps */
import { useChatHandler } from "@/components/chat/chat-hooks/use-chat-handler"
import { ChatbotUIContext } from "@/context/context"
import { LLM_LIST } from "@/lib/models/llm/llm-list"
import { cn } from "@/lib/utils"
import { Tables } from "@/supabase/types"
import { LLM, LLMID, MessageImage, ModelProvider } from "@/types"
import {
  IconBolt,
  IconCircleFilled,
  IconFileText,
  IconMoodSmile,
  IconPencil,
  IconX
} from "@tabler/icons-react"
import Image from "next/image"
import { FC, useContext, useEffect, useRef, useState } from "react"
import { ModelIcon } from "../models/model-icon"
import { FileIcon } from "../ui/file-icon"
import { Button } from "../ui/button"
import { FilePreview } from "../ui/file-preview"
import { TextareaAutosize } from "../ui/textarea-autosize"
import { WithTooltip } from "../ui/with-tooltip"
import { MessageActions } from "./message-actions"
import { MessageMarkdown } from "./message-markdown"
import { getFileFromStorage } from "@/db/storage/files"
import { getFileById, getFileByName } from "@/db/files"
import { Modal } from "antd"
import {
  cancelButtonStyle,
  sidebarStyle,
  successButtonStyle
} from "../ui/styles"
import { toast } from "sonner"

const ICON_SIZE = 32

interface MessageProps {
  message: Tables<"messages">
  fileItems: Tables<"file_items">[]
  isEditing: boolean
  isLast: boolean
  onStartEdit: (message: Tables<"messages">) => void
  onCancelEdit: () => void
  onSubmitEdit: (value: string, sequenceNumber: number) => void
}

export const Message: FC<MessageProps> = ({
  message,
  fileItems,
  isEditing,
  isLast,
  onStartEdit,
  onCancelEdit,
  onSubmitEdit
}) => {
  const {
    assistants,
    profile,
    isGenerating,
    setIsGenerating,
    firstTokenReceived,
    availableLocalModels,
    availableOpenRouterModels,
    chatMessages,
    selectedAssistant,
    chatImages,
    assistantImages,
    toolInUse,
    files,
    models,
    useVellum
  } = useContext(ChatbotUIContext)
  const { handleSendMessage } = useChatHandler()
  const editInputRef = useRef<HTMLTextAreaElement>(null)

  const [isHovering, setIsHovering] = useState(false)
  const [editedMessage, setEditedMessage] = useState(message.content)

  const [showImagePreview, setShowImagePreview] = useState(false)
  const [selectedImage, setSelectedImage] = useState<MessageImage | null>(null)

  const [showFileItemPreview, setShowFileItemPreview] = useState(false)
  const [selectedFileItem, setSelectedFileItem] =
    useState<Tables<"file_items"> | null>(null)

  const [fileModalOpen, setFileModalOpen] = useState(false)
  const [fileContent, setFileContent] = useState("")
  const [fileNames, setFileNames] = useState<string[]>([])

  const [showAll, setShowAll] = useState(false)
  const MAX_VISIBLE_ITEMS = 1

  const FILE_NAME_REGEX =
    /[a-zA-Z0-9_]+(?:_[a-zA-Z0-9_]+)*\.(csv|json|md|pdf|txt)\b/g

  const handleToggleShowAll = () => {
    setShowAll(!showAll)
  }

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(message.content)
    } else {
      const textArea = document.createElement("textarea")
      textArea.value = message.content
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
    }
  }

  const handleSendEdit = () => {
    onSubmitEdit(editedMessage, message.sequence_number)
    onCancelEdit()
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (isEditing && event.key === "Enter" && event.metaKey) {
      handleSendEdit()
    }
  }

  const handleRegenerate = async () => {
    setIsGenerating(true)
    await handleSendMessage(
      editedMessage || chatMessages[chatMessages.length - 2].message.content,
      chatMessages,
      true,
      true
    )
  }

  const handleStartEdit = () => {
    onStartEdit(message)
  }

  useEffect(() => {
    setEditedMessage(message.content)

    if (isEditing && editInputRef.current) {
      const input = editInputRef.current
      input.focus()
      input.setSelectionRange(input.value.length, input.value.length)
    }
  }, [isEditing, message.content])

  const MODEL_DATA = [
    ...models.map(model => ({
      modelId: model.model_id as LLMID,
      modelName: model.name,
      provider: "custom" as ModelProvider,
      hostedId: model.id,
      platformLink: "",
      imageInput: false
    })),
    ...LLM_LIST,
    ...availableLocalModels,
    ...availableOpenRouterModels
  ].find(llm => llm.modelId === message.model) as LLM

  const messageAssistantImage = assistantImages.find(
    image => image.assistantId === message.assistant_id
  )?.base64

  const fileSummary = fileItems.reduce(
    (acc, fileItem) => {
      const parentFile = files.find(file => file.id === fileItem.file_id)
      if (parentFile) {
        if (!acc[parentFile.id]) {
          acc[parentFile.id] = {
            id: parentFile.id,
            name: parentFile.name,
            count: 1,
            type: parentFile.type,
            description: parentFile.description
          }
        } else {
          acc[parentFile.id].count += 1
        }
      }
      return acc
    },
    {} as Record<
      string,
      {
        id: string
        name: string
        count: number
        type: string
        description: string
      }
    >
  )

  // const handleSourceOpen = async (file_id: string) => {
  //   const file = await getFileById(file_id)
  //   const url = await getFileFromStorage(file?.file_path)
  //   setFileContent(url)
  //   setFileModalOpen(true)
  // }

  const handleCloseModal = () => {
    setFileModalOpen(false)
    setFileContent("")
  }

  const handleDebug = () => {
    return message
  }

  const handleFileSourceOpen = async (file_name: string) => {
    const { data: file, error } = await getFileByName(file_name)
    if (error) {
      toast.error(error.message)
    } else {
      const { data, error } = await getFileFromStorage(file[0]?.file_path)
      if (error) {
        toast.error("File cannot be opened")
      } else {
        setFileContent(data?.signedUrl!)
        setFileModalOpen(true)
      }
    }
  }

  const references = message.content.match(FILE_NAME_REGEX)
  const uniqueReferences = [...new Set(references)]

  const fileNamesCache = useRef<{ [key: string]: string }>({}) // Cache for file names
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const fetchFileNames = async () => {
      const names = await Promise.all(
        Object.values(uniqueReferences)
          .slice(0, showAll ? uniqueReferences.length : MAX_VISIBLE_ITEMS)
          .map(async file => {
            // Log each file being processed
            console.log(`Fetching title for file: ${file}`)

            if (fileNamesCache.current[file]) {
              return fileNamesCache.current[file]
            } else {
              try {
                const { data: fileData, error: fileError } =
                  await getFileByName(file)

                if (fileError) {
                  toast.error("File cannot be opened")
                }

                if (fileData && fileData.length > 0) {
                  const title = fileData[0]?.title
                  fileNamesCache.current[file] = title || "" // Cache the result with a fallback empty string
                  return title
                } else {
                  console.warn(`No title found for file: ${file}`)
                  return undefined // Return undefined instead of an empty string
                }
              } catch (error) {
                console.error(`Error fetching title for file: ${file}`, error)
                return undefined // Handle any errors by returning undefined
              }
            }
          })
      )

      // Filter out undefined values
      const validNames = names.filter(
        (name): name is string => name !== undefined
      )
      setFileNames(validNames)
    }

    if (!isGenerating) {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current)
      }
      debounceTimeout.current = setTimeout(() => {
        fetchFileNames()
      }, 3000)
    }

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current)
      }
    }
  }, [fileSummary]) // Add dependencies to effect

  return (
    <div
      className={cn(
        "flex w-full justify-center",
        message.role === "user" ? "" : "bg-secondary"
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onKeyDown={handleKeyDown}
    >
      <div className="relative flex w-full flex-col p-6 sm:w-[550px] sm:px-0 md:w-[650px] lg:w-[650px] xl:w-[700px]">
        <div className="absolute right-5 top-7 sm:right-0">
          <MessageActions
            onCopy={handleCopy}
            onEdit={handleStartEdit}
            isAssistant={message.role === "assistant"}
            isLast={isLast}
            isEditing={isEditing}
            isHovering={isHovering}
            onRegenerate={handleRegenerate}
            onDebug={handleDebug}
          />
        </div>
        <div className="space-y-3">
          {message.role === "system" ? (
            <div className="flex items-center space-x-4">
              <IconPencil
                className="border-primary bg-primary text-secondary rounded border-DEFAULT p-1"
                size={ICON_SIZE}
              />
              <div className="text-lg font-semibold">Prompt</div>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              {message.role === "assistant" ? (
                messageAssistantImage ? (
                  <Image
                    style={{
                      width: `${ICON_SIZE}px`,
                      height: `${ICON_SIZE}px`
                    }}
                    className="rounded"
                    src={messageAssistantImage}
                    alt="assistant image"
                    height={ICON_SIZE}
                    width={ICON_SIZE}
                  />
                ) : (
                  <WithTooltip
                    display={<div>{MODEL_DATA?.modelName}</div>}
                    trigger={
                      <ModelIcon
                        provider={MODEL_DATA?.provider || "custom"}
                        height={ICON_SIZE}
                        width={ICON_SIZE}
                      />
                    }
                  />
                )
              ) : profile?.image_url ? (
                <Image
                  className={`size-[32px] rounded`}
                  src={profile.image_url}
                  height={32}
                  width={32}
                  alt="user image"
                  unoptimized
                />
              ) : (
                <IconMoodSmile
                  className="bg-primary text-secondary border-primary rounded border-DEFAULT p-1"
                  size={ICON_SIZE}
                />
              )}
              <div className="font-semibold">
                {message.role === "assistant"
                  ? message.assistant_id
                    ? assistants.find(
                        assistant => assistant.id === message.assistant_id
                      )?.name
                    : selectedAssistant
                      ? selectedAssistant?.name
                      : MODEL_DATA?.modelName
                  : (profile?.display_name ?? profile?.username)}
              </div>
            </div>
          )}
          {!firstTokenReceived &&
          isGenerating &&
          isLast &&
          message.role === "assistant" ? (
            <div className="flex animate-pulse items-center space-x-2">
              {toolInUse === "none" && (
                <IconCircleFilled className="animate-pulse" size={20} />
              )}
              {toolInUse === "retrieval" && (
                <>
                  <IconFileText size={20} />
                  <div>Generating...</div>
                </>
              )}
              {toolInUse !== "none" && toolInUse !== "retrieval" && (
                <>
                  <IconBolt size={20} />
                  <div>Using {toolInUse}...</div>
                </>
              )}
            </div>
          ) : isEditing ? (
            <TextareaAutosize
              textareaRef={editInputRef}
              className="text-md"
              value={editedMessage}
              onValueChange={setEditedMessage}
              maxRows={20}
            />
          ) : message.role === "assistant" ? (
            <div>
              <MessageMarkdown content={message.content} />
            </div>
          ) : (
            <MessageMarkdown content={message.content} />
          )}
        </div>
        {message.chunks !== "[]" && (
          <div className="mt-3 space-y-4">
            {!isGenerating &&
              Object.values(uniqueReferences)
                .slice(0, showAll ? uniqueReferences.length : MAX_VISIBLE_ITEMS) // Show all if showAll is true, otherwise show MAX_VISIBLE_ITEMS
                .map((file, index) => (
                  <div className="flex hover:text-gray-500" key={index}>
                    <div className="flex cursor-pointer items-center space-x-2">
                      <FileIcon type={file.split(".")[1]} />
                      <div
                        className="truncate"
                        onClick={() => handleFileSourceOpen(file)}
                      >
                        {fileNames[index] || "Loading..."}
                      </div>
                    </div>
                  </div>
                ))}
            {Object.values(uniqueReferences).length > MAX_VISIBLE_ITEMS && (
              <div className="flex justify-center">
                <button
                  onClick={handleToggleShowAll}
                  className="text-white-500 hover:text-white-700 focus:outline-none"
                >
                  {showAll
                    ? "Show Less"
                    : `Show (${Object.values(uniqueReferences).length - MAX_VISIBLE_ITEMS}) More`}
                </button>
              </div>
            )}
          </div>
        )}
        {fileModalOpen && (
          <Modal
            style={{
              margin: "auto",
              minWidth: "75vw"
            }}
            open={true}
            onClose={handleCloseModal}
            onCancel={handleCloseModal}
            okButtonProps={{ style: { display: "none" } }}
            cancelButtonProps={{}}
            closeIcon={false}
          >
            <iframe
              src={fileContent}
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                height: "80vh",
                overflow: "hidden"
              }}
            ></iframe>
          </Modal>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {message.image_paths.map((path, index) => {
            const item = chatImages.find(image => image.path === path)
            return (
              <Image
                key={index}
                className="cursor-pointer rounded hover:opacity-50"
                src={path.startsWith("data") ? path : item?.base64}
                alt="message image"
                width={300}
                height={300}
                onClick={() => {
                  setSelectedImage({
                    messageId: message.id,
                    path,
                    base64: path.startsWith("data") ? path : item?.base64 || "",
                    url: path.startsWith("data") ? "" : item?.url || "",
                    file: null
                  })
                  setShowImagePreview(true)
                }}
                loading="lazy"
              />
            )
          })}
        </div>
        {isEditing && (
          <div className="mt-4 flex justify-center space-x-2">
            <Button size="sm" onClick={handleSendEdit}>
              Save & Send
            </Button>
            <Button size="sm" variant="outline" onClick={onCancelEdit}>
              Cancel
            </Button>
          </div>
        )}
      </div>
      {showImagePreview && selectedImage && (
        <FilePreview
          type="image"
          item={selectedImage}
          isOpen={showImagePreview}
          onOpenChange={(isOpen: boolean) => {
            setShowImagePreview(isOpen)
            setSelectedImage(null)
          }}
        />
      )}
      {showFileItemPreview && selectedFileItem && (
        <FilePreview
          type="file_item"
          item={selectedFileItem}
          isOpen={showFileItemPreview}
          onOpenChange={(isOpen: boolean) => {
            setShowFileItemPreview(isOpen)
            setSelectedFileItem(null)
          }}
        />
      )}
    </div>
  )
}
