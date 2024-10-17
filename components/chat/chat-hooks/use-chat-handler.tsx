import { ChatbotUIContext } from "@/context/context"
import { getAssistantCollectionsByAssistantId } from "@/db/assistant-collections"
import { getAssistantFilesByAssistantId } from "@/db/assistant-files"
import { getAssistantToolsByAssistantId } from "@/db/assistant-tools"
import { getChatById, updateChat } from "@/db/chats"
import { getCollectionFilesByCollectionId } from "@/db/collection-files"
import { deleteMessagesIncludingAndAfter } from "@/db/messages"
import { buildFinalMessages } from "@/lib/build-prompt"
import { Tables } from "@/supabase/types"
import { ChatMessage, ChatPayload, LLMID, ModelProvider } from "@/types"
import { useParams, useRouter } from "next/navigation"
import { useContext, useEffect, useRef } from "react"
import { LLM_LIST } from "../../../lib/models/llm/llm-list"
import {
  createTempMessages,
  handleCreateChat,
  handleCreateMessages,
  handleHostedChat,
  handleLocalChat,
  handleRetrieval,
  processResponse,
  validateChatSettings
} from "../chat-helpers"
import Cookies from "js-cookie"
import { v4 as uuidv4 } from "uuid"
import { getOrganizationById } from "@/db/organizations"

export const useChatHandler = () => {
  const router = useRouter()
  const params = useParams()
  const {
    userInput,
    useVellum,
    chatFiles,
    setUserInput,
    setNewMessageImages,
    profile,
    setIsGenerating,
    setChatMessages,
    setFirstTokenReceived,
    selectedChat,
    selectedWorkspace,
    setSelectedChat,
    setChats,
    setSelectedTools,
    availableLocalModels,
    availableOpenRouterModels,
    abortController,
    setAbortController,
    chatSettings,
    newMessageImages,
    selectedAssistant,
    chatMessages,
    chatImages,
    setChatImages,
    setChatFiles,
    setNewMessageFiles,
    setShowFilesDisplay,
    newMessageFiles,
    chatFileItems,
    setChatFileItems,
    toolInUse,
    setToolInUse,
    useRetrieval,
    sourceCount,
    setIsPromptPickerOpen,
    setIsFilePickerOpen,
    selectedTools,
    selectedPreset,
    setChatSettings,
    models,
    isPromptPickerOpen,
    isFilePickerOpen,
    isToolPickerOpen,
    isGenerating,
    setSelectedAssistant,
    organization
  } = useContext(ChatbotUIContext)

  const chatInputRef = useRef<HTMLTextAreaElement>(null)
  const vault = Cookies.get("vellum")
  const talk_with_file_mode = Cookies.get("talk_with_file_mode")

  useEffect(() => {
    if (!isPromptPickerOpen || !isFilePickerOpen || !isToolPickerOpen) {
      chatInputRef.current?.focus()
    }
  }, [isPromptPickerOpen, isFilePickerOpen, isToolPickerOpen])

  const handleNewChat = async () => {
    if (!selectedWorkspace) return

    // Reset chat state
    setUserInput("")
    setChatMessages([])
    setSelectedChat(null)
    setChatFileItems([])
    setIsGenerating(false)
    setFirstTokenReceived(false)
    setChatFiles([])
    setChatImages([])
    setNewMessageFiles([])
    setNewMessageImages([])
    setShowFilesDisplay(false)
    setIsPromptPickerOpen(false)
    setIsFilePickerOpen(false)
    setSelectedTools([])
    setToolInUse("none")

    if (selectedAssistant) {
      const assistantId = selectedAssistant.id
      setChatSettings({
        model: selectedAssistant.model as LLMID,
        prompt: selectedAssistant.prompt,
        temperature: selectedAssistant.temperature,
        contextLength: selectedAssistant.context_length,
        includeProfileContext: selectedAssistant.include_profile_context,
        includeWorkspaceInstructions:
          selectedAssistant.include_workspace_instructions,
        embeddingsProvider: selectedAssistant.embeddings_provider as
          | "openai"
          | "local"
      })

      const [assistantFilesRes, assistantCollectionsRes, assistantToolsRes] =
        await Promise.all([
          getAssistantFilesByAssistantId(assistantId),
          getAssistantCollectionsByAssistantId(assistantId),
          getAssistantToolsByAssistantId(assistantId)
        ])

      const allFiles = [
        ...assistantFilesRes.files,
        ...(
          await Promise.all(
            assistantCollectionsRes.collections.map(async collection => {
              const collectionFilesRes = await getCollectionFilesByCollectionId(
                collection.id
              )
              return collectionFilesRes.files
            })
          )
        ).flat()
      ]

      setSelectedTools(assistantToolsRes.tools)
      setChatFiles(
        allFiles.map(file => ({
          id: file.id,
          name: file.name,
          type: file.type,
          file: null
        }))
      )

      if (allFiles.length > 0) setShowFilesDisplay(true)
    } else if (selectedPreset) {
      setChatSettings({
        model: selectedPreset.model as LLMID,
        prompt: selectedPreset.prompt,
        temperature: selectedPreset.temperature,
        contextLength: selectedPreset.context_length,
        includeProfileContext: selectedPreset.include_profile_context,
        includeWorkspaceInstructions:
          selectedPreset.include_workspace_instructions,
        embeddingsProvider: selectedPreset.embeddings_provider as
          | "openai"
          | "local"
      })
    }

    router.push(`/${selectedWorkspace.id}/chat`)
  }

  const handleFocusChatInput = () => {
    chatInputRef.current?.focus()
  }

  const handleStopMessage = () => {
    abortController?.abort()
  }

  const handleSendMessage = async (
    messageContent: string,
    chatMessages: ChatMessage[],
    isRegeneration: boolean,
    toggleStatus: boolean
  ) => {
    const startingInput = messageContent

    try {
      let userChatMessage: ChatMessage = {
        message: {
          chat_id: "",
          assistant_id: null,
          content: userInput,
          created_at: "",
          id: uuidv4(),
          image_paths: [],
          model: chatSettings?.model!,
          role: "user",
          sequence_number: chatMessages.length,
          updated_at: "",
          user_id: "",
          sharing: "private",
          context_length: chatSettings?.contextLength!,
          embeddings_provider: chatSettings?.embeddingsProvider!,
          temperature: chatSettings?.temperature!,
          chunks: {}
        },
        fileItems: []
      }

      // setSelectedAssistant(null)

      setChatSettings({
        model: chatSettings?.model! as LLMID,
        prompt: chatSettings?.prompt!,
        temperature: chatSettings?.temperature!,
        contextLength: chatSettings?.contextLength!,
        includeProfileContext: chatSettings?.includeProfileContext!,
        includeWorkspaceInstructions:
          chatSettings?.includeWorkspaceInstructions!,
        embeddingsProvider: chatSettings?.embeddingsProvider! as
          | "openai"
          | "local"
      })

      setChatMessages([...chatMessages, userChatMessage])

      setUserInput("")
      setIsGenerating(true)
      setIsPromptPickerOpen(false)
      setIsFilePickerOpen(false)
      setNewMessageImages([])

      const newAbortController = new AbortController()
      setAbortController(newAbortController)

      const modelData = [
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
      ].find(llm => llm.modelId === chatSettings?.model)

      validateChatSettings(
        chatSettings,
        modelData,
        profile,
        selectedWorkspace,
        messageContent
      )

      let currentChat = selectedChat ? { ...selectedChat } : null

      const b64Images = newMessageImages.map(image => image.base64)

      let retrievedFileItems: Tables<"file_items">[] = []

      console.log({ chatSettings })

      if (vault || talk_with_file_mode) {
        setToolInUse("retrieval")
        console.log({ chatSettings: chatSettings?.prompt })

        retrievedFileItems = await handleRetrieval(
          messageContent,
          newMessageFiles,
          chatFiles,
          chatSettings!.embeddingsProvider,
          sourceCount
        )

        // Remove the last file from newMessageFiles
        setNewMessageFiles(prev => prev.slice(0, -1))

        // Reset the selected assistant and show files display
        setSelectedAssistant(null)
        setShowFilesDisplay(false)

        // Remove the "talk_with_file_mode" cookie
        Cookies.remove("talk_with_file_mode")
      } else {
        setToolInUse("none")
      }

      const { tempUserChatMessage, tempAssistantChatMessage } =
        createTempMessages(
          messageContent,
          chatMessages,
          chatSettings!,
          b64Images,
          isRegeneration,
          setChatMessages,
          selectedAssistant,
          isGenerating
        )

      const payload: ChatPayload = {
        chatSettings: chatSettings!,
        workspaceInstructions: selectedWorkspace!.instructions || "",
        chatMessages: isRegeneration
          ? [...chatMessages]
          : [...chatMessages, tempUserChatMessage],
        assistant: selectedChat?.assistant_id ? selectedAssistant : null,
        messageFileItems: retrievedFileItems,
        chatFileItems: chatFileItems
      }

      let generatedText = ""

      if (selectedTools.length > 0) {
        setToolInUse("Tools")
        const formattedMessages = await buildFinalMessages(
          payload,
          profile!,
          organization!,
          chatImages
        )
        const response = await fetch("/api/chat/tools", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chatSettings: payload.chatSettings,
            messages: formattedMessages,
            selectedTools
          })
        })

        setToolInUse("none")
        generatedText = await processResponse(
          response,
          isRegeneration
            ? payload.chatMessages[payload.chatMessages.length - 1]
            : tempAssistantChatMessage,
          true,
          newAbortController,
          setFirstTokenReceived,
          setChatMessages,
          setToolInUse
        )
      } else {
        if (modelData!.provider === "ollama") {
          generatedText = await handleLocalChat(
            payload,
            profile!,
            organization!,
            chatSettings!,
            tempAssistantChatMessage,
            isRegeneration,
            newAbortController,
            setIsGenerating,
            setFirstTokenReceived,
            setChatMessages,
            setToolInUse
          )
        } else {
          generatedText = await handleHostedChat(
            payload,
            profile!,
            organization!,
            modelData!,
            tempAssistantChatMessage,
            isRegeneration,
            newAbortController,
            newMessageImages,
            chatImages,
            setIsGenerating,
            setFirstTokenReceived,
            setChatMessages,
            setToolInUse
          )
        }
      }

      if (!currentChat) {
        currentChat = await handleCreateChat(
          chatSettings!,
          profile!,
          selectedWorkspace!,
          messageContent,
          selectedAssistant!,
          newMessageFiles,
          setSelectedChat,
          setChats,
          setChatFiles
        )
      } else {
        const updatedChat = await updateChat(currentChat.id, {
          updated_at: new Date().toISOString()
        })
        setChats(prevChats =>
          prevChats.map(prevChat =>
            prevChat.id === updatedChat.id ? updatedChat : prevChat
          )
        )
      }

      await handleCreateMessages(
        chatSettings!,
        chatMessages,
        currentChat,
        profile!,
        modelData!,
        messageContent,
        generatedText,
        newMessageImages,
        isRegeneration,
        retrievedFileItems,
        setChatMessages,
        setChatFileItems,
        setChatImages,
        selectedAssistant
      )

      setIsGenerating(false)
      setFirstTokenReceived(false)
      setUserInput("")
    } catch (error) {
      setIsGenerating(false)
      setFirstTokenReceived(false)
      setUserInput(startingInput)
    }
  }

  const handleSendEdit = async (
    editedContent: string,
    sequenceNumber: number
  ) => {
    if (!selectedChat) return

    await deleteMessagesIncludingAndAfter(
      selectedChat.user_id,
      selectedChat.id,
      sequenceNumber
    )

    const filteredMessages = chatMessages.filter(
      chatMessage => chatMessage.message.sequence_number < sequenceNumber
    )

    setChatMessages(filteredMessages)

    handleSendMessage(editedContent, filteredMessages, false, useVellum)
  }

  return {
    chatInputRef,
    handleNewChat,
    handleSendMessage,
    handleFocusChatInput,
    handleStopMessage,
    handleSendEdit
  }
}
