"use client"

import { FC, useContext } from "react"
import { IconToggleLeft, IconToggleRight } from "@tabler/icons-react"
import { ChatbotUIContext } from "@/context/context"

interface ToggleStatus {
  vellum: boolean
  handleToggleClick: (value: boolean) => void // Updated type for handleToggleClick
}

export const Vellum: FC<ToggleStatus> = ({ vellum, handleToggleClick }) => {
  const { chatSettings } = useContext(ChatbotUIContext)

  return (
    <div>
      {vellum === true ? (
        <IconToggleRight
          className="cursor-pointer p-0 text-green-500 transition-all duration-500 hover:opacity-50"
          size={32}
          onClick={() => handleToggleClick(false)}
        />
      ) : (
        <IconToggleLeft
          className="cursor-pointer p-0 text-gray-500 transition-all duration-500 hover:opacity-50"
          size={32}
          onClick={() => handleToggleClick(true)}
        />
      )}
    </div>
  )
}
