import { ChatbotUIContext } from "@/context/context"
import { Tables } from "@/supabase/types"
import { ContentType } from "@/types"
import { FC, useContext } from "react"
import { TabsContent } from "../ui/tabs"
import { SidebarContent } from "./sidebar-content"
import { sidebarStyle } from "../ui/styles"
import { Brand } from "../ui/brand"
import { LoginSVG } from "../icons/login-svg"

interface SidebarProps {
  contentType: ContentType
  showSidebar: boolean
}

export const Sidebar: FC<SidebarProps> = ({ contentType, showSidebar }) => {
  const {
    folders,
    profiles,
    chats,
    presets,
    prompts,
    files,
    collections,
    assistants,
    tools,
    models
  } = useContext(ChatbotUIContext)

  // Filter folders by type
  const chatFolders = folders?.filter(folder => folder.type === "chats") ?? []
  // const userProfileFolders =
  //   folders?.filter(folder => folder.type === "profiles") ?? []
  const presetFolders =
    folders?.filter(folder => folder.type === "presets") ?? []
  const promptFolders =
    folders?.filter(folder => folder.type === "prompts") ?? []
  const filesFolders = folders?.filter(folder => folder.type === "files") ?? []
  const collectionFolders =
    folders?.filter(folder => folder.type === "collections") ?? []
  const assistantFolders =
    folders?.filter(folder => folder.type === "assistants") ?? []
  const toolFolders = folders?.filter(folder => folder.type === "tools") ?? []
  const modelFolders = folders?.filter(folder => folder.type === "models") ?? []
  const renderSidebarContent = (
    contentType: ContentType,
    data: any[],
    folders: Tables<"folders">[] = [] // Default folders to an empty array
  ) => {
    return (
      <SidebarContent contentType={contentType} data={data} folders={folders} />
    )
  }

  return (
    <TabsContent
      className="relative z-50 m-0 w-full gap-y-2 overflow-hidden"
      value={contentType}
    >
      <div className="relative z-50 flex h-full flex-col p-3">
        <div style={{ margin: "auto" }}>
          <Brand theme="dark" />
        </div>

        {(() => {
          switch (contentType) {
            case "chats":
              return renderSidebarContent("chats", chats, chatFolders)

            case "presets":
              return renderSidebarContent("presets", presets, presetFolders)

            case "prompts":
              return renderSidebarContent("prompts", prompts, promptFolders)

            case "profiles":
              return renderSidebarContent("profiles", profiles, [])

            case "files":
              return renderSidebarContent("files", files, filesFolders)

            case "collections":
              return renderSidebarContent(
                "collections",
                collections,
                collectionFolders
              )

            case "assistants":
              return renderSidebarContent(
                "assistants",
                assistants,
                assistantFolders
              )

            case "tools":
              return renderSidebarContent("tools", tools, toolFolders)

            case "models":
              return renderSidebarContent("models", models, modelFolders)
            case "customKnowledgeBase":
              return renderSidebarContent("customKnowledgeBase", [], [])
            default:
              return null
          }
        })()}
      </div>
    </TabsContent>
  )
}
