import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChatbotUIContext } from "@/context/context"
import { FILE_DESCRIPTION_MAX, FILE_NAME_MAX } from "@/db/limits"
import { TablesInsert } from "@/supabase/types"
import { FC, useContext, useState } from "react"
import { Anchor, Button } from "antd"
import { successButtonStyle } from "@/components/ui/styles"
import styles from "./BulkImportUserProfiles.module.css" // Example CSS module import
import { SidebarBulkImportItem } from "../all/sidebar-bulk-import"
import { toast } from "sonner"

interface BulkImportUserProfilesProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

const ACCEPTED_FILE_TYPES = ["text/csv"].join(",")

export const BulkImportUserProfiles: FC<BulkImportUserProfilesProps> = ({
  isOpen,
  onOpenChange
}) => {
  const { profile, selectedWorkspace } = useContext(ChatbotUIContext)

  const [isTyping, setIsTyping] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [importButton, setImportButton] = useState(false)

  const handleSelectedFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return

    const file = e.target.files[0]

    if (!file) return

    setSelectedFile(file)
    setImportButton(true)

    // Use FileReader to read file content
    const reader = new FileReader()

    reader.onload = event => {
      if (event.target) {
        const content = event.target.result as string

        setFileContent(content)
        setImportButton(true)
      }
    }

    reader.onerror = event => {
      console.error("File reading error:", event.target?.error)
      toast.error(`File reading error: ${event.target?.error}`)
      setImportButton(false)
    }

    // Start reading the file as text
    reader.readAsText(file)
  }

  if (!profile) return null
  if (!selectedWorkspace) return null

  // Generate a timestamp to append to the download URL
  const downloadUrl = `/file.csv?timestamp=${Date.now()}`

  return (
    <SidebarBulkImportItem
      importButtonStatus={importButton}
      createState={{ selectedFile, fileContent }} // Include fileContent here
      isOpen={isOpen}
      isTyping={isTyping}
      onOpenChange={onOpenChange}
      renderInputs={() => (
        <>
          <div className="space-y-1">
            <Label>Download template</Label>

            <Anchor className="space-y-1">
              {/* Example of using CSS module for custom styles */}
              <Button
                className={`flex items-center justify-center text-white`}
                style={successButtonStyle}
              >
                <Anchor.Link href={downloadUrl} title="Download" />
              </Button>
            </Anchor>
          </div>

          <div className="space-y-1">
            <Label>Import file</Label>
            <Input
              type="file"
              onChange={handleSelectedFile}
              accept={ACCEPTED_FILE_TYPES}
            />
          </div>
        </>
      )}
    />
  )
}
