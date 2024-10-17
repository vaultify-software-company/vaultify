import { adminAuthClient } from "@/lib/supabase/auth-admin-client"
import { AuthError, User } from "@supabase/supabase-js"

interface UserResponse {
  data: { user: User | null } | null
  error: AuthError | null
}

export const createUser = async (userData: {
  email: string
  password: string
  user_metadata: { name: string; password: string }
}): Promise<UserResponse> => {
  try {
    // Create the user
    const { data, error } = await adminAuthClient.createUser(userData)
    console.log({ data, error })

    if (error) {
      // Check if the error is due to a duplicate email
      if (
        error.message.includes("duplicate key value violates unique constraint")
      ) {
        console.error("User with this email already exists")
        return {
          data: null,
          error: new Error("User with this email already exists") as AuthError
        }
      }
      return { data: null, error }
    }

    if (data?.user?.email) {
      // Send verification email
      const { error: emailError } = await adminAuthClient.inviteUserByEmail(
        data.user.email,
        {
          redirectTo: "https://vaultify-two.vercel.app/"
        }
      )

      if (emailError) {
        console.error("Error sending verification email:", emailError)
        return { data: null, error: emailError }
      }

      console.log("Verification email sent successfully")
    }

    return { data, error }
  } catch (error) {
    console.error(error)
    return { data: null, error: error as AuthError }
  }
}

export const deleteUser = async (userId: string): Promise<UserResponse> => {
  try {
    const { data, error } = await adminAuthClient.deleteUser(userId)

    return { data, error }
  } catch (error) {
    console.error(error)
    return { data: null, error: error as AuthError }
  }
}
