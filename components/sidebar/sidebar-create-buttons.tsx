import { useChatHandler } from "@/components/chat/chat-hooks/use-chat-handler"
import { ChatbotUIContext } from "@/context/context"
import { createFolder } from "@/db/folders"
import { ContentType } from "@/types"
import {
  IconFileImport,
  IconFolderPlus,
  IconPlus,
  IconTrash
} from "@tabler/icons-react"
import { FC, useContext, useState } from "react"
import { Button } from "../ui/button"
import { CreateAssistant } from "./items/assistants/create-assistant"
import { CreateCollection } from "./items/collections/create-collection"
import { CreateFile } from "./items/files/create-file"
import { CreateModel } from "./items/models/create-model"
import { CreatePreset } from "./items/presets/create-preset"
import { CreatePrompt } from "./items/prompts/create-prompt"
import { CreateTool } from "./items/tools/create-tool"
import { CreateUserProfile } from "./items/profiles/create-profile"
import { sidebarStyle, successButtonStyle } from "../ui/styles"
import { BulkImportUserProfiles } from "./items/profiles/bulk-import-profiles"
import { CreateCustomKnowledgeBase } from "./items/knowlege-base/create-knowledge-base"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"

interface SidebarCreateButtonsProps {
  contentType: ContentType
  hasData: boolean
  deleteFileIds?: string[]
  handleDeleteFiles?: () => void
}

export const SidebarCreateButtons: FC<SidebarCreateButtonsProps> = ({
  contentType,
  hasData,
  deleteFileIds,
  handleDeleteFiles
}) => {
  const { profile, selectedWorkspace, folders, role, setFolders } =
    useContext(ChatbotUIContext)
  const { handleNewChat } = useChatHandler()
  const [showDialog, setShowDialog] = useState(false)

  const [isCreatingPrompt, setIsCreatingPrompt] = useState(false)
  const [isCreatingUserProfile, setIsCreatingUserProfile] = useState(false)
  const [isBulkImportingUserProfiles, setIsBulkImportingUserProfiles] =
    useState(false)
  const [isCreatingPreset, setIsCreatingPreset] = useState(false)
  const [isCreatingFile, setIsCreatingFile] = useState(false)
  const [isCreatingCollection, setIsCreatingCollection] = useState(false)
  const [isCreatingAssistant, setIsCreatingAssistant] = useState(false)
  const [isCreatingTool, setIsCreatingTool] = useState(false)
  const [isCreatingModel, setIsCreatingModel] = useState(false)
  const [isCreatingCustomKnowledge, setIsCreatingCustomKnowledge] =
    useState(false)

  const handleCreateFolder = async () => {
    if (!profile) return
    if (!selectedWorkspace) return

    const createdFolder = await createFolder({
      user_id: profile.user_id,
      workspace_id: selectedWorkspace.id,
      name: "New Folder",
      description: "",
      type: contentType
    })
    setFolders([...folders, createdFolder])
  }

  const getCreateFunction = () => {
    switch (contentType) {
      case "chats":
        return async () => {
          handleNewChat()
        }

      case "presets":
        return async () => {
          setIsCreatingPreset(true)
        }

      case "prompts":
        return async () => {
          setIsCreatingPrompt(true)
        }

      case "profiles":
        return async () => {
          setIsCreatingUserProfile(true)
        }

      case "files":
        return async () => {
          setIsCreatingFile(true)
        }

      case "collections":
        return async () => {
          setIsCreatingCollection(true)
        }

      case "assistants":
        return async () => {
          setIsCreatingAssistant(true)
        }

      case "tools":
        return async () => {
          setIsCreatingTool(true)
        }

      case "models":
        return async () => {
          setIsCreatingModel(true)
        }

      case "customKnowledgeBase":
        return async () => {
          setIsCreatingCustomKnowledge(true)
        }

      default:
        break
    }
  }

  const getBulkImportFunction = () => {
    setIsBulkImportingUserProfiles(true)
  }

  return (
    <div className="flex w-full space-x-2">
      {contentType !== "files" && contentType !== "assistants" && (
        <Button
          className="flex h-[36px] grow"
          onClick={getCreateFunction()}
          // disabled={contentType === "assistants" && role?.name !== "admin"}
          style={successButtonStyle}
        >
          <IconPlus className="mr-1" size={20} />
          New{" "}
          {contentType.charAt(0).toUpperCase() +
            contentType.slice(1, contentType.length - 1)}
        </Button>
      )}
      {((contentType === "files" &&
        deleteFileIds &&
        deleteFileIds?.length === 0) ||
        contentType === "assistants") && (
        <Button
          className="flex h-[36px] grow"
          onClick={getCreateFunction()}
          disabled={contentType === "assistants" && role?.name !== "admin"}
          style={successButtonStyle}
        >
          <IconPlus className="mr-1" size={20} />
          New{" "}
          {contentType.charAt(0).toUpperCase() +
            contentType.slice(1, contentType.length - 1)}
        </Button>
      )}

      {contentType === "files" &&
        deleteFileIds &&
        deleteFileIds?.length > 0 && (
          <Button
            className="flex h-[36px] grow"
            onClick={() => setShowDialog(true)}
            style={successButtonStyle}
          >
            <IconTrash className="mr-1" size={20} />
            Delete Files
          </Button>
        )}

      {hasData && contentType !== "profiles" ? (
        <Button
          className="size-[36px] p-1"
          onClick={handleCreateFolder}
          disabled={contentType === "assistants"}
          style={successButtonStyle}
        >
          <IconFolderPlus size={20} />
        </Button>
      ) : (
        role?.name === "admin" &&
        contentType === "profiles" && (
          <Button
            className="size-[36px] p-1"
            onClick={getBulkImportFunction}
            // disabled={contentType === "assistants"}
            style={successButtonStyle}
          >
            <IconFileImport size={20} />
          </Button>
        )
      )}

      {isCreatingPrompt && (
        <CreatePrompt
          isOpen={isCreatingPrompt}
          onOpenChange={setIsCreatingPrompt}
        />
      )}

      {isCreatingUserProfile && (
        <CreateUserProfile
          isOpen={isCreatingUserProfile}
          onOpenChange={setIsCreatingUserProfile}
        />
      )}

      {isBulkImportingUserProfiles && (
        <BulkImportUserProfiles
          isOpen={isBulkImportingUserProfiles}
          onOpenChange={setIsBulkImportingUserProfiles}
        />
      )}

      {isCreatingPreset && (
        <CreatePreset
          isOpen={isCreatingPreset}
          onOpenChange={setIsCreatingPreset}
        />
      )}

      {isCreatingFile && (
        <CreateFile isOpen={isCreatingFile} onOpenChange={setIsCreatingFile} />
      )}

      {isCreatingCollection && (
        <CreateCollection
          isOpen={isCreatingCollection}
          onOpenChange={setIsCreatingCollection}
        />
      )}

      {isCreatingAssistant && (
        <CreateAssistant
          isOpen={isCreatingAssistant}
          onOpenChange={setIsCreatingAssistant}
        />
      )}

      {isCreatingTool && (
        <CreateTool isOpen={isCreatingTool} onOpenChange={setIsCreatingTool} />
      )}

      {isCreatingModel && (
        <CreateModel
          isOpen={isCreatingModel}
          onOpenChange={setIsCreatingModel}
        />
      )}

      {isCreatingCustomKnowledge && <CreateCustomKnowledgeBase />}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent style={sidebarStyle}>
          <DialogHeader>
            <DialogTitle>Delete {contentType.slice(0, -1)}</DialogTitle>

            <DialogDescription>
              Are you sure you want to delete selected files?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>

            <Button
              variant="destructive"
              onClick={() => {
                handleDeleteFiles && handleDeleteFiles()
                setShowDialog(false)
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
