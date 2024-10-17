import { Tables } from "@/supabase/types"
import { ContentType, DataListType } from "@/types"
import { FC, useContext, useEffect, useState } from "react"
import { SidebarCreateButtons } from "./sidebar-create-buttons"
import { SidebarDataList } from "./sidebar-data-list"
import { SidebarSearch } from "./sidebar-search"
import { ChatbotUIContext } from "@/context/context"
import { CreateCustomKnowledgeBase } from "./items/knowlege-base/create-knowledge-base"
import { cancelButtonStyle, sidebarStyle } from "../ui/styles"
import { supabase } from "@/lib/supabase/browser-client"
import { toast } from "sonner"

interface SidebarContentProps {
  contentType: ContentType
  data: DataListType
  folders: Tables<"folders">[]
}

export const SidebarContent: FC<SidebarContentProps> = ({
  contentType,
  data,
  folders
}) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [fileIds, setFileIds] = useState<string[]>([])
  const { files, setFiles } = useContext(ChatbotUIContext)
  const setDeleteFiles = (fileId: string) => {
    if (fileIds.includes(fileId)) {
      setFileIds(fileIds.filter(id => id !== fileId))
    } else {
      setFileIds([...fileIds, fileId])
    }
  }

  // console.log({fileIds})

  const deleteSelectedFiles = async () => {
    if (fileIds.length === 0) return

    const file_paths = await supabase
      .from("files")
      .select("file_path")
      .in("id", fileIds)
    if (file_paths.error) {
      throw new Error(file_paths.error.message)
    }
    const filePath = file_paths.data.map((file: any) => file.file_path)
    let { error } = await supabase.storage.from("files").remove([...filePath])

    if (error) {
      toast.error("Failed to delete file!")
      return
    }
    const deleteRes = await supabase.from("files").delete().in("id", fileIds)

    if (deleteRes.error) {
      toast.error("Failed to delete file!")
      return
    }
    setFiles(files.filter((file: any) => !fileIds.includes(file.id)))
    setFileIds([])
    toast.success("Files deleted successfully")
  }

  useEffect(() => {
    setSearchTerm("")
  }, [contentType])

  const filteredData: any = data.filter(item =>
    item?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase())
  )

  return contentType === "customKnowledgeBase" ? (
    <div
      onMouseDown={e => e.stopPropagation()}
      className="absolute top-5  w-full pr-4"
    >
      <CreateCustomKnowledgeBase />
    </div>
  ) : (
    // Subtract 50px for the height of the workspace settings
    <div
      onMouseDown={e => e.stopPropagation()}
      className="z-90 relative flex max-h-[calc(100%-50px)] grow flex-col"
    >
      <div className="mt-2 flex items-center">
        <SidebarCreateButtons
          contentType={contentType}
          hasData={data.length > 0}
          deleteFileIds={fileIds}
          handleDeleteFiles={deleteSelectedFiles}
        />
      </div>
      <div className="mt-2">
        <SidebarSearch
          contentType={contentType}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
      </div>
      <SidebarDataList
        contentType={contentType}
        data={filteredData}
        folders={folders}
        setDeleteFiles={setDeleteFiles}
        deleteFilesIds={fileIds}
      />
    </div>
  )
}
