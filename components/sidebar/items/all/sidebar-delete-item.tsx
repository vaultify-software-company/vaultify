import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { cancelButtonStyle, sidebarStyle } from "@/components/ui/styles"
import { ChatbotUIContext } from "@/context/context"
import { deleteUser } from "@/db/admin"
import { deleteAssistant } from "@/db/assistants"
import { deleteChat } from "@/db/chats"
import { deleteCollection } from "@/db/collections"
import { deleteFile } from "@/db/files"
import { deleteModel } from "@/db/models"
import { deletePreset } from "@/db/presets"
import { deletePrompt } from "@/db/prompts"
import { deleteFileFromStorage } from "@/db/storage/files"
import { deleteTool } from "@/db/tools"
import { supabase } from "@/lib/supabase/browser-client"
import { Tables } from "@/supabase/types"
import { ContentType, DataItemType } from "@/types"
import { UserIdentity } from "@supabase/supabase-js"
import { profile } from "console"
import { FC, useContext, useRef, useState } from "react"
import { toast } from "sonner"

interface SidebarDeleteItemProps {
  item: DataItemType
  contentType: ContentType
}

export const SidebarDeleteItem: FC<SidebarDeleteItemProps> = ({
  item,
  contentType
}) => {
  const {
    role,
    setChats,
    setPresets,
    setPrompts,
    setProfiles,
    setFiles,
    setCollections,
    setAssistants,
    setTools,
    setModels
  } = useContext(ChatbotUIContext)

  const buttonRef = useRef<HTMLButtonElement>(null)

  const [showDialog, setShowDialog] = useState(false)

  const deleteFunctions: any = {
    chats: async (chat: Tables<"chats">) => {
      await deleteChat(chat.id)
    },
    presets: async (preset: Tables<"presets">) => {
      await deletePreset(preset.id)
    },
    prompts: async (prompt: Tables<"prompts">) => {
      await deletePrompt(prompt.id)
    },
    profiles: async (profile: Tables<"profiles">) => {
      try {
        const { data, error } = await deleteUser(profile.user_id)

        if (error) {
          console.error(error)
          return toast.error(error?.message)
        }

        toast.success("Profile deleted successfully")
        return data
      } catch (error) {
        console.error(error)
        toast.error("Error deleting profile")
      }
    },
    files: async (file: Tables<"files">) => {
      await deleteFileFromStorage(file.file_path)
      await deleteFile(file.id)
    },
    collections: async (collection: Tables<"collections">) => {
      await deleteCollection(collection.id)
    },
    assistants: async (assistant: Tables<"assistants">) => {
      await deleteAssistant(assistant.id)
      setChats(prevState =>
        prevState.filter(chat => chat.assistant_id !== assistant.id)
      )
    },
    tools: async (tool: Tables<"tools">) => {
      await deleteTool(tool.id)
    },
    models: async (model: Tables<"models">) => {
      await deleteModel(model.id)
    },
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

  const handleDelete = async () => {
    toast.info("Deleting...")
    const deleteFunction = deleteFunctions[contentType]
    const setStateFunction = stateUpdateFunctions[contentType]

    if (!deleteFunction || !setStateFunction) return

    await deleteFunction(item as any)

    toast.success("Deleted successfully")
    setStateFunction((prevItems: any) =>
      prevItems.filter((prevItem: any) => prevItem.id !== item.id)
    )

    setShowDialog(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      e.stopPropagation()
      buttonRef.current?.click()
    }
  }

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button
          className="border-input border text-red-500"
          variant="ghost"
          disabled={contentType === "assistants" && role?.name !== "admin"}
        >
          Delete
        </Button>
      </DialogTrigger>

      <DialogContent onKeyDown={handleKeyDown}>
        <DialogHeader style={{ wordBreak: "break-all" }}>
          <DialogTitle>Delete {contentType.slice(0, -1)}</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {item.name}?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setShowDialog(false)}>
            Cancel
          </Button>

          <Button ref={buttonRef} variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
