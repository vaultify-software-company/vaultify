"use client"

import { useContext, useEffect, useState } from "react"
import { ChatbotUIContext } from "@/context/context"
import { getProfileByUserId, updateProfileByOrganization } from "@/db/profile"
import {
  getHomeWorkspaceByUserId,
  getWorkspacesByUserId,
  updateWorkspaceByOrganization
} from "@/db/workspaces"
import {
  fetchHostedModels,
  fetchOpenRouterModels
} from "@/lib/models/fetch-models"
import { supabase } from "@/lib/supabase/browser-client"
import { useRouter } from "next/navigation"
import { updateOrganization } from "@/db/organizations"

export default function SetupPage() {
  const {
    role,
    profile,
    setRole,
    setProfile,
    setWorkspaces,
    setSelectedWorkspace,
    setEnvKeyMap,
    setAvailableHostedModels,
    setAvailableOpenRouterModels
  } = useContext(ChatbotUIContext)

  const router = useRouter()

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const session = (await supabase.auth.getSession()).data.session

      if (!session) {
        return router.push("/login")
      } else {
        const user = session.user

        const userProfile = await getProfileByUserId(user.id)
        setProfile(userProfile)

        if (!userProfile.has_onboarded) {
          setLoading(false)
        } else {
          const data = await fetchHostedModels(userProfile)

          if (!data) return

          setEnvKeyMap(data.envKeyMap)
          setAvailableHostedModels(data.hostedModels)

          if (
            userProfile["openrouter_api_key"] ||
            data.envKeyMap["openrouter"]
          ) {
            const openRouterModels = await fetchOpenRouterModels()
            if (!openRouterModels) return
            setAvailableOpenRouterModels(openRouterModels)
          }

          const homeWorkspaceId = await getHomeWorkspaceByUserId(user.id)

          // Call handleSaveSetupSetting asynchronously
          await handleSaveSetupSetting()

          return router.push(`/${homeWorkspaceId}/chat`)
        }
      }
    })()
  }, [])

  const handleSaveSetupSetting = async () => {
    const session = (await supabase.auth.getSession()).data.session
    if (!session) {
      return router.push("/login")
    }

    if (!profile) return
    if (!role) return

    setRole(role)

    const organization = await updateOrganization(profile.organization_id, {
      sync: true
    })

    const newProfile = await updateProfileByOrganization(
      profile.user_id,
      role?.id,
      profile,
      organization,
      profile.name
    )
    setProfile(newProfile)

    const newWorkspace = await updateWorkspaceByOrganization(
      newProfile.user_id,
      organization
    )

    const workspaces = await getWorkspacesByUserId(newWorkspace.user_id)
    setWorkspaces(workspaces)

    const homeWorkspace = workspaces.find(w => w.is_home)
    setSelectedWorkspace(homeWorkspace!)

    return router.push(`/${homeWorkspace?.id}/chat`)
  }

  if (loading) {
    return null
  }

  Promise.resolve().then(() => handleSaveSetupSetting())
}
