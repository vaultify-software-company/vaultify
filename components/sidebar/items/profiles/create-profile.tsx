import { SidebarCreateItem } from "@/components/sidebar/items/all/sidebar-create-item"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChatbotUIContext } from "@/context/context"
import { PROMPT_NAME_MAX } from "@/db/limits"
import { FC, useContext, useState } from "react"

interface CreateUserProfileProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export const CreateUserProfile: FC<CreateUserProfileProps> = ({
  isOpen,
  onOpenChange
}) => {
  const { profile, selectedWorkspace } = useContext(ChatbotUIContext)
  const [isTyping, setIsTyping] = useState(false)
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  if (!profile) return null
  if (!selectedWorkspace) return null

  return (
    <SidebarCreateItem
      contentType="profiles"
      isOpen={isOpen}
      isTyping={isTyping}
      onOpenChange={onOpenChange}
      createState={{
        email,
        password,
        user_metadata: { name: displayName, password }
      }}
      renderInputs={() => (
        <>
          <div className="space-y-1">
            <Label>Name</Label>
            <Input
              placeholder="User name..."
              type="name"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              maxLength={PROMPT_NAME_MAX}
              onCompositionStart={() => setIsTyping(true)}
              onCompositionEnd={() => setIsTyping(false)}
            />
          </div>
          <div className="space-y-1">
            <Label>Email</Label>
            <Input
              placeholder="User email..."
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              maxLength={PROMPT_NAME_MAX}
              onCompositionStart={() => setIsTyping(true)}
              onCompositionEnd={() => setIsTyping(false)}
            />
          </div>
          <div className="space-y-1">
            <Label>Password</Label>
            <Input
              placeholder="User password..."
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              maxLength={PROMPT_NAME_MAX}
              onCompositionStart={() => setIsTyping(true)}
              onCompositionEnd={() => setIsTyping(false)}
            />
          </div>
        </>
      )}
    />
  )
}
