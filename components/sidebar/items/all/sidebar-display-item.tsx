import { cn } from "@/lib/utils"
import { ContentType } from "@/types"
import { FC, useEffect, useRef, useState } from "react"
import { SidebarUpdateItem } from "./sidebar-update-item"
import { getFileById } from "@/db/files"
import { Checkbox } from "@/components/ui/checkbox"
import { supabase } from "@/lib/supabase/browser-client"
import ShowFileStatus from "@/components/ui/file-status"
import { toast } from "sonner"

interface SidebarItemProps {
  item: any
  isTyping: boolean
  contentType: ContentType
  icon: React.ReactNode
  updateState: any
  renderInputs: (renderState: any) => JSX.Element
  setDeleteFiles?: (fileId: string) => void
  deleteFilesIds?: string[]
}

export const SidebarItem: FC<SidebarItemProps> = ({
  item,
  contentType,
  updateState,
  renderInputs,
  icon,
  isTyping,
  setDeleteFiles,
  deleteFilesIds
}) => {
  const itemRef = useRef<HTMLDivElement>(null)

  const [isHovering, setIsHovering] = useState(false)
  const [title, setTitle] = useState("")
  const [file, setFile] = useState<any | null>(null)
  const [status, setStatus] = useState<any | null>(null)

  const hasToasBeenShown = useRef(false)
  useEffect(() => {
    const fetchFile = async () => {
      if (contentType === "files") {
        const fileDetails = await getFileById(item.id)
        setTitle(fileDetails.title || "")
        setFile(fileDetails)
      }
    }

    fetchFile()
  }, [item.id, contentType])

  useEffect(() => {
    if (!file) return

    const channel = supabase
      .channel("files")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          filter: `id=eq.${file.id},status=eq.completed`
        },
        (payload: any) => {
          if (payload.new.status === "completed" && !hasToasBeenShown.current) {
            setStatus(payload.new.status)
            toast.success(`File "${file?.title}" is ready to use!`)
            hasToasBeenShown.current = true
            // setToastShown(true) // Update state to indicate toast has been shown
          } else if (
            payload.new.status === "failed" &&
            !hasToasBeenShown.current
          ) {
            setStatus(payload.new.status)
            toast.error(`File "${file?.title}" failed!`)
            hasToasBeenShown.current = true
          } else if (
            payload.new.status === "corrupted" &&
            !hasToasBeenShown.current
          ) {
            setStatus(payload.new.status)
            toast.error(`File "${file?.title}" is corrupted!`)
            hasToasBeenShown.current = true
          }
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [file]) // Include toastShown to track toast display

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      e.stopPropagation()
      itemRef.current?.click()
    }
  }

  return (
    <SidebarUpdateItem
      item={item}
      isTyping={isTyping}
      contentType={contentType}
      updateState={updateState}
      renderInputs={renderInputs}
    >
      <div
        ref={itemRef}
        className={cn(
          "hover:bg-accent flex w-full cursor-pointer items-center rounded p-2 hover:opacity-50 focus:outline-none "
        )}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        style={{ overflow: "scroll !important" }}
      >
        {contentType === "files" && (
          <Checkbox
            value={item.id}
            checked={deleteFilesIds?.includes(item?.id) || false}
            onClick={e => {
              e.stopPropagation()
              setDeleteFiles && setDeleteFiles(item.id)
            }}
          />
        )}
        {icon}
        <div
          className={`ml-3 flex-1 truncate text-sm font-semibold ${
            file && !file.is_active ? "text-gray-500" : ""
          }`}
        >
          {contentType === "files" ? title || "No title found" : item?.name}
        </div>
        <ShowFileStatus
          contentType={contentType}
          item={status ? { status } : item}
        />
      </div>
    </SidebarUpdateItem>
  )
}
