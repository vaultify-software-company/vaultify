// components/ui/user-icon.tsx
import { FC } from "react"

interface UserIconProps {
  size?: number
}

export const UserIcon: FC<UserIconProps> = ({ size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="12" fill="#ccc" />
      <circle cx="12" cy="8" r="4" fill="#fff" />
      <path d="M12 14c-4 0-7 2-7 4v1h14v-1c0-2-3-4-7-4z" fill="#fff" />
    </svg>
  )
}
