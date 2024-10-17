import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet"
import {
  cancelButtonStyle,
  sidebarStyle,
  successButtonStyle
} from "@/components/ui/styles"
import { ChatbotUIContext } from "@/context/context"
import { createUser } from "@/db/admin"
import {
  getProfileByUserId,
  getProfilesByRoleId,
  updateProfileByOrganization
} from "@/db/profile"
import { getRoleByName } from "@/db/roles"
import { updateWorkspaceByOrganization } from "@/db/workspaces"
import { FC, useContext, useRef, useState } from "react"
import { toast } from "sonner"

interface SidebarBulkImportProps {
  isOpen: boolean
  isTyping: boolean
  onOpenChange: (isOpen: boolean) => void
  renderInputs: () => JSX.Element
  createState: any
  importButtonStatus: boolean
}

export const SidebarBulkImportItem: FC<SidebarBulkImportProps> = ({
  isOpen,
  onOpenChange,
  renderInputs,
  createState,
  isTyping,
  importButtonStatus
}) => {
  const { organization, profile, setProfiles } = useContext(ChatbotUIContext)

  const buttonRef = useRef<HTMLButtonElement>(null)

  const [importing, setImporting] = useState(false)

  const [isAlreadyImported, setIsAlreadyImported] = useState<
    { email: string }[]
  >([])

  const [isInvalidEmails, setIsInvalidEmails] = useState<{ email: string }[]>(
    []
  )

  let invalidEmails: { email: string }[] = []

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Function to validate and parse the CSV content
  const parseCSVContent = (
    content: string
  ): { name: string; email: string }[] => {
    const lines = content.trim().split("\n")

    // Ensure there is a header line
    if (lines.length < 2)
      throw new Error("Invalid CSV content: Less than 2 lines")

    // Check header line format
    const header = lines[0].trim().toLowerCase()
    if (header !== "name,email")
      throw new Error("Invalid CSV content: Incorrect header format")

    const result = []

    // Parse each data line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      const parts = line.split(",")

      // Each line should have exactly two parts separated by a comma
      if (parts.length !== 2)
        throw new Error(
          `Invalid CSV content: Incorrect format at line ${i + 1}`
        )

      const name = parts[0].trim()
      const email = parts[1].trim()

      // Validate name format
      if (!name.length)
        throw new Error(`Invalid CSV content: Name is empty at line ${i + 1}`)

      // Validate email format
      if (!isValidEmail(email)) {
        invalidEmails.push({ email })
        continue
      }

      result.push({ name, email })
    }

    return result
  }

  // Function to transform the parsed data into the desired format
  const transformData = (parsedData: { email: string; name: string }[]) => {
    return parsedData.map(item => ({
      email: item.email,
      password: "Vellum@123",
      user_metadata: { name: item.name, password: "Vellum@123" }
    }))
  }

  const handleCreate = async () => {
    try {
      setImporting(true)
      const userRole = await getRoleByName("user")
      if (!userRole) return

      let totalImported = 0

      let alreadyImported: { email: string }[] = []

      if (!createState?.fileContent) {
        toast.error("File importing failed. Check your file format")
        return
      }

      const transformedData = transformData(
        parseCSVContent(createState.fileContent)
      )

      await Promise.all(
        transformedData.map(async user => {
          const { data, error } = await createUser(user)

          if (error) {
            alreadyImported.push({ email: user?.email })
            return
          }

          const newUser = data?.user
          if (!newUser) return

          totalImported++

          const newUserProfile = await getProfileByUserId(newUser.id)

          // Uncomment and complete these lines if needed
          await updateProfileByOrganization(
            newUser.id,
            userRole.id,
            newUserProfile,
            organization!,
            user.user_metadata.name,
            false
          )
          await updateWorkspaceByOrganization(newUser.id, organization!)
        })
      )

      toast.success(`Total users imported: ${totalImported}`)

      const allProfiles = await getProfilesByRoleId(userRole?.id)

      const filteredProfiles = allProfiles.filter(
        p => p?.organization_id === profile?.organization_id
      )

      setImporting(false)
      setProfiles(filteredProfiles)
      setIsAlreadyImported(alreadyImported)
      setIsInvalidEmails(invalidEmails)
    } catch (error) {
      console.error(error)
      toast.error("Error occurred importing users")
      setImporting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isTyping && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      buttonRef.current?.click()
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        className="flex min-w-[450px] flex-col justify-between overflow-auto "
        side="left"
        onKeyDown={handleKeyDown}
        style={sidebarStyle}
      >
        <div className="grow overflow-auto">
          <SheetHeader>
            <SheetTitle className="text-2xl font-bold">
              Import Users{" "}
            </SheetTitle>
          </SheetHeader>

          <div className="mt-4 space-y-3">{renderInputs()}</div>

          <div className="mt-4 flex grow justify-start space-y-3">
            {isAlreadyImported.length > 0 && (
              <div className="flex flex-col">
                <h2 className="text-lg font-bold">Already Imported Users</h2>
                <ul>
                  {isAlreadyImported.map((item, index) => {
                    return (
                      <li key={index}>
                        {index + 1}: {item.email}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-4 flex grow justify-start space-y-3">
            {isInvalidEmails.length > 0 && (
              <div className="flex flex-col">
                <h2 className="text-lg font-bold">Invalid Emails</h2>
                <ul>
                  {isInvalidEmails.map((item, index) => {
                    return (
                      <li key={index}>
                        {index + 1}: {item.email}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>

        <SheetFooter className="mt-2 flex justify-between">
          <div className="flex grow justify-end space-x-2">
            <Button
              disabled={importing}
              variant="outline"
              onClick={() => onOpenChange(false)}
              style={cancelButtonStyle}
            >
              Cancel
            </Button>

            <Button
              disabled={importing || !importButtonStatus}
              ref={buttonRef}
              onClick={handleCreate}
              style={successButtonStyle}
            >
              {importing ? "Importing..." : "Import"}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
