"use client"

import Link from "next/link"
import { FC } from "react"
import { ChatbotUISVG } from "../icons/chatbotui-svg"
import { useTheme } from "next-themes"

interface BrandProps {
  theme?: "dark" | "light"
}

export const Brand: FC<BrandProps> = () => {
  const { theme } = useTheme()

  return (
    <Link
      className="flex cursor-pointer flex-col items-center hover:opacity-50"
      href="https://vallum-llm-chatbot.vercel.app/"
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="mb-2">
        <ChatbotUISVG theme={theme === "dark" ? "dark" : "light"} scale={0.3} />
      </div>
    </Link>
  )
}
