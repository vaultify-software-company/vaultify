import { ChatbotUIContext } from "@/context/context"
import {
  IconBug,
  IconCheck,
  IconCopy,
  IconEdit,
  IconRepeat
} from "@tabler/icons-react"
import { FC, useContext, useEffect, useState } from "react"
import { WithTooltip } from "../ui/with-tooltip"
import { Modal } from "antd"
import { supabase } from "@/lib/supabase/browser-client"
import feedback from "../../public/feedback-questions.json"
import { TextareaAutosize } from "../ui/textarea-autosize"
import { Input } from "../ui/input"
import { toast } from "sonner"
import { getProfileByUserId } from "@/db/profile"

export const MESSAGE_ICON_SIZE = 18

interface ChatDetails {
  content?: string
  sharing?: string
  model?: string
  embeddings_provider?: string
  context_length?: number
  temperature?: number
  chunks?: any[]
  chatId?: string
  response?: string
  user_id?: string
  sequence_number?: number
}

interface MessageActionsProps {
  isAssistant: boolean
  isLast: boolean
  isEditing: boolean
  isHovering: boolean
  onCopy: () => void
  onEdit: () => void
  onRegenerate: () => void
  onDebug: () => any
}

export const MessageActions: FC<MessageActionsProps> = ({
  isAssistant,
  isLast,
  isEditing,
  isHovering,
  onCopy,
  onEdit,
  onRegenerate,
  onDebug
}) => {
  const { isGenerating } = useContext(ChatbotUIContext)

  const [showCheckmark, setShowCheckmark] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedFeedback, setSelectedFeedback] = useState("")
  const [feedbackMessage, setFeedbackMessage] = useState("")
  const [chatDetails, setChatDetails] = useState<ChatDetails | null>(null)
  const [name, setName] = useState("")

  const handleCopy = () => {
    onCopy()
    setShowCheckmark(true)
  }

  const handleFeedback = async () => {
    setIsModalOpen(true)
    const message = onDebug()

    if (!message) return
    const chat = await supabase
      .from("messages")
      .select("content")
      .eq("chat_id", message?.chat_id)
      .eq("user_id", message?.user_id)
      .eq("sequence_number", message?.sequence_number - 1)
      .eq("role", "user")
      .single()

    const formattedChunks: string[] = []
    const contents = JSON.parse(message?.chunks as string) as string[]
    contents.forEach((element: string, index: number) => {
      formattedChunks.push(element?.split("..")?.join("\n"))
    })

    setChatDetails({
      content: chat?.data?.content,
      sharing: message?.sharing,
      model: message?.model,
      embeddings_provider: message?.embeddings_provider,
      context_length: message?.context_length,
      temperature: message?.temperature,
      chunks: formattedChunks,
      chatId: message?.chat_id,
      response: message?.content,
      user_id: message?.user_id,
      sequence_number: message?.sequence_number
    })
  }

  const getUserDetails = async () => {
    const profile = await getProfileByUserId(chatDetails?.user_id!)
    setName(profile?.name!)
  }

  const submitFeedback = async () => {
    await getUserDetails()

    console.log({
      name: name,
      feedback_selection: selectedFeedback,
      user_comments: feedbackMessage,
      payload: JSON.stringify(chatDetails)
    })

    const { error } = await supabase.from("message_survey").insert({
      name: name,
      feedback_selection: selectedFeedback,
      user_comments: feedbackMessage,
      payload: JSON.stringify(chatDetails)
    })

    if (error) {
      console.error(error)
      toast.error("Error submitting feedback")
    }
    setFeedbackMessage("")
    setSelectedFeedback("")
    setIsModalOpen(false)
    toast.success("Feedback submitted successfully")

    // console.log({chatDetails})
  }

  useEffect(() => {
    if (showCheckmark) {
      const timer = setTimeout(() => {
        setShowCheckmark(false)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [showCheckmark])

  return (isLast && isGenerating) || isEditing ? null : (
    <div className="text-muted-foreground flex items-center space-x-2">
      {!isAssistant && isHovering && (
        <WithTooltip
          delayDuration={1000}
          side="bottom"
          display={<div>Edit</div>}
          trigger={
            <IconEdit
              className="cursor-pointer hover:opacity-50"
              size={MESSAGE_ICON_SIZE}
              onClick={onEdit}
            />
          }
        />
      )}

      {isAssistant && (
        <WithTooltip
          delayDuration={1000}
          side="bottom"
          display={<div>Feedback</div>}
          trigger={
            <button
              className="flex cursor-pointer items-center justify-center hover:opacity-50"
              onClick={handleFeedback} // Open the modal when the icon is clicked
            >
              <IconBug size={MESSAGE_ICON_SIZE} />
            </button>
          }
        />
      )}

      {(isHovering || isLast) && (
        <WithTooltip
          delayDuration={1000}
          side="bottom"
          display={<div>Copy</div>}
          trigger={
            showCheckmark ? (
              <IconCheck size={MESSAGE_ICON_SIZE} />
            ) : (
              <IconCopy
                className="cursor-pointer hover:opacity-50"
                size={MESSAGE_ICON_SIZE}
                onClick={handleCopy}
              />
            )
          }
        />
      )}

      {isLast && (
        <WithTooltip
          delayDuration={1000}
          side="bottom"
          display={<div>Regenerate</div>}
          trigger={
            <IconRepeat
              className="cursor-pointer hover:opacity-50"
              size={MESSAGE_ICON_SIZE}
              onClick={onRegenerate}
            />
          }
        />
      )}

      {isModalOpen && chatDetails && (
        <Modal
          visible={isModalOpen}
          centered
          onCancel={() => {
            setIsModalOpen(false)
            setSelectedFeedback("")
          }}
          footer={null}
          style={{
            maxWidth: "800px"
          }}
          className="  rounded-md"
        >
          {/* <div
            style={{
              backgroundColor: "#000 !important",
              color: "#fff !important"
            }}
          >
            <p>
              <strong>Content:</strong> {chatDetails.content}
            </p>
            <p>
              <strong>Sharing:</strong> {chatDetails.sharing}
            </p>
            <p>
              <strong>Model:</strong> {chatDetails.model}
            </p>
            <p>
              <strong>Embeddings Provider:</strong>{" "}
              {chatDetails.embeddings_provider}
            </p>
            <p>
              <strong>Context Length:</strong> {chatDetails.context_length}
            </p>
            <p>
              <strong>Temperature:</strong> {chatDetails.temperature}
            </p>
            <p>
              <strong>Chunks:</strong>
            </p>
            <ul>
              {chatDetails.chunks!.map((chunk, index) => (
                <div key={index}>
                  <br />
                  <li>
                    <strong>{index + 1}: </strong>
                    {chunk}
                  </li>
                  <br />
                </div>
              ))}
            </ul>

          </div> */}

          <div className="flex max-w-[900px] flex-wrap gap-2">
            {feedback.options.map((option, index) => (
              <>
                <div
                  className={`placeholder:text-muted-foreground border-input relative grid select-none items-center whitespace-nowrap  rounded-lg border  ${selectedFeedback === option ? "bg-[#004166] dark:bg-white" : "bg-background"} cursor-pointer px-3 py-1.5 font-sans text-xs `}
                  onClick={() => setSelectedFeedback(option)}
                >
                  <span
                    className={`${selectedFeedback === option ? "text-background" : "dark:text-white"}`}
                  >
                    {option}
                  </span>
                </div>
              </>
            ))}
            <Input
              className="mt-2 p-1 dark:text-white"
              name="email"
              value={feedbackMessage}
              placeholder="(Optional) Feel free to add specific details"
              onChange={e => setFeedbackMessage(e.target.value)}
            />
            {/* <Input
              type={"text"}
              className="mt-2 p-1 "
              placeholder="(Optional) Feel free to add specific details"
            /> */}
            <div className="flex w-full flex-row-reverse">
              <button
                className="mt-2 rounded-lg bg-[#0A324A] px-4 py-2 text-white hover:bg-slate-500 disabled:bg-slate-500 "
                onClick={() => submitFeedback()}
                disabled={
                  (feedbackMessage === "" && selectedFeedback === "Other") ||
                  selectedFeedback === ""
                }
              >
                Submit
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
