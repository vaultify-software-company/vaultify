"use client"

import { Sidebar } from "@/components/sidebar/sidebar"
import { SidebarSwitcher } from "@/components/sidebar/sidebar-switcher"
import { Button } from "@/components/ui/button"
import { Tabs } from "@/components/ui/tabs"
import useHotkey from "@/lib/hooks/use-hotkey"
import { cn } from "@/lib/utils"
import { ContentType } from "@/types"
import { IconChevronCompactRight } from "@tabler/icons-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { FC, useRef, useState } from "react"
import { useSelectFileHandler } from "../chat/chat-hooks/use-select-file-handler"
import { CommandK } from "../utility/command-k"

export const SIDEBAR_WIDTH = 350
export const MIN_WIDTH = 350 // Minimum width of the component
export const MAX_WIDTH = 800 // Maximum width of the component
interface DashboardProps {
  children: React.ReactNode
}

export const Dashboard: FC<DashboardProps> = ({ children }) => {
  useHotkey("s", () => setShowSidebar(prevState => !prevState))

  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabValue = searchParams.get("tab") || "chats"
  const { handleSelectDeviceFile } = useSelectFileHandler()
  const [selectedWidth, setSelectedWidth] = useState(SIDEBAR_WIDTH)
  const resizableRef = useRef<HTMLDivElement | null>(null)
  const [isSidebarDragging, setIsSidebarDragging] = useState(false)

  const [contentType, setContentType] = useState<ContentType>(
    tabValue as ContentType
  )
  const [showSidebar, setShowSidebar] = useState(
    localStorage.getItem("showSidebar") === "true"
  )
  const [isDragging, setIsDragging] = useState(false)

  const onFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()

    const files = event.dataTransfer.files
    const file = files[0]

    handleSelectDeviceFile(file)

    setIsDragging(false)
  }

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const routeToMatcher = () => {
    router.push(`./matcher`)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
  }

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  // const handleToggleSidebar = () => {
  //   setShowSidebar(prevState => !prevState)
  //   localStorage.setItem("showSidebar", String(!showSidebar))
  // }
  const handleToggleSidebar = () => {
    setShowSidebar(prevState => {
      const isSidebarClosing = prevState // check if sidebar is currently open
      if (isSidebarClosing) {
        setSelectedWidth(MIN_WIDTH) // Reset width when sidebar is closed
      }
      localStorage.setItem("showSidebar", String(!prevState))
      return !prevState
    })
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsSidebarDragging(true)

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  const handleMouseMove = (e: MouseEvent) => {
    // debugger
    if (resizableRef.current && showSidebar) {
      const newWidth = Math.min(
        Math.max(
          e.clientX - resizableRef.current.getBoundingClientRect().left,
          MIN_WIDTH
        ),
        MAX_WIDTH
      )
      setSelectedWidth(newWidth)
    }
  }

  const handleMouseUp = () => {
    setIsSidebarDragging(false)
    document.removeEventListener("mousemove", handleMouseMove)
    document.removeEventListener("mouseup", handleMouseUp)
  }

  return (
    <div className="flex size-full">
      <CommandK />

      <div
        className={cn(
          "duration-200 dark:border-none dark:bg-[#004267]  hover:cursor-col-resize relative z-10" +
            (showSidebar ? "border-r-2" : "")
        )}
        style={{
          minWidth: showSidebar ? `${selectedWidth}px` : "0px",
          maxWidth: showSidebar ? `${selectedWidth}px` : "0px",
          width: showSidebar ? `${selectedWidth}px` : "0px"
        }}
        ref={resizableRef}
        onMouseDown={handleMouseDown}
      >
        {showSidebar && (
          <Tabs
            className="flex h-full"
            value={contentType}
            onValueChange={tabValue => {
              setContentType(tabValue as ContentType)
              router.replace(`${pathname}?tab=${tabValue}`)
            }}
          >
            <SidebarSwitcher
              onContentTypeChange={
                contentType === "matcher" ? routeToMatcher : setContentType
              }
            />

            {contentType !== "matcher" && (
              <Sidebar contentType={contentType} showSidebar={showSidebar} />
            )}
          </Tabs>
        )}
      </div>

      <div
        className="bg-muted/50 relative flex w-screen min-w-[90%] grow flex-col sm:min-w-fit"
        onDrop={onFileDrop}
        onDragOver={onDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
      >
        {isDragging ? (
          <div className="flex h-full items-center justify-center bg-black/50 text-2xl text-white">
            drop file here
          </div>
        ) : (
          children
        )}

        {contentType !== "matcher" && (
          <Button
            className={cn(
              "absolute left-[4px] top-[50%] z-10 size-[32px] cursor-pointer"
            )}
            style={{
              // marginLeft: showSidebar ? `${SIDEBAR_WIDTH}px` : "0px",
              transform: showSidebar ? "rotate(180deg)" : "rotate(0deg)"
            }}
            variant="ghost"
            size="icon"
            onClick={handleToggleSidebar}
          >
            <IconChevronCompactRight size={24} />
          </Button>
        )}
      </div>
    </div>
  )
}
