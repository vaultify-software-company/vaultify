import { FileIcon } from "@/components/ui/file-icon"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FILE_DESCRIPTION_MAX, FILE_NAME_MAX } from "@/db/limits"
import { getFileFromStorage } from "@/db/storage/files"
import { Tables } from "@/supabase/types"
import { FC, useEffect, useState } from "react"
import { SidebarItem } from "../all/sidebar-display-item"
import { Switch } from "antd"
import { toast } from "sonner"

interface FileItemProps {
  file: Tables<"files">
  setDeleteFiles?: (fileId: string) => void
  deleteFilesIds?: string[]
}

export const FileItem: FC<FileItemProps> = ({
  file,
  setDeleteFiles,
  deleteFilesIds
}) => {
  const [title, setTitle] = useState(file.title)
  const [name, setName] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [description, setDescription] = useState(file.description)
  const [isActive, setIsActive] = useState(file.is_active)

  const handleFileView = async () => {
    const { data, error } = await getFileFromStorage(file.file_path)
    if (error) {
      toast.error(error.message)
    } else {
      window.open(data.signedUrl, "_blank")
    }
  }

  const toggleIsActive = () => {
    setIsActive(!isActive)
  }

  useEffect(() => {
    const validFilename = file?.title
      ?.replace(/[^a-z0-9.]/gi, "_")
      .toLowerCase()
    const extension = file.name.split(".").pop()
    const fileName = validFilename + "." + extension
    setName(fileName)
  }, [file.name, file.title])

  return (
    <SidebarItem
      item={file}
      isTyping={isTyping}
      contentType="files"
      icon={<FileIcon type={file.type} size={30} />}
      updateState={{
        name,
        title,
        description,
        is_active: isActive
      }}
      renderInputs={() => (
        <>
          <div
            className="cursor-pointer underline hover:opacity-50"
            onClick={handleFileView}
          >
            View {file.title}
          </div>

          <div className="flex flex-col justify-between">
            <div>{file.type}</div>
            <div>{formatFileSize(file.size)}</div>
            <div>{file.tokens.toLocaleString()} tokens</div>
          </div>

          <div className="space-y-1">
            <Label>Name</Label>
            <Input
              placeholder="File name..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={FILE_NAME_MAX}
            />
          </div>

          <div className="space-y-1">
            <Label>Description</Label>
            <Input
              placeholder="File description..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={FILE_DESCRIPTION_MAX} // Added maxLength for description
            />
          </div>

          <div className="flex items-center space-x-2">
            <Label>Active</Label>
            <Switch checked={isActive} onChange={toggleIsActive} />
          </div>
        </>
      )}
      setDeleteFiles={setDeleteFiles}
      deleteFilesIds={deleteFilesIds}
    />
  )
}

export const formatFileSize = (sizeInBytes: number): string => {
  let size = sizeInBytes
  let unit = "bytes"

  if (size >= 1024) {
    size /= 1024
    unit = "KB"
  }

  if (size >= 1024) {
    size /= 1024
    unit = "MB"
  }

  if (size >= 1024) {
    size /= 1024
    unit = "GB"
  }

  return `${size.toFixed(2)} ${unit}`
}
