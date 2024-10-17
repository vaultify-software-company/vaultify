"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/browser-client"
import { getOrganizationById } from "@/db/organizations"
import { getProfileByUserId, getProfilesByRoleId } from "@/db/profile"
import { getRoleById, getRoleByName } from "@/db/roles"
import { getWorkspaceImageFromStorage } from "@/db/storage/workspace-images"
import { getWorkspacesByUserId } from "@/db/workspaces"
import {
  fetchHostedModels,
  fetchOllamaModels,
  fetchOpenRouterModels
} from "@/lib/models/fetch-models"
import { convertBlobToBase64 } from "@/lib/blob-to-b64"
import { ChatbotUIContext } from "@/context/context"
import Cookies from "js-cookie"

interface GlobalStateProps {
  children: React.ReactNode
}

export const GlobalState: React.FC<GlobalStateProps> = ({ children }) => {
  const router = useRouter()

  // Profile state
  const [profile, setProfile] = useState<any>(null)
  const [role, setRole] = useState<any>(null)
  const [admin, setAdmin] = useState<any>(null)

  // Organization state
  const [organization, setOrganization] = useState<any>(null)

  // Items state
  const [assistants, setAssistants] = useState<any[]>([])
  const [collections, setCollections] = useState<any[]>([])
  const [chats, setChats] = useState<any[]>([])
  const [files, setFiles] = useState<any[]>([])
  const [folders, setFolders] = useState<any[]>([])
  const [models, setModels] = useState<any[]>([])
  const [presets, setPresets] = useState<any[]>([])
  const [prompts, setPrompts] = useState<any[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [tools, setTools] = useState<any[]>([])
  const [workspaces, setWorkspaces] = useState<any[]>([])

  // Models state
  const [envKeyMap, setEnvKeyMap] = useState<any>({})
  const [availableHostedModels, setAvailableHostedModels] = useState<any[]>([])
  const [availableLocalModels, setAvailableLocalModels] = useState<any[]>([])
  const [availableOpenRouterModels, setAvailableOpenRouterModels] = useState<
    any[]
  >([])

  // Workspace state
  const [selectedWorkspace, setSelectedWorkspace] = useState<any>(null)
  const [workspaceImages, setWorkspaceImages] = useState<any[]>([])

  // Preset state
  const [selectedPreset, setSelectedPreset] = useState<any>(null)

  // Assistant state
  const [selectedAssistant, setSelectedAssistant] = useState<any>(null)
  const [assistantImages, setAssistantImages] = useState<any[]>([])
  const [openaiAssistants, setOpenaiAssistants] = useState<any[]>([])

  // Passive chat state
  const [userInput, setUserInput] = useState<string>("")

  // Chat Settings Setup Start
  const [chatMessages, setChatMessages] = useState<any[]>([])

  const defaultChatSettings = {
    model: "gpt-4o-mini",
    prompt: "You are ChatGPT, an AI assistant created by OpenAI.",
    temperature: 0.4,
    contextLength: 4096,
    includeProfileContext: false,
    includeWorkspaceInstructions: true,
    embeddingsProvider: "openai"
  }

  const [chatSettings, setChatSettings] = useState<any>(() => {
    if (typeof window !== "undefined") {
      // We're in the browser, so localStorage can be accessed
      const savedChatSettings = localStorage.getItem("chat-settings")
      return savedChatSettings
        ? JSON.parse(savedChatSettings)
        : defaultChatSettings
    }
    return defaultChatSettings // Provide default value for SSR
  })

  useEffect(() => {
    // Save chatSettings to localStorage whenever it changes
    if (typeof window !== "undefined") {
      localStorage.setItem("chat-settings", JSON.stringify(chatSettings))
    }
  }, [chatSettings])
  // Chat Settings Setup End

  const [selectedChat, setSelectedChat] = useState<any>(null)
  const [chatFileItems, setChatFileItems] = useState<any[]>([])

  // Active chat state
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [firstTokenReceived, setFirstTokenReceived] = useState<boolean>(false)
  const [abortController, setAbortController] =
    useState<AbortController | null>(null)

  // Chat input command state
  const [isPromptPickerOpen, setIsPromptPickerOpen] = useState(false)
  const [slashCommand, setSlashCommand] = useState("")
  const [isFilePickerOpen, setIsFilePickerOpen] = useState(false)
  const [hashtagCommand, setHashtagCommand] = useState("")
  const [isToolPickerOpen, setIsToolPickerOpen] = useState(false)
  const [toolCommand, setToolCommand] = useState("")
  const [focusPrompt, setFocusPrompt] = useState(false)
  const [focusFile, setFocusFile] = useState(false)
  const [focusTool, setFocusTool] = useState(false)
  const [focusAssistant, setFocusAssistant] = useState(false)
  const [atCommand, setAtCommand] = useState("")
  const [isAssistantPickerOpen, setIsAssistantPickerOpen] = useState(false)
  const [isFileSelected, setIsFileSelected] = useState(false)

  // Attachment state
  const [chatFiles, setChatFiles] = useState<any[]>([])
  const [chatImages, setChatImages] = useState<any[]>([])
  const [newMessageFiles, setNewMessageFiles] = useState<any[]>([])
  const [newMessageImages, setNewMessageImages] = useState<any[]>([])
  const [showFilesDisplay, setShowFilesDisplay] = useState<boolean>(false)

  // Retrieval state
  const [useRetrieval, setUseRetrieval] = useState<boolean>(true)
  const [updateItems, setUpdateItems] = useState<any[]>([])
  const [sourceCount, setSourceCount] = useState<number>(4)

  // Tool state
  const [selectedTools, setSelectedTools] = useState<any[]>([])
  const [toolInUse, setToolInUse] = useState<string>("none")
  const [useVellum, setUseVellum] = useState<boolean>(false)
  const [showLog, setShowLog] = useState<boolean>(false)

  useEffect(() => {
    ;(async () => {
      const profile = await fetchStartingData()

      const vellum = Cookies.get("vellum")

      if (vellum && vellum === "enabled") {
        setUseVellum(true)
      }

      if (profile) {
        const hostedModelRes = await fetchHostedModels(profile)
        if (!hostedModelRes) return

        setEnvKeyMap(hostedModelRes.envKeyMap)
        setAvailableHostedModels(hostedModelRes.hostedModels)

        if (
          profile["openrouter_api_key"] ||
          hostedModelRes.envKeyMap["openrouter"]
        ) {
          const openRouterModels = await fetchOpenRouterModels()
          if (!openRouterModels) return
          setAvailableOpenRouterModels(openRouterModels)
        }
      }

      if (process.env.NEXT_PUBLIC_OLLAMA_URL) {
        const localModels = await fetchOllamaModels()
        if (!localModels) return
        setAvailableLocalModels(localModels)
      }
    })()
  }, [])

  const fetchStartingData = async () => {
    try {
      const session = (await supabase.auth.getSession()).data.session

      if (!session) {
        console.log("No active session found.")
        return
      }

      const user = session.user

      const [profile, userRole, adminRole] = await Promise.all([
        getProfileByUserId(user.id),
        getRoleByName("user"),
        getRoleByName("admin")
      ])

      if (!profile) {
        return
      }

      setProfile(profile)

      const role = await getRoleById(profile.role_id)
      setRole(role)

      const profiles = await getProfilesByRoleId(userRole.id)
      const filteredProfiles = profiles.filter(
        p => p.organization_id === profile.organization_id
      )
      setProfiles(filteredProfiles)

      const organization = await getOrganizationById(profile.organization_id)
      setOrganization(organization)

      if (
        role.name !== "admin" &&
        (profile.has_onboarded === false || organization.sync === false)
      ) {
        router.push("/setup")
        return
      }

      const workspaces = await getWorkspacesByUserId(profile.user_id)
      setWorkspaces(workspaces)

      for (const workspace of workspaces) {
        let workspaceImageUrl = ""

        if (workspace.image_path) {
          workspaceImageUrl =
            (await getWorkspaceImageFromStorage(workspace.image_path)) || ""
        }

        if (workspaceImageUrl) {
          const response = await fetch(workspaceImageUrl)
          const blob = await response.blob()
          const base64 = await convertBlobToBase64(blob)

          setWorkspaceImages(prev => [
            ...prev,
            {
              workspaceId: workspace.id,
              path: workspace.image_path,
              base64: base64,
              url: workspaceImageUrl
            }
          ])
        }
      }

      return profile
    } catch (error) {
      console.error("Error in fetchStartingData:", error)
    }
  }

  return (
    <ChatbotUIContext.Provider
      value={{
        // PROFILE STORE
        profile,
        setProfile,
        role,
        setRole,
        admin,
        setAdmin,
        // ORGANIZATION STORE
        organization,
        setOrganization,
        // ITEMS STORE
        assistants,
        setAssistants,
        collections,
        setCollections,
        chats,
        setChats,
        files,
        setFiles,
        folders,
        setFolders,
        models,
        setModels,
        presets,
        setPresets,
        prompts,
        setPrompts,
        profiles,
        setProfiles,
        tools,
        setTools,
        workspaces,
        setWorkspaces,

        // MODELS STORE
        envKeyMap,
        setEnvKeyMap,
        availableHostedModels,
        setAvailableHostedModels,
        availableLocalModels,
        setAvailableLocalModels,
        availableOpenRouterModels,
        setAvailableOpenRouterModels,

        // WORKSPACE STORE
        selectedWorkspace,
        setSelectedWorkspace,
        workspaceImages,
        setWorkspaceImages,

        // PRESET STORE
        selectedPreset,
        setSelectedPreset,

        // ASSISTANT STORE
        selectedAssistant,
        setSelectedAssistant,
        assistantImages,
        setAssistantImages,
        openaiAssistants,
        setOpenaiAssistants,

        // PASSIVE CHAT STORE
        userInput,
        setUserInput,
        chatMessages,
        setChatMessages,
        chatSettings,
        setChatSettings,
        selectedChat,
        setSelectedChat,
        chatFileItems,
        setChatFileItems,

        // ACTIVE CHAT STORE
        isGenerating,
        setIsGenerating,
        firstTokenReceived,
        setFirstTokenReceived,
        abortController,
        setAbortController,

        // CHAT INPUT COMMAND STORE
        isPromptPickerOpen,
        setIsPromptPickerOpen,
        slashCommand,
        setSlashCommand,
        isFilePickerOpen,
        setIsFilePickerOpen,
        hashtagCommand,
        setHashtagCommand,
        isToolPickerOpen,
        setIsToolPickerOpen,
        toolCommand,
        setToolCommand,
        focusPrompt,
        setFocusPrompt,
        focusFile,
        setFocusFile,
        focusTool,
        setFocusTool,
        focusAssistant,
        setFocusAssistant,
        atCommand,
        setAtCommand,
        isAssistantPickerOpen,
        setIsAssistantPickerOpen,
        isFileSelected,
        setIsFileSelected,

        // ATTACHMENT STORE
        chatFiles,
        setChatFiles,
        chatImages,
        setChatImages,
        newMessageFiles,
        setNewMessageFiles,
        newMessageImages,
        setNewMessageImages,
        showFilesDisplay,
        setShowFilesDisplay,

        // RETRIEVAL STORE
        useRetrieval,
        setUseRetrieval,
        updateItems,
        setUpdateItems,
        sourceCount,
        setSourceCount,

        // TOOL STORE
        selectedTools,
        setSelectedTools,
        toolInUse,
        setToolInUse,
        useVellum,
        setUseVellum,
        showLog,
        setShowLog
      }}
    >
      {children}
    </ChatbotUIContext.Provider>
  )
}
