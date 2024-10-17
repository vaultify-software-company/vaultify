import { ACCEPTED_FILE_TYPES } from "@/components/chat/chat-hooks/use-select-file-handler"
import { SidebarCreateItem } from "@/components/sidebar/items/all/sidebar-create-item"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChatbotUIContext } from "@/context/context"
import { FILE_DESCRIPTION_MAX, FILE_NAME_MAX } from "@/db/limits"
import { TablesInsert } from "@/supabase/types"
import { FC, useContext, useState } from "react"

interface CreateFileProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export const CreateFile: FC<CreateFileProps> = ({ isOpen, onOpenChange }) => {
  const { profile, selectedWorkspace } = useContext(ChatbotUIContext)

  const [isTyping, setIsTyping] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [fileMetas, setFileMetas] = useState<
    { name: string; description: string }[]
  >([])

  const handleSelectedFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return

    const selectedFiles = Array.from(e.target.files)
    const metaData = selectedFiles.map(file => ({
      name: file.name.split(".").slice(0, -1).join("."),
      description: file.name.split(".").slice(0, -1).join(".")
    }))

    setFiles(selectedFiles)
    setFileMetas(metaData)
  }

  const updateFileName = (index: number, newName: string) => {
    const updatedMetas = [...fileMetas]
    updatedMetas[index].name = newName
    setFileMetas(updatedMetas)
  }

  const updateFileDescription = (index: number, newDescription: string) => {
    const updatedMetas = [...fileMetas]
    updatedMetas[index].description = newDescription
    setFileMetas(updatedMetas)
  }

  if (!profile || !selectedWorkspace) return null

  return (
    <SidebarCreateItem
      contentType="files"
      createState={
        files.map((file, index) => ({
          file: file,
          user_id: profile.user_id,
          name: file.name,
          title: fileMetas[index]?.name || "",
          description: fileMetas[index]?.description || "",
          file_path: "",
          size: file.size,
          tokens: 0,
          type: file.type,
          status: "pending"
        })) as TablesInsert<"files">[]
      }
      isOpen={isOpen}
      isTyping={isTyping}
      onOpenChange={onOpenChange}
      renderInputs={() => (
        <>
          <div className="space-y-1">
            <Label>File</Label>
            <Input
              type="file"
              onChange={handleSelectedFile}
              accept={ACCEPTED_FILE_TYPES}
              multiple
            />
          </div>

          {fileMetas.map((meta, index) => (
            <div key={index}>
              <div className="space-y-1">
                <Label>File {index + 1} Name</Label>
                <Input
                  placeholder="File name..."
                  value={meta.name}
                  onChange={e => updateFileName(index, e.target.value)}
                  maxLength={FILE_NAME_MAX}
                />
              </div>
              <div className="space-y-1">
                <Label>File {index + 1} Description</Label>
                <Input
                  placeholder="File description..."
                  value={meta.description}
                  onChange={e => updateFileDescription(index, e.target.value)}
                />
              </div>
            </div>
          ))}
        </>
      )}
    />
  )
}
