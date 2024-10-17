/* eslint-disable react-hooks/exhaustive-deps */
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PROFILE_NAME_MAX } from "@/db/limits" // Ensure these are defined and imported correctly.
import { Tables } from "@/supabase/types" // Ensure the `Tables` type is correctly imported.
import { IconUser } from "@tabler/icons-react" // Ensure these icons are correctly imported.
import { FC, useState, useEffect, useContext } from "react"
import { SidebarItem } from "../all/sidebar-display-item" // Ensure this path is correct and the component exists.
import { getRoleById } from "@/db/roles"
import { getWorkspacesByUserId } from "@/db/workspaces"
import { LLM_LIST_MAP } from "@/lib/models/llm/llm-list"
import { LLM, LLMID } from "@/types"
import { ModelSelect } from "@/components/models/model-select"
import { Slider } from "@/components/ui/slider"
import { CHAT_SETTING_LIMITS } from "@/lib/chat-setting-limits"
import { ChatbotUIContext } from "@/context/context"

interface ProfileItemProps {
  profile: Tables<"profiles">
}

export const ProfileItem: FC<ProfileItemProps> = ({ profile }) => {
  const [role, setRole] = useState<string>("")
  const [workspaceId, setWorkspaceId] = useState<string>("")
  const [username, setUsername] = useState(profile.username)
  const [displayName, setDisplayName] = useState(profile.name)
  const [default_model, setModel] = useState<string>("")
  const [default_prompt, setPrompt] = useState<string>("")
  const [default_temperature, setTemperature] = useState<number>()
  const [default_context_length, setDefaultContextLength] = useState<number>()
  const [embeddings_provider, setEmbeddingsProvider] = useState<string>("")
  const [availableModels, setAvailableModels] = useState<LLM[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const { availableOpenRouterModels, models } = useContext(ChatbotUIContext)
  const [MIN_TEMPERATURE, setMinTemperature] = useState<number>(0)
  const [MAX_TEMPERATURE, setMaxTemperature] = useState<number>(1)
  const [MAX_CONTEXT_LENGTH, setMaxContextLength] = useState<number>()

  useEffect(() => {
    const fetchRole = async () => {
      const roleData = await getRoleById(profile?.role_id)
      setRole(roleData.name)
    }

    let workspace: any
    const fetchWorkspace = async () => {
      ;[workspace] = await getWorkspacesByUserId(profile?.user_id)
      setWorkspaceId(workspace.id)
      setModel(workspace.default_model)
      setPrompt(workspace.default_prompt)
      setTemperature(workspace.default_temperature)
      setDefaultContextLength(workspace.default_context_length)
      setEmbeddingsProvider(workspace.embeddings_provider)
    }

    const fetchModels = async () => {
      if (embeddings_provider) {
        const models = LLM_LIST_MAP[embeddings_provider] || []
        const currentModel = models.filter(
          m => m.modelId === workspace?.default_model
        )
        setAvailableModels(models)
      }
    }

    function findOpenRouterModel(modelId: string) {
      return availableOpenRouterModels.find(model => model.modelId === modelId)
    }

    const fetchModelSettings = async () => {
      const models = LLM_LIST_MAP[embeddings_provider] || []

      const MODEL_LIMITS = CHAT_SETTING_LIMITS[default_model as LLMID] || {
        MIN_TEMPERATURE: 0,
        MAX_TEMPERATURE: 1,
        MAX_CONTEXT_LENGTH:
          findOpenRouterModel(default_model)?.maxContext || 4096
      }

      setAvailableModels(models)
      setMinTemperature(MODEL_LIMITS.MIN_TEMPERATURE)
      setMaxTemperature(MODEL_LIMITS.MAX_TEMPERATURE)
      setMaxContextLength(MODEL_LIMITS.MAX_CONTEXT_LENGTH)
    }

    fetchRole()
    fetchWorkspace()
    fetchModels()
    fetchModelSettings()
  }, [profile?.role_id, profile?.user_id, embeddings_provider])

  const handleModelChange = (value: any) => {
    setModel(value.model)
  }

  const handleTemperatureChange = (value: any) => {
    setTemperature(value.temperature)
  }

  const handleDefaultContextLengthChange = (value: any) => {
    setDefaultContextLength(value.contextLength)
  }

  return (
    <SidebarItem
      item={profile}
      isTyping={isTyping}
      contentType="profiles"
      icon={<IconUser size={30} />}
      updateState={{
        personalDetails: { name: displayName, username },
        workspaceDetails: {
          id: workspaceId,
          default_model,
          default_prompt,
          default_temperature,
          default_context_length,
          embeddings_provider
        }
      }}
      renderInputs={() => (
        <>
          <section className="space-y-4">
            <h2 className="text-xl font-bold">Personal Details</h2>
            <div className="space-y-1">
              <Label>Username</Label>
              <Input
                placeholder="Username..."
                value={username}
                onChange={e => setUsername(e.target.value)}
                maxLength={PROFILE_NAME_MAX}
                onCompositionStart={() => setIsTyping(true)}
                onCompositionEnd={() => setIsTyping(false)}
              />
            </div>
            <div className="space-y-1">
              <Label>Name</Label>
              <Input
                placeholder="Name..."
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                maxLength={PROFILE_NAME_MAX}
                onCompositionStart={() => setIsTyping(true)}
                onCompositionEnd={() => setIsTyping(false)}
              />
            </div>
            <div className="space-y-1">
              <Label>Role</Label>
              <Input
                placeholder="Role..."
                value={role}
                readOnly={true}
                onCompositionStart={() => setIsTyping(true)}
                onCompositionEnd={() => setIsTyping(false)}
              />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold">Workspace</h2>
            <div className="space-y-1">
              <Label>Select a model</Label>
              <ModelSelect
                selectedModelId={default_model}
                onSelectModel={model => {
                  handleModelChange({ ...availableModels, model })
                }}
              />
            </div>
            <div className="space-y-1">
              <Label>Prompt</Label>
              <Input
                placeholder="Prompt..."
                value={default_prompt}
                readOnly={true}
                onCompositionStart={() => setIsTyping(true)}
                onCompositionEnd={() => setIsTyping(false)}
              />
            </div>
            <div className="space-y-3">
              <Label className="flex items-center space-x-1">
                <div>Temperature:</div>

                <div>{default_temperature}</div>
              </Label>

              <Slider
                value={[default_temperature!]}
                onValueChange={temperature => {
                  handleTemperatureChange({
                    ...availableModels,
                    temperature: temperature[0]
                  })
                }}
                min={MIN_TEMPERATURE}
                max={MAX_TEMPERATURE}
                step={0.01}
              />
            </div>
            <div className="mt-6 space-y-3">
              <Label className="flex items-center space-x-1">
                <div>Context Length:</div>

                <div>{default_context_length}</div>
              </Label>

              <Slider
                value={[default_context_length!]}
                onValueChange={contextLength => {
                  handleDefaultContextLengthChange({
                    ...availableModels,
                    contextLength: contextLength[0]
                  })
                }}
                min={0}
                max={MAX_CONTEXT_LENGTH}
                step={1}
              />
            </div>
            <div className="space-y-1">
              <Label>Embeddings Provider</Label>
              <Input
                placeholder="Embeddings Provider..."
                value={embeddings_provider}
                readOnly={true}
                onCompositionStart={() => setIsTyping(true)}
                onCompositionEnd={() => setIsTyping(false)}
              />
            </div>
          </section>
        </>
      )}
    />
  )
}
