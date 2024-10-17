"use client"

import { ChatbotUISVG } from "@/components/icons/chatbotui-svg"
import { sidebarStyle } from "@/components/ui/styles"
import { IconArrowRight } from "@tabler/icons-react"
import { useTheme } from "next-themes"
import Link from "next/link"

export default function HomePage() {
  const { theme } = useTheme()

  return (
    <div className="flex size-full flex-col items-center justify-center">
      <div>
        <ChatbotUISVG theme={theme === "dark" ? "dark" : "light"} scale={0.3} />
      </div>

      <div className="mt-2 text-4xl font-bold">Vaultify</div>

      <Link
        className="mt-4 flex w-[200px] items-center justify-center rounded-md bg-[#004267] p-2  font-normal text-white"
        href="/login"
      >
        Start
        <IconArrowRight className="ml-1" size={20} />
      </Link>
    </div>
  )
}
