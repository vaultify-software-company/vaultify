"use client"

import { sidebarStyle } from "@/components/ui/styles"
import { ChatbotUIContext } from "@/context/context"
import { useContext } from "react"

export default function WorkspacePage() {
  const { selectedWorkspace } = useContext(ChatbotUIContext)

  return (
    <div
      className="flex h-screen w-full flex-col items-center justify-center"
      style={sidebarStyle}
    >
      <div className="text-4xl">{selectedWorkspace?.name}</div>
    </div>
  )
}
