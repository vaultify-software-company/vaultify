import { ChatbotUIContext } from "@/context/context"
import useHotkey from "@/lib/hooks/use-hotkey"
import { LLM_LIST } from "@/lib/models/llm/llm-list"
import { cn } from "@/lib/utils"
import {
  IconBolt,
  IconCirclePlus,
  IconFileUpload,
  IconPlayerStopFilled,
  IconSend,
  IconX
} from "@tabler/icons-react"
import Image from "next/image"
import { FC, useContext, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Input } from "../ui/input"
import { TextareaAutosize } from "../ui/textarea-autosize"
import { ChatCommandInput } from "./chat-command-input"
import { ChatFilesDisplay } from "./chat-files-display"
import { useChatHandler } from "./chat-hooks/use-chat-handler"
import { useChatHistoryHandler } from "./chat-hooks/use-chat-history"
import { usePromptAndCommand } from "./chat-hooks/use-prompt-and-command"
import { useSelectFileHandler } from "./chat-hooks/use-select-file-handler"
import { getChatById } from "@/db/chats"
import { useParams } from "next/navigation"
import { LLMID } from "@/types"
import Cookies from "js-cookie"
import { Image as AntImage } from "antd"
import googleGeminiLogo from "../../public/google-gemini-logo.svg"
import { Vellum } from "../ui/toggle-status"
import { AudioTwoTone, AudioOutlined, SoundOutlined } from "@ant-design/icons"
import { getOrganizationById } from "@/db/organizations"

interface ChatInputProps {}

export const ChatInput: FC<ChatInputProps> = ({}) => {
  const { t } = useTranslation()

  useHotkey("l", () => {
    handleFocusChatInput()
  })

  const params = useParams()

  const [isTyping, setIsTyping] = useState<boolean>(false)
  const [fileSelector, setFileSelector] = useState<boolean>(false)

  const {
    role,
    isAssistantPickerOpen,
    focusAssistant,
    setFocusAssistant,
    userInput,
    chatMessages,
    isGenerating,
    selectedPreset,
    selectedAssistant,
    focusPrompt,
    setFocusPrompt,
    focusFile,
    focusTool,
    setFocusTool,
    isToolPickerOpen,
    isPromptPickerOpen,
    setIsPromptPickerOpen,
    isFilePickerOpen,
    setFocusFile,
    chatSettings,
    selectedTools,
    setSelectedTools,
    assistantImages,
    useVellum,
    setSelectedAssistant,
    setAssistants,
    setChatSettings,
    setToolInUse,
    setUseVellum,
    toolInUse,
    organization
  } = useContext(ChatbotUIContext)

  const {
    chatInputRef,
    handleSendMessage,
    handleStopMessage,
    handleFocusChatInput
  } = useChatHandler()

  const { handleInputChange } = usePromptAndCommand()

  const { filesToAccept, handleSelectDeviceFile } = useSelectFileHandler()

  const {
    setNewMessageContentToNextUserMessage,
    setNewMessageContentToPreviousUserMessage
  } = useChatHistoryHandler()

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTimeout(() => {
      handleFocusChatInput()
    }, 200) // FIX: hacky
  }, [selectedPreset, selectedAssistant])

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isTyping && event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      setIsPromptPickerOpen(false)

      handleSendMessage(userInput, chatMessages, false, useVellum)
    }

    if (
      isPromptPickerOpen ||
      isFilePickerOpen ||
      isToolPickerOpen ||
      isAssistantPickerOpen
    ) {
      if (
        event.key === "Tab" ||
        event.key === "ArrowUp" ||
        event.key === "ArrowDown"
      ) {
        event.preventDefault()
        // Toggle focus based on picker type
        if (isPromptPickerOpen) setFocusPrompt(!focusPrompt)
        if (isFilePickerOpen) setFocusFile(!focusFile)
        if (isToolPickerOpen) setFocusTool(!focusTool)
        if (isAssistantPickerOpen) setFocusAssistant(!focusAssistant)
      }
    }

    if (event.key === "ArrowUp" && event.shiftKey && event.ctrlKey) {
      event.preventDefault()
      setNewMessageContentToPreviousUserMessage()
    }

    if (event.key === "ArrowDown" && event.shiftKey && event.ctrlKey) {
      event.preventDefault()
      setNewMessageContentToNextUserMessage()
    }

    //use shift+ctrl+up and shift+ctrl+down to navigate through chat history
    if (event.key === "ArrowUp" && event.shiftKey && event.ctrlKey) {
      event.preventDefault()
      setNewMessageContentToPreviousUserMessage()
    }

    if (event.key === "ArrowDown" && event.shiftKey && event.ctrlKey) {
      event.preventDefault()
      setNewMessageContentToNextUserMessage()
    }

    if (
      isAssistantPickerOpen &&
      (event.key === "Tab" ||
        event.key === "ArrowUp" ||
        event.key === "ArrowDown")
    ) {
      event.preventDefault()
      setFocusAssistant(!focusAssistant)
    }
  }

  const handlePaste = (event: React.ClipboardEvent) => {
    const imagesAllowed = LLM_LIST.find(
      llm => llm.modelId === chatSettings?.model
    )?.imageInput

    const items = event.clipboardData.items
    for (const item of items) {
      if (item.type.indexOf("image") === 0) {
        if (!imagesAllowed) {
          toast.error(
            `Images are not supported for this model. Use models like GPT-4 Vision instead.`
          )
          return
        }
        const file = item.getAsFile()
        if (!file) return
        handleSelectDeviceFile(file)
      }
    }
  }

  const handleCloseAssistant = async () => {
    setSelectedAssistant(null)

    console.log("Assistant is closed!")

    setChatSettings({
      model: organization?.default_model! as LLMID,
      prompt: organization?.default_prompt!,
      temperature: organization?.default_temperature!,
      contextLength: organization?.default_context_length!,
      includeProfileContext: organization?.default_include_profile_context!,
      includeWorkspaceInstructions:
        organization?.default_include_workspace_instructions!,
      embeddingsProvider: organization?.embeddings_provider! as
        | "openai"
        | "local"
    })
  }

  const handleToggleClick = async (value: boolean) => {
    setUseVellum(value)
    const tool = value ? "retrieval" : "none"
    setToolInUse(tool)
    const action = value ? "enabled" : "disabled"
    const cookieValue = value ? "enabled" : ""

    // Set cookies based on the toggle value
    if (value) {
      Cookies.set("vellum", cookieValue)
      setChatSettings({
        model: organization?.default_model! as LLMID,
        prompt: organization?.default_prompt!,
        temperature: organization?.default_temperature!,
        contextLength: organization?.default_context_length!,
        includeProfileContext: organization?.default_include_profile_context!,
        includeWorkspaceInstructions:
          organization?.default_include_workspace_instructions!,
        embeddingsProvider: organization?.embeddings_provider! as
          | "openai"
          | "local"
      })

      localStorage.setItem(
        "chat-settings",
        JSON.stringify({
          model: organization?.default_model! as LLMID,
          prompt: organization?.default_prompt!,
          temperature: organization?.default_temperature!,
          contextLength: organization?.default_context_length!,
          includeProfileContext: organization?.default_include_profile_context!,
          includeWorkspaceInstructions:
            organization?.default_include_workspace_instructions!,
          embeddingsProvider: organization?.embeddings_provider! as
            | "openai"
            | "local"
        })
      )
    } else {
      Cookies.remove("vellum")
      setChatSettings({
        model: "gpt-4o-mini",
        prompt: "You are ChatGPT, an AI assistant created by OpenAI.",
        temperature: 0.4,
        contextLength: 4096,
        includeProfileContext: false,
        includeWorkspaceInstructions: true,
        embeddingsProvider: "openai"
      })

      localStorage.setItem(
        "chat-settings",
        JSON.stringify({
          model: "gpt-4o-mini",
          prompt: "You are ChatGPT, an AI assistant created by OpenAI.",
          temperature: 0.4,
          contextLength: 4096,
          includeProfileContext: true,
          includeWorkspaceInstructions: true,
          embeddingsProvider: "openai"
        })
      )
    }

    // Show toast notification based on the action
    toast[value ? "success" : "error"](`Vellum ${action}`)
  }

  return (
    <>
      <div className="flex flex-col flex-wrap justify-center gap-2">
        <ChatFilesDisplay />
        <div
          style={{
            display: "flex",
            justifyContent: "start",
            alignItems: "center"
          }}
        >
          {selectedTools &&
            selectedTools.map((tool, index) => (
              <div
                key={index}
                className="flex justify-center"
                onClick={() =>
                  setSelectedTools(
                    selectedTools.filter(
                      selectedTool => selectedTool.id !== tool.id
                    )
                  )
                }
              >
                <div className="flex cursor-pointer items-center justify-center space-x-1 rounded-lg bg-purple-600 px-3 py-1 hover:opacity-50">
                  <IconBolt size={20} />

                  <div>{tool.name}</div>
                </div>
              </div>
            ))}

          {selectedAssistant && (
            <div className="border-primary mx-auto flex w-fit items-center space-x-2 rounded-lg border p-1.5">
              {selectedAssistant.image_path && (
                <Image
                  className="rounded"
                  src={
                    assistantImages.find(
                      img => img.path === selectedAssistant.image_path
                    )?.base64
                  }
                  width={28}
                  height={28}
                  alt={selectedAssistant.name}
                />
              )}

              <div className="text-sm font-bold">
                Talking to {selectedAssistant.name}
              </div>
              <IconX
                className="cursor-pointer hover:opacity-50"
                size={20}
                onClick={handleCloseAssistant}
              />
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: "1%",
          fontSize: "small"
        }}
      >
        <p>Search information from Vellum database</p>
        <Vellum vellum={useVellum} handleToggleClick={handleToggleClick} />
      </div>

      <div className="border-input relative mt-3 flex min-h-[60px] w-full items-center justify-center rounded-xl border-2">
        <div className="absolute bottom-[76px] left-0 max-h-[300px] w-full overflow-auto rounded-xl dark:border-none">
          <ChatCommandInput />
        </div>

        <>
          <AntImage
            src={googleGeminiLogo.src}
            alt="generate-logo"
            style={{
              width: "30px",
              height: "auto",
              marginLeft: "10px",
              color: "#fff"
            }}
            preview={false}
          />
        </>

        <TextareaAutosize
          textareaRef={chatInputRef}
          className="ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring text-md flex w-full resize-none rounded-md border-none bg-transparent py-2 pr-14 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          placeholder={
            useVellum
              ? t(`Ask Vellum assistant anything`)
              : t(`Ask LLM assistant anything`)
          }
          onValueChange={handleInputChange}
          value={userInput}
          minRows={1}
          maxRows={18}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onCompositionStart={() => setIsTyping(true)}
          onCompositionEnd={() => setIsTyping(false)}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginRight: 10
          }}
        ></div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginRight: 10
          }}
        >
          <div className="bottom-[14px] right-3 cursor-pointer hover:opacity-50">
            <>
              <IconCirclePlus
                onClick={() => fileInputRef.current?.click()}
                className="animate-pulse rounded bg-transparent p-1"
                size={30}
              />

              {/* Hidden input to select files from device */}
              <Input
                ref={fileInputRef}
                className="hidden"
                type="file"
                onChange={e => {
                  if (!e.target.files) return
                  setFileSelector(true)
                  setToolInUse("retrieval")
                  Cookies.set("talk_with_file_mode", "enabled")
                  handleSelectDeviceFile(e.target.files[0])
                }}
                accept={filesToAccept}
              />
            </>
          </div>
          <div className="bottom-[14px] right-3 cursor-pointer hover:opacity-50">
            {isGenerating ? (
              <IconPlayerStopFilled
                className="hover:bg-background animate-pulse rounded bg-transparent p-1"
                onClick={handleStopMessage}
                size={30}
              />
            ) : (
              <IconSend
                className={cn(
                  "bg-background text-input rounded p-1",
                  !userInput && "cursor-not-allowed opacity-50"
                )}
                onClick={() => {
                  if (!userInput) return

                  handleSendMessage(userInput, chatMessages, false, useVellum)
                }}
                size={30}
              />
            )}
          </div>
        </div>
      </div>
      {
        <div
          style={{
            display: "flex",
            justifyContent: "start",
            alignItems: "center",
            gap: "1%",
            textAlign: "center"
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              border: "1px solid #B1B1B1",
              padding: "1% 2%",
              borderRadius: "10px",
              marginTop: "1%",
              fontSize: "small"
            }}
          >
            <p>
              Type <span style={{ color: "#8B8000" }}>@</span> and then select
              the agent
            </p>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              border: "1px solid #B1B1B1",
              padding: "1% 2%",
              borderRadius: "10px",
              marginTop: "1%",
              fontSize: "small"
            }}
          >
            <p>
              Type <span style={{ color: "#05696B" }}>#</span> to search from
              the uploaded files
            </p>
          </div>
          {role && role.name === "admin" && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                border: "1px solid #B1B1B1",
                padding: "1% 2%",
                borderRadius: "10px",
                marginTop: "1%",
                fontSize: "small"
              }}
            >
              <p>
                Type{" "}
                <span className="font-bold" style={{ color: "#FF00D8" }}>
                  /
                </span>{" "}
                and then select prompt
              </p>
            </div>
          )}
        </div>
      }
    </>
  )
}
