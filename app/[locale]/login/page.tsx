import { Metadata } from "next"
import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import { LoginSVG } from "@/components/icons/login-svg"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { screenStyle } from "@/components/ui/styles"
import { SubmitButton } from "@/components/ui/submit-button"
import { createClient } from "@/lib/supabase/server"
import { Database } from "@/supabase/types"
import { createServerClient } from "@supabase/ssr"
import AlertComponent from "@/components/utility/alert-component"
import { ThemeSwitcher } from "@/components/utility/theme-switcher"
import { WithTooltip } from "@/components/ui/with-tooltip"
import PasswordInput from "@/components/ui/password"

export const metadata: Metadata = {
  title: "Login"
}

export default async function Login({
  searchParams
}: {
  searchParams: {
    message?: string
    type?: "error" | "info" | "success" | "warning"
    duration?: number
  }
}) {
  const cookieStore = cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        }
      }
    }
  )

  const session = (await supabase.auth.getSession()).data.session
  console.log({ session })

  if (session) {
    const { data: homeWorkspace, error } = await supabase
      .from("workspaces")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("is_home", true)
      .single()

    if (!homeWorkspace) {
      throw new Error(error.message)
    }

    return redirect(`/${homeWorkspace.id}/chat`)
  }

  const signIn = async (formData: FormData) => {
    "use server"
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return redirect(
        `/login?type=error&message=${encodeURIComponent(error.message)}&duration=3000`
      )
    }

    const { data: homeWorkspace, error: homeWorkspaceError } = await supabase
      .from("workspaces")
      .select("*")
      .eq("user_id", data.user.id)
      .eq("is_home", true)
      .single()

    if (!homeWorkspace) {
      throw new Error(
        homeWorkspaceError?.message || "An unexpected error occurred"
      )
    }

    return redirect(`/${homeWorkspace.id}/chat`)
  }

  const handleResetPassword = async (formData: FormData) => {
    "use server"
    const email = formData.get("email") as string
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/login/password`
    })

    if (error) {
      return redirect(
        `/login?type=error&message=${encodeURIComponent(error.message)}&duration=3000`
      )
    }

    return redirect(
      `/login?type=info&message=${encodeURIComponent("Check email to reset password")}&duration=3000`
    )
  }

  return (
    <div
      className="flex w-full flex-1 flex-col justify-center gap-2 p-5 px-8 sm:max-w-md"
      style={screenStyle}
    >
      <div className="flex items-center justify-center">
        <AlertComponent
          message={searchParams.message}
          type={searchParams.type}
          duration={searchParams.duration}
        />
      </div>
      <form
        className="animate-in text-foreground flex w-full flex-1 flex-col justify-center gap-2"
        action={signIn}
      >
        <LoginSVG />
        <Label className="text-md mt-4" htmlFor="email">
          Email
        </Label>
        <Input
          className="mb-3 rounded-md border bg-inherit px-4 py-2"
          name="email"
          placeholder="you@example.com"
          required
        />
        <Label className="text-md" htmlFor="password">
          Password
        </Label>

        <PasswordInput className="rounded-md border bg-inherit px-4 py-2" />

        <SubmitButton
          className={`my-6 rounded-md px-4 py-2 dark:bg-[#004267]`} // Changed mb-2 to mb-6
        >
          Login
        </SubmitButton>
        {searchParams.message && (
          <div style={{ color: "red" }}>{searchParams.message}</div>
        )}
        <div className="text-muted-foreground mt-1 flex justify-center text-sm">
          <span className="mr-1">Forgot your password?</span>
          <button
            formAction={handleResetPassword}
            className="text-primary ml-1 underline hover:opacity-80 dark:text-white"
            style={{ textDecoration: "none" }}
          >
            Reset
          </button>
        </div>
      </form>
      <div className="absolute bottom-8 left-8">
        <WithTooltip
          delayDuration={1000}
          side="bottom"
          display={<div>Switch Theme</div>}
          trigger={<ThemeSwitcher />}
        />
      </div>
    </div>
  )
}
