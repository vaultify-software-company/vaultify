"use client"

import { supabase } from "@/lib/supabase/browser-client"
import { useRouter } from "next/navigation"
import { FC, useState } from "react"
import { Button } from "../ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "../ui/dialog"
import PasswordInput from "../ui/password"
import { toast } from "sonner"
import { WithTooltip } from "../ui/with-tooltip"
import { ThemeSwitcher } from "./theme-switcher"

interface ChangePasswordProps {}

export const ChangePassword: FC<ChangePasswordProps> = () => {
  const router = useRouter()

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const handleResetPassword = async () => {
    try {
      if (!newPassword || !confirmPassword) {
        toast.error("Please fill in both password fields.")
        return
      }

      if (newPassword !== confirmPassword) {
        toast.error("Passwords do not match.")
        return
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        toast.error(error.message)
      } else {
        toast.success("Password changed successfully.")
        await supabase.auth.signOut()
        return router.push("/login")
      }
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  return (
    <Dialog open={true}>
      <DialogContent className="h-[300px] w-[400px] p-6">
        {" "}
        {/* Adjust height if needed */}
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
        </DialogHeader>
        <div className="mb-4">
          {" "}
          {/* Add margin to space inputs from the title */}
          <PasswordInput
            className="rounded-md border bg-inherit px-4 py-2"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
          />
        </div>
        <div className="mb-6">
          {" "}
          {/* Ensure consistent spacing for inputs */}
          <PasswordInput
            className="rounded-md border bg-inherit px-4 py-2"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
          />
        </div>
        <DialogFooter className="flex justify-end">
          {" "}
          {/* Align the footer to the right */}
          <Button onClick={handleResetPassword}>Confirm Change</Button>
        </DialogFooter>
      </DialogContent>
      <div className="absolute bottom-8 left-8">
        <WithTooltip
          delayDuration={1000}
          side="bottom"
          display={<div>Switch Theme</div>}
          trigger={<ThemeSwitcher />}
        />
      </div>
    </Dialog>
  )
}
