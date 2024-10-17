import { Tables } from "@/supabase/types"
import { ChatPayload, MessageImage } from "@/types"
import { encode } from "gpt-tokenizer"

const buildBasePrompt = (
  prompt: string,
  profileContext: string,
  workspaceInstructions: string,
  assistant: Tables<"assistants"> | null
) => {
  let fullPrompt = ""

  if (assistant) {
    fullPrompt += `<INJECT ROLE>\nYou are not an AI. You are ${assistant.name}.\n</INJECT ROLE>\n\n`
  }

  fullPrompt += `Today is ${new Date().toLocaleDateString()}.\n\n`

  if (profileContext) {
    fullPrompt += `User Info:\n${profileContext}\n\n`
  }

  if (workspaceInstructions) {
    fullPrompt += `System Instructions:\n${workspaceInstructions}\n\n`
  }

  fullPrompt += `User Instructions:\n${prompt}`

  return fullPrompt
}

export async function buildFinalMessages(
  payload: ChatPayload,
  profile: Tables<"profiles">,
  organization: Tables<"organizations">,
  chatImages: MessageImage[]
) {
  const {
    chatSettings,
    workspaceInstructions,
    chatMessages,
    assistant,
    messageFileItems,
    chatFileItems
  } = payload

  const BUILT_PROMPT = buildBasePrompt(
    chatSettings.prompt,
    chatSettings.includeProfileContext
      ? organization?.profile_context || ""
      : "",
    chatSettings.includeWorkspaceInstructions ? workspaceInstructions : "",
    assistant
  )

  const CHUNK_SIZE = chatSettings.contextLength
  const PROMPT_TOKENS = encode(chatSettings.prompt).length

  let remainingTokens = CHUNK_SIZE - PROMPT_TOKENS
  let usedTokens = PROMPT_TOKENS

  const processedChatMessages = await Promise.all(
    chatMessages.map(async (chatMessage, index) => {
      const nextChatMessage = chatMessages[index + 1]

      if (!nextChatMessage) {
        return chatMessage
      }

      const nextChatMessageFileItems = nextChatMessage.fileItems

      if (nextChatMessageFileItems.length > 0) {
        const findFileItems = nextChatMessageFileItems
          .map(fileItemId =>
            chatFileItems.find(chatFileItem => chatFileItem.id === fileItemId)
          )
          .filter(item => item !== undefined) as Tables<"file_items">[]

        const retrievalText = await buildRetrievalText(findFileItems)

        return {
          ...chatMessage,
          message: {
            ...chatMessage.message,
            content: `${chatMessage.message.content}\n\n${retrievalText}`
          },
          fileItems: []
        }
      }

      return chatMessage
    })
  )

  let finalMessages = []

  for (let i = processedChatMessages.length - 1; i >= 0; i--) {
    const message = processedChatMessages[i].message
    const messageTokens = encode(message.content).length

    if (messageTokens <= remainingTokens) {
      remainingTokens -= messageTokens
      usedTokens += messageTokens
      finalMessages.unshift(message)
    } else {
      break
    }
  }

  let tempSystemMessage: Tables<"messages"> = {
    chat_id: "",
    assistant_id: null,
    content: BUILT_PROMPT,
    created_at: "",
    id: processedChatMessages.length.toString(),
    image_paths: [],
    model: payload.chatSettings.model,
    role: "system",
    sequence_number: processedChatMessages.length,
    updated_at: "",
    user_id: "",
    sharing: "private",
    context_length: chatSettings.contextLength,
    embeddings_provider: chatSettings.embeddingsProvider,
    temperature: chatSettings.temperature,
    chunks: {}
  }

  finalMessages.unshift(tempSystemMessage)

  finalMessages = finalMessages.map(message => {
    if (message.image_paths.length > 0) {
      const content = [
        {
          type: "text",
          text: message.content
        },
        ...message.image_paths.map(path => {
          let formedUrl = ""

          if (path.startsWith("data")) {
            formedUrl = path
          } else {
            const chatImage = chatImages.find(image => image.path === path)

            if (chatImage) {
              formedUrl = chatImage.base64
            }
          }

          return {
            type: "image_url",
            image_url: formedUrl
          }
        })
      ]
      return {
        role: message.role,
        content
      }
    } else {
      return {
        role: message.role,
        content: message.content
      }
    }
  })

  if (messageFileItems.length > 0) {
    const retrievalText = await buildRetrievalText(messageFileItems)

    finalMessages[finalMessages.length - 1] = {
      ...finalMessages[finalMessages.length - 1],
      content: `${finalMessages[finalMessages.length - 1].content}\n\n${retrievalText}`
    }
  }

  return finalMessages
}

async function buildRetrievalText(fileItems: Tables<"file_items">[]) {
  const retrievalText = fileItems
    .map(item => `content: \n${item.content}\n`)
    .join("\n\n")

  return `\n\n${retrievalText}\n\n`
}

export async function buildGoogleGeminiFinalMessages(
  payload: ChatPayload,
  profile: Tables<"profiles">,
  messageImageFiles: MessageImage[]
) {
  const { chatSettings, workspaceInstructions, chatMessages, assistant } =
    payload

  const BUILT_PROMPT = buildBasePrompt(
    chatSettings.prompt,
    chatSettings.includeProfileContext ? profile.profile_context || "" : "",
    chatSettings.includeWorkspaceInstructions ? workspaceInstructions : "",
    assistant
  )

  let finalMessages = []

  let usedTokens = 0
  const CHUNK_SIZE = chatSettings.contextLength
  const PROMPT_TOKENS = encode(chatSettings.prompt).length
  let REMAINING_TOKENS = CHUNK_SIZE - PROMPT_TOKENS

  usedTokens += PROMPT_TOKENS

  for (let i = chatMessages.length - 1; i >= 0; i--) {
    const message = chatMessages[i].message
    const messageTokens = encode(message.content).length

    if (messageTokens <= REMAINING_TOKENS) {
      REMAINING_TOKENS -= messageTokens
      usedTokens += messageTokens
      finalMessages.unshift(message)
    } else {
      break
    }
  }

  let tempSystemMessage: Tables<"messages"> = {
    chat_id: "",
    assistant_id: null,
    content: BUILT_PROMPT,
    created_at: "",
    id: chatMessages.length + "",
    image_paths: [],
    model: payload.chatSettings.model,
    role: "system",
    sequence_number: chatMessages.length,
    updated_at: "",
    user_id: "",
    sharing: "private",
    context_length: chatSettings.contextLength,
    embeddings_provider: chatSettings.embeddingsProvider,
    temperature: chatSettings.temperature,
    chunks: {}
  }

  finalMessages.unshift(tempSystemMessage)

  let GOOGLE_FORMATTED_MESSAGES = []

  if (chatSettings.model === "gemini-pro") {
    GOOGLE_FORMATTED_MESSAGES = [
      {
        role: "user",
        parts: finalMessages[0].content
      },
      {
        role: "model",
        parts: "I will follow your instructions."
      }
    ]

    for (let i = 1; i < finalMessages.length; i++) {
      GOOGLE_FORMATTED_MESSAGES.push({
        role: finalMessages[i].role === "user" ? "user" : "model",
        parts: finalMessages[i].content as string
      })
    }

    return GOOGLE_FORMATTED_MESSAGES
  } else if ((chatSettings.model = "gemini-pro-vision")) {
    // Gemini Pro Vision doesn't currently support messages
    async function fileToGenerativePart(file: File) {
      const base64EncodedDataPromise = new Promise(resolve => {
        const reader = new FileReader()

        reader.onloadend = () => {
          if (typeof reader.result === "string") {
            resolve(reader.result.split(",")[1])
          }
        }

        reader.readAsDataURL(file)
      })

      return {
        inlineData: {
          data: await base64EncodedDataPromise,
          mimeType: file.type
        }
      }
    }

    let prompt = ""

    for (let i = 0; i < finalMessages.length; i++) {
      prompt += `${finalMessages[i].role}:\n${finalMessages[i].content}\n\n`
    }

    const files = messageImageFiles.map(file => file.file)
    const imageParts = await Promise.all(
      files.map(file =>
        file ? fileToGenerativePart(file) : Promise.resolve(null)
      )
    )

    // FIX: Hacky until chat messages are supported
    return [
      {
        prompt,
        imageParts
      }
    ]
  }

  return finalMessages
}
