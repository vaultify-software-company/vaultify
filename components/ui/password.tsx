"use client"

import { Input } from "antd"
import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"

// Define props interface for TypeScript
interface PasswordInputProps {
  className?: string // Optional className prop
  type?: string // Optional type prop
  name?: string // Optional name prop
  placeholder?: string // Optional placeholder prop
  value?: string // Optional value prop
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void // Function to handle change events
}

// Functional component definition with props destructuring
const PasswordInput: React.FC<PasswordInputProps> = ({
  className = "", // Default value for className
  type = "password", // Default value for type
  name = "password", // Default value for name
  placeholder = "••••••••", // Default value for placeholder
  value, // Prop for input value
  onChange // onChange handler
}) => {
  const [showPassword, setShowPassword] = useState(false) // State to toggle password visibility

  return (
    <div className="relative">
      <Input
        className={`${className} hover:bg-inherit focus:bg-inherit dark:text-white`} // Ensure background color is never white
        type={showPassword ? "text" : type} // Set input type based on showPassword state
        name={name} // Set input name
        value={value} // Set input value
        placeholder={placeholder} // Set input placeholder
        onChange={onChange} // Attach onChange handler
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)} // Toggle password visibility
        className="hover:text-white-700 dark:hover:text-white-400 absolute inset-y-0 right-3 flex items-center justify-center" // Style for hover effect on the button only
        tabIndex={-1}
      >
        {showPassword ? (
          <Eye className="text-black-600 dark:text-white-600 size-5" />
        ) : (
          <EyeOff className="text-black-600 dark:text-white-600 size-5" />
        )}
      </button>
    </div>
  )
}

export default PasswordInput
