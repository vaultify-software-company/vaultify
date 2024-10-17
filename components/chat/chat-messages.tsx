import { useChatHandler } from "@/components/chat/chat-hooks/use-chat-handler"
import { ChatbotUIContext } from "@/context/context"
import { Tables } from "@/supabase/types"
import { FC, useContext, useState } from "react"
import { Message } from "../messages/message"

interface ChatMessagesProps {}

export const ChatMessages: FC<ChatMessagesProps> = ({}) => {
  const { chatMessages, chatFileItems } = useContext(ChatbotUIContext)
  const { handleSendEdit } = useChatHandler()
  const [editingMessage, setEditingMessage] = useState<Tables<"messages">>()

  const sortedMessages = chatMessages.sort(
    (a, b) => a.message.sequence_number - b.message.sequence_number
  )

  return sortedMessages.map((chatMessage, index, array) => {
    const messageFileItems = chatFileItems.filter(chatFileItem =>
      chatMessage.fileItems.includes(chatFileItem.id)
    )

    return (
      <Message
        key={chatMessage.message.sequence_number}
        message={chatMessage.message}
        fileItems={messageFileItems}
        isEditing={editingMessage?.id === chatMessage.message.id}
        isLast={index === array.length - 1}
        onStartEdit={setEditingMessage}
        onCancelEdit={() => setEditingMessage(undefined)}
        onSubmitEdit={handleSendEdit}
      />
    )
  })
}
