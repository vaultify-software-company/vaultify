// components/AlertComponent.tsx
"use client"
import { useEffect, useState } from "react"
import { Alert } from "antd"

interface AlertComponentProps {
  message?: string
  type?: "error" | "info" | "success" | "warning"
  duration?: number
}

const AlertComponent: React.FC<AlertComponentProps> = ({
  message,
  type,
  duration = 3000
}) => {
  const [visible, setVisible] = useState(!!message)

  useEffect(() => {
    if (message && duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false)
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [message, duration])

  if (!visible) return null

  return (
    <Alert
      message={message}
      type={type}
      showIcon
      style={{ marginBottom: "1rem" }}
    />
  )
}

export default AlertComponent
