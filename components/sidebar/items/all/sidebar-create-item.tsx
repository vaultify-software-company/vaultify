import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet"
import {
  cancelButtonStyle,
  sidebarStyle,
  successButtonStyle
} from "@/components/ui/styles"
import { ChatbotUIContext } from "@/context/context"
import { createUser } from "@/db/admin"
import { createAssistantCollections } from "@/db/assistant-collections"
import { createAssistantFiles } from "@/db/assistant-files"
import { createAssistantTools } from "@/db/assistant-tools"
import { createAssistant, updateAssistant } from "@/db/assistants"
import { createChat } from "@/db/chats"
import { createCollectionFiles } from "@/db/collection-files"
import { createCollection } from "@/db/collections"
import { createFileBasedOnExtension } from "@/db/files"
import { createModel } from "@/db/models"
import { getOrganizationById } from "@/db/organizations"
import { createPreset } from "@/db/presets"
import {
  createProfile,
  getProfileByUserId,
  updateProfile,
  updateProfileByOrganization
} from "@/db/profile"
import { createPrompt } from "@/db/prompts"
import { getRoleById, getRoleByName } from "@/db/roles"
import {
  getAssistantImageFromStorage,
  uploadAssistantImage
} from "@/db/storage/assistant-images"
import { createTool } from "@/db/tools"
import {
  getWorkspacesByUserId,
  updateWorkspace,
  updateWorkspaceByOrganization,
  updateWorkspaceByUserId
} from "@/db/workspaces"
import { convertBlobToBase64 } from "@/lib/blob-to-b64"
import { supabase } from "@/lib/supabase/browser-client"
import { Tables, TablesInsert, TablesUpdate } from "@/supabase/types"
import { ContentType } from "@/types"
import path from "path"
import { FC, useContext, useRef, useState } from "react"
import { toast } from "sonner"

interface SidebarCreateItemProps {
  isOpen: boolean
  isTyping: boolean
  onOpenChange: (isOpen: boolean) => void
  contentType: ContentType
  renderInputs: () => JSX.Element
  createState: any
}

export const SidebarCreateItem: FC<SidebarCreateItemProps> = ({
  isOpen,
  onOpenChange,
  contentType,
  renderInputs,
  createState,
  isTyping
}) => {
  const {
    profile,
    selectedWorkspace,
    setChats,
    setProfiles,
    setPresets,
    setPrompts,
    setFiles,
    setCollections,
    setAssistants,
    setAssistantImages,
    setTools,
    setModels,
    setShowLog
  } = useContext(ChatbotUIContext)

  const buttonRef = useRef<HTMLButtonElement>(null)

  const [creating, setCreating] = useState(false)

  const createFunctions: any = {
    chats: createChat,
    presets: createPreset,
    prompts: createPrompt,
    profiles: async (createState: {
      email: string
      password: string
      user_metadata: { name: string; password: string }
    }) => {
      if (!profile) return

      const { data, error } = await createUser(createState)

      if (error) {
        return toast.error(error.message)
      }

      const user = data?.user
      if (!user) return

      const adminOrganization = await getOrganizationById(
        profile.organization_id
      )
      const userProfile = await getProfileByUserId(user.id)
      const userRole = await getRoleByName("user")

      const updatedUserProfile = await updateProfileByOrganization(
        user.id,
        userRole.id,
        userProfile,
        adminOrganization,
        createState.user_metadata.name,
        false
      )

      await updateWorkspaceByOrganization(user.id, adminOrganization)

      toast.success("Profile created successfully")

      return updatedUserProfile
    },
    files: async (createState: any, workspaceId: string) => {
      if (!selectedWorkspace) return

      let files: any = []

      for (let i of createState) {
        const { file, ...rest } = i
        const createdFile = await createFileBasedOnExtension(
          file,
          rest,
          workspaceId,
          selectedWorkspace.embeddings_provider as "openai" | "local"
        )
        files.push(createdFile)
      }

      toast.info(
        `Uploading "${files[0]?.title}". You'll be notified once it's ready!`
      )
      setShowLog(false)
      return files
    },
    collections: async (
      createState: {
        image: File
        collectionFiles: TablesInsert<"collection_files">[]
      } & Tables<"collections">,
      workspaceId: string
    ) => {
      const { collectionFiles, ...rest } = createState

      const createdCollection = await createCollection(rest, workspaceId)

      const finalCollectionFiles = collectionFiles.map(collectionFile => ({
        ...collectionFile,
        collection_id: createdCollection.id
      }))

      await createCollectionFiles(finalCollectionFiles)

      return createdCollection
    },
    assistants: async (
      createState: {
        image: File
        files: Tables<"files">[]
        collections: Tables<"collections">[]
        tools: Tables<"tools">[]
      } & Tables<"assistants">,
      workspaceId: string
    ) => {
      const { image, files, collections, tools, ...rest } = createState

      const createdAssistant = await createAssistant(rest, workspaceId)

      let updatedAssistant = createdAssistant

      if (image) {
        const filePath = await uploadAssistantImage(createdAssistant, image)

        updatedAssistant = await updateAssistant(createdAssistant.id, {
          image_path: filePath
        })

        const url = (await getAssistantImageFromStorage(filePath)) || ""

        if (url) {
          const response = await fetch(url)
          const blob = await response.blob()
          const base64 = await convertBlobToBase64(blob)

          setAssistantImages(prev => [
            ...prev,
            {
              assistantId: updatedAssistant.id,
              path: filePath,
              base64,
              url
            }
          ])
        }
      }

      const assistantFiles = files.map(file => ({
        user_id: rest.user_id,
        assistant_id: createdAssistant.id,
        file_id: file.id
      }))

      const assistantCollections = collections.map(collection => ({
        user_id: rest.user_id,
        assistant_id: createdAssistant.id,
        collection_id: collection.id
      }))

      const assistantTools = tools.map(tool => ({
        user_id: rest.user_id,
        assistant_id: createdAssistant.id,
        tool_id: tool.id
      }))

      await createAssistantFiles(assistantFiles)
      await createAssistantCollections(assistantCollections)
      await createAssistantTools(assistantTools)

      return updatedAssistant
    },
    tools: createTool,
    models: createModel,
    matcher: null
  }

  const stateUpdateFunctions: any = {
    chats: setChats,
    presets: setPresets,
    prompts: setPrompts,
    profiles: setProfiles,
    files: setFiles,
    collections: setCollections,
    assistants: setAssistants,
    tools: setTools,
    models: setModels,
    matcher: null
  }

  const handleCreate = async () => {
    try {
      if (!selectedWorkspace) return
      if (isTyping) return // Prevent creation while typing

      const createFunction = createFunctions[contentType]
      const setStateFunction = stateUpdateFunctions[contentType]

      if (!createFunction || !setStateFunction) return

      setCreating(true)

      const newItem = await createFunction(createState, selectedWorkspace.id)
      const parsedItem = contentType === "files" ? newItem : [newItem]
      if (parsedItem) {
        setStateFunction((prevItems: any) => [...prevItems, ...parsedItem])
      }

      onOpenChange(false)
      setCreating(false)
    } catch (error) {
      toast.error(`Error creating ${contentType.slice(0, -1)}. ${error}.`)
      setCreating(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isTyping && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      buttonRef.current?.click()
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        className="flex min-w-[450px] flex-col justify-between overflow-auto "
        side="left"
        onKeyDown={handleKeyDown}
        style={sidebarStyle}
      >
        <div className="grow overflow-auto">
          <SheetHeader>
            <SheetTitle className="text-2xl font-bold">
              Create{" "}
              {contentType.charAt(0).toUpperCase() + contentType.slice(1, -1)}
            </SheetTitle>
          </SheetHeader>

          <div className="mt-4 space-y-3">{renderInputs()}</div>
        </div>

        <SheetFooter className="mt-2 flex justify-between">
          <div className="flex grow justify-end space-x-2">
            <Button
              disabled={creating}
              variant="outline"
              onClick={() => onOpenChange(false)}
              style={cancelButtonStyle}
            >
              Cancel
            </Button>

            <Button
              disabled={creating}
              ref={buttonRef}
              onClick={handleCreate}
              style={successButtonStyle}
            >
              {creating ? "Creating..." : "Create"}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
