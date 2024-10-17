import { ContentType } from "@/types"
import {
  IconActivity,
  IconAdjustmentsHorizontal,
  IconBolt,
  IconBooks,
  IconFile,
  IconMessage,
  IconPencil,
  IconRobotFace,
  IconSparkles,
  IconUser
} from "@tabler/icons-react"
import { FC, useContext } from "react"
import { TabsList } from "../ui/tabs"
import { WithTooltip } from "../ui/with-tooltip"
import { ProfileSettings } from "../utility/profile-settings"
import { SidebarSwitchItem } from "./sidebar-switch-item"
import { ChatbotUIContext } from "@/context/context"
import { sidebarStyle } from "../ui/styles"

export const SIDEBAR_ICON_SIZE = 28

interface SidebarSwitcherProps {
  onContentTypeChange: (contentType: ContentType) => void
}

export const SidebarSwitcher: FC<SidebarSwitcherProps> = ({
  onContentTypeChange
}) => {
  const { role } = useContext(ChatbotUIContext)

  return (
    <div
      onMouseDown={e => e.stopPropagation()}
      className="flex flex-col justify-between border-r-2 pb-5 dark:border-black"
    >
      <TabsList className="bg-background grid h-[440px] grid-rows-7">
        <SidebarSwitchItem
          icon={<IconMessage size={SIDEBAR_ICON_SIZE} />}
          contentType="chats"
          onContentTypeChange={onContentTypeChange}
        />

        <>
          {/* <SidebarSwitchItem
            icon={<IconAdjustmentsHorizontal size={SIDEBAR_ICON_SIZE} />}
            contentType="presets"
            onContentTypeChange={onContentTypeChange}
          /> */}
          {role && role.name === "admin" && (
            <SidebarSwitchItem
              icon={<IconPencil size={SIDEBAR_ICON_SIZE} />}
              contentType="prompts"
              onContentTypeChange={onContentTypeChange}
            />
          )}
          {role && role.name === "admin" && (
            <SidebarSwitchItem
              icon={<IconUser size={SIDEBAR_ICON_SIZE} />}
              contentType="profiles"
              onContentTypeChange={onContentTypeChange}
            />
          )}
          {/* <SidebarSwitchItem
            icon={<IconSparkles size={SIDEBAR_ICON_SIZE} />}
            contentType="models"
            onContentTypeChange={onContentTypeChange}
          /> */}

          {role && role.name === "admin" && (
            <SidebarSwitchItem
              icon={<IconFile size={SIDEBAR_ICON_SIZE} />}
              contentType="files"
              onContentTypeChange={onContentTypeChange}
            />
          )}

          {role && role.name === "admin" && (
            <SidebarSwitchItem
              icon={<IconBooks size={SIDEBAR_ICON_SIZE} />}
              contentType="collections"
              onContentTypeChange={onContentTypeChange}
            />
          )}
          {
            <SidebarSwitchItem
              icon={<IconRobotFace size={SIDEBAR_ICON_SIZE} />}
              contentType="assistants"
              onContentTypeChange={onContentTypeChange}
            />
          }
          {role && role.name === "admin" && (
            <SidebarSwitchItem
              icon={<IconActivity size={SIDEBAR_ICON_SIZE} />}
              contentType="matcher"
              onContentTypeChange={onContentTypeChange}
            />
          )}
          {role && role.name === "admin" && (
            <SidebarSwitchItem
              icon={<IconBolt size={SIDEBAR_ICON_SIZE} />}
              contentType="customKnowledgeBase"
              onContentTypeChange={onContentTypeChange}
            />
          )}

          {/* <SidebarSwitchItem
            icon={<IconBolt size={SIDEBAR_ICON_SIZE} />}
            contentType="tools"
            onContentTypeChange={onContentTypeChange}
          /> */}
        </>
      </TabsList>

      <div className="flex flex-col items-center space-y-4">
        <WithTooltip
          display={<div>Profile Settings</div>}
          trigger={<ProfileSettings />}
        />
      </div>
    </div>
  )
}
