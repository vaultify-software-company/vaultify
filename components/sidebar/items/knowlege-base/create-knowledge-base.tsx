"use client"
import { SidebarCreateItem } from "@/components/sidebar/items/all/sidebar-create-item"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Title } from "@radix-ui/react-toast"
import { ChatbotUIContext } from "@/context/context"
import { PROMPT_NAME_MAX } from "@/db/limits"
import { FC, useCallback, useContext, useEffect, useState } from "react"
import "react-quill/dist/quill.snow.css" // Import the styles
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import {
  getKnowledgeBase,
  createKnowledgeBase,
  updateKnowledgeBase
} from "@/db/knowledge_base"
import { toast } from "sonner"

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false })

export const CreateCustomKnowledgeBase = ({}) => {
  const { profile, selectedWorkspace } = useContext(ChatbotUIContext)
  const [isTyping, setIsTyping] = useState(false)
  const [knowledgeBaseName, setKnowLegeBaseName] = useState("")
  const [knowledgeBase, setKnowledgeBase] = useState("")
  const [data, setData] = useState<any>(null)
  console.log(data)
  // Memoize the handleChange function
  const handleChange = (value: string) => {
    setKnowledgeBase(value)
  }

  useEffect(() => {
    const getKnowledgeBaseData = async () => {
      if (!profile || !profile.user_id) return
      const data = await getKnowledgeBase(profile.user_id)

      if (data) {
        setKnowLegeBaseName(data.identifier)
        setKnowledgeBase(data.text)
        setData(data)
        console.log({ data })
      }
    }

    getKnowledgeBaseData()
  }, [profile])

  if (!profile) return null
  if (!selectedWorkspace) return null

  const createKnowledgeBaseOperation = async (data: any) => {
    const createdData = await createKnowledgeBase(data)

    if (createdData) {
      setData(createdData)
      toast.success("Knowledge base created successfully")
    } else {
      toast.error("Error creating knowledge base")
    }
  }

  const updateKnowledgeBaseOperation = async (payload: any) => {
    const updatedData = await updateKnowledgeBase(payload, data.id)

    if (updatedData) {
      setData(updatedData)
      toast.success("Knowledge base updated successfully")
    } else {
      toast.error("Error updating knowledge base")
    }
  }

  const submitKnowledgeBase = async () => {
    const payload = {
      identifier: knowledgeBaseName,
      text: knowledgeBase,
      user_id: profile.user_id
    }

    if (data) {
      await updateKnowledgeBaseOperation(payload)
    } else {
      await createKnowledgeBaseOperation(payload)
    }
  }

  return (
    <div className="">
      <div>
        <Title>Create Knowledge Base</Title>
      </div>
      <div>
        <Label>Identifier</Label>
        <Input
          placeholder="Knowledge base name..."
          type="name"
          value={knowledgeBaseName}
          onChange={e => setKnowLegeBaseName(e.target.value)}
          maxLength={PROMPT_NAME_MAX}
          onCompositionStart={() => setIsTyping(true)}
          onCompositionEnd={() => setIsTyping(false)}
        />
      </div>
      <div className="space-y-1">
        <Label>Content</Label>
        <ReactQuill
          className="h-[100px]"
          value={knowledgeBase}
          onChange={handleChange}
          theme="snow"
        />
      </div>
      <div className="space-y-20 pt-20">
        <Button
          onClick={() => submitKnowledgeBase()}
          disabled={
            (!knowledgeBaseName && !knowledgeBase) ||
            (data &&
              knowledgeBase === data.text &&
              knowledgeBaseName === data.identifier)
          }
        >
          {data ? "Update" : "Save"}
        </Button>
      </div>
    </div>
  )
}
