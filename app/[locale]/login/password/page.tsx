"use client"

import { ChangePassword } from "@/components/utility/change-password"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

export default function ChangePasswordPage() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams() // Access search parameters

  // Get the query value
  const code = searchParams.get("code") // Replace 'someValue' with your actual query parameter key

  useEffect(() => {
    ;(async () => {
      if (!code) {
        router.push("/login")
      } else {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) {
    return null
  }

  return (
    <>
      {/* Use the value from the query parameter */}
      <div>Query Value: {code}</div>
      <ChangePassword />
    </>
  )
}
