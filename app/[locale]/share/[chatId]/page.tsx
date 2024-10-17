"use client"
import Loading from "@/app/[locale]/loading"
import { useChatHandler } from "@/components/chat/chat-hooks/use-chat-handler"
import useHotkey from "@/lib/hooks/use-hotkey"
import { useParams } from "next/navigation"
import { FC, useEffect, useState } from "react"
import { ChatHelp } from "@/components/chat/chat-help"
import { useScroll } from "@/components/chat/chat-hooks/use-scroll"
import { ChatScrollButtons } from "@/components/chat/chat-scroll-buttons"
import { ChatSecondaryButtons } from "@/components/chat/chat-secondary-buttons"
import { Message } from "@/components/messages/message"
import { getSharedChats } from "@/db/chats"
interface ChatUIProps {}

const ChatUI: FC<ChatUIProps> = ({}) => {
  useHotkey("o", () => handleNewChat())
  const params = useParams()

  const paramValue = params.chatId

  // console.log({paramValue})// Replace 'paramName' with your query param name

  const [messages, setMessages] = useState<any[]>([])
  const [savedChat, setSavedChat] = useState<any>(null)

  const { handleNewChat, handleFocusChatInput } = useChatHandler()

  const {
    messagesStartRef,
    messagesEndRef,
    handleScroll,
    scrollToBottom,
    setIsAtBottom,
    isAtTop,
    isAtBottom,
    isOverflowing,
    scrollToTop
  } = useScroll()

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      await fetchMessages()

      scrollToBottom()
      setIsAtBottom(true)
    }

    fetchData().then(() => {
      handleFocusChatInput()
      setLoading(false)
    })
  }, [])

  const fetchMessages = async () => {
    const fetchedMessages = await getSharedChats(paramValue as string)
    console.log(fetchedMessages)
    const msgs = JSON.parse(fetchedMessages.messages)
    msgs.sort((a: any, b: any) => a.sequence_number - b.sequence_number) // Ascending order
    for (const msg of msgs) {
      delete msg.chunks
    }
    console.log(msgs)
    setMessages(msgs)
    setSavedChat(fetchedMessages)
  }

  if (loading) {
    return <Loading />
  }

  return (
    <div className="relative flex h-full flex-col items-center">
      <div className="absolute left-4 top-2.5 flex justify-center">
        <ChatScrollButtons
          isAtTop={isAtTop}
          isAtBottom={isAtBottom}
          isOverflowing={isOverflowing}
          scrollToTop={scrollToTop}
          scrollToBottom={scrollToBottom}
        />
      </div>

      <div className="absolute right-4 top-1 flex h-[40px] items-center space-x-2">
        <ChatSecondaryButtons />
      </div>

      <div className="bg-secondary dark:border-muted flex max-h-[50px] min-h-[50px] w-full items-center justify-center border-b-2 font-bold">
        <div className="max-w-[200px] truncate p-5 sm:max-w-[400px] md:max-w-[500px] lg:max-w-[600px] xl:max-w-[700px]">
          {savedChat?.chat_id
            ? `Chat id: ${savedChat?.chat_id}`
            : `Chat id: New chat id`}
          <br />
          {savedChat?.chat_id
            ? `Chat name: ${savedChat?.chat_name}`
            : `Chat name: New chat name`}
        </div>
      </div>

      <div
        className="flex size-full flex-col overflow-auto border-b border-[#000000]"
        onScroll={handleScroll}
      >
        <div style={{ width: "100%" }} ref={messagesStartRef} />

        {messages.map((message, index) => (
          <Message
            key={message.sequence_number}
            message={message}
            fileItems={[]}
            isEditing={false}
            isLast={index === messages.length - 1}
            onStartEdit={() => {}}
            onCancelEdit={() => {}}
            onSubmitEdit={() => {}}
          />
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* <div className="relative w-full min-w-[300px] items-end px-2 pb-3 pt-0 sm:w-[600px] sm:pb-8 sm:pt-5 md:w-[700px] lg:w-[700px] xl:w-[800px]">
        <ChatInput />
      </div> */}

      <div className="absolute bottom-2 right-2 hidden md:block lg:bottom-4 lg:right-4">
        <ChatHelp />
      </div>
    </div>
  )
}
export default ChatUI
