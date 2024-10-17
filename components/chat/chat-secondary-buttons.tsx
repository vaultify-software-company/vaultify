import { useChatHandler } from "@/components/chat/chat-hooks/use-chat-handler"
import { ChatbotUIContext } from "@/context/context"
import {
  IconInfoCircle,
  IconMessagePlus,
  IconMessageShare
} from "@tabler/icons-react"
import { FC, useContext, useState } from "react"
import { WithTooltip } from "../ui/with-tooltip"
import { createSharedChats } from "@/db/chats"
import { toast } from "sonner"
import { Input, Modal } from "antd"
interface ChatSecondaryButtonsProps {}

export const ChatSecondaryButtons: FC<ChatSecondaryButtonsProps> = ({}) => {
  const { selectedChat } = useContext(ChatbotUIContext)
  const { handleNewChat } = useChatHandler()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [baseUrl, setBaseUrl] = useState(
    process.env.NEXT_PUBLIC_SHARED_CHAT_URL
      ? `${process.env.NEXT_PUBLIC_SHARED_CHAT_URL}/share/`
      : ""
  )
  const [isShared, setIsShared] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const chatInfoContent = (
    <div>
      <div className="text-xl font-bold">Chat Info</div>

      <div className="mx-auto mt-2 max-w-xs space-y-2 sm:max-w-sm md:max-w-md lg:max-w-lg">
        <div>Model: {selectedChat?.model}</div>
        {/* <div>Prompt: {selectedChat?.prompt}</div> */}

        <div>Temperature: {selectedChat?.temperature}</div>
        <div>Context Length: {selectedChat?.context_length}</div>

        <div>
          Profile Context:{" "}
          {selectedChat?.include_profile_context ? "Enabled" : "Disabled"}
        </div>

        <div>Embeddings Provider: {selectedChat?.embeddings_provider}</div>
      </div>
    </div>
  )
  const copyUrl = async () => {
    await navigator.clipboard.writeText(baseUrl ? baseUrl : "")

    toast.success("Chat link copied to clipboard")
  }

  const createShareChatLink = async () => {
    setIsLoading(true)
    try {
      if (!selectedChat) {
        return
      }
      const sharedChat: any = await createSharedChats(selectedChat.id)
      console.log({ sharedChat })
      if (!sharedChat) {
        return
      }

      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/share/` + sharedChat?.id
      console.log({ url })

      setBaseUrl(url)

      setIsShared(true)
    } catch (error: any) {
      setIsModalOpen(false)
      console.error(error.message)
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {selectedChat && (
        <>
          <WithTooltip
            delayDuration={200}
            display={"Share Chat"}
            trigger={
              <div className="mt-1">
                <IconMessageShare
                  onClick={() => {
                    setIsModalOpen(true)
                    createShareChatLink()
                  }}
                  className="cursor-default hover:opacity-50"
                  size={24}
                  style={{ cursor: "pointer" }}
                />
              </div>
            }
          />
          <WithTooltip
            delayDuration={200}
            display={chatInfoContent}
            trigger={
              <div className="mt-1">
                <IconInfoCircle
                  className="cursor-default hover:opacity-50"
                  size={24}
                />
              </div>
            }
          />
          <WithTooltip
            delayDuration={200}
            display={<div>Start a new chat</div>}
            trigger={
              <div className="mt-1">
                <IconMessagePlus
                  className="cursor-pointer hover:opacity-50"
                  size={24}
                  onClick={handleNewChat}
                />
              </div>
            }
          />

          {process.env.NEXT_PUBLIC_BASE_URL && isModalOpen && !isLoading && (
            <Modal
              visible={isModalOpen}
              centered
              onCancel={() => {
                setIsModalOpen(false)
                setIsShared(false)
                setBaseUrl("")
              }}
              footer={null}
              style={{
                maxWidth: "800px"
              }}
              className="  rounded-md"
            >
              <div className="mb-2 text-xl font-bold dark:text-white">
                Chat Link
              </div>
              <div className="flex w-full gap-2">
                <Input
                  className="mt-2 bg-inherit p-1 hover:bg-inherit dark:text-white"
                  name="sharedLink"
                  readOnly
                  value={baseUrl}
                  placeholder=""
                />
                <button
                  className="mt-2 rounded-lg bg-[#0A324A] px-4 py-2 text-white hover:bg-slate-500 disabled:bg-slate-500 "
                  onClick={copyUrl}
                >
                  Copy
                </button>
              </div>
            </Modal>
          )}
        </>
      )}
    </>
  )
}
