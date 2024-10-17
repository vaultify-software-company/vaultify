"use client"

import { ChatbotUIContext } from "@/context/context"
import { CHAT_SETTING_LIMITS } from "@/lib/chat-setting-limits"
import { ChatSettings } from "@/types"
import { IconInfoCircle } from "@tabler/icons-react"
import { FC, useContext, useEffect, useState } from "react"
import { ModelSelect } from "../models/model-select"
import { AdvancedSettings } from "./advanced-settings"
import { Checkbox } from "./checkbox"
import { Label } from "./label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "./select"
import { Slider } from "./slider"
import { TextareaAutosize } from "./textarea-autosize"
import { WithTooltip } from "./with-tooltip"
import { Button } from "../ui/button"
import { getOrganizationById, updateOrganization } from "@/db/organizations"
import { TablesUpdate } from "@/supabase/types"
import { toast } from "sonner"
import {
  getWorkspacesByUserId,
  updateWorkspaceByOrganization
} from "@/db/workspaces"
import { sidebarStyle, successButtonStyle } from "./styles"

interface ChatSettingsFormProps {
  chatSettings: ChatSettings
  onChangeChatSettings: (value: ChatSettings) => void
  useAdvancedDropdown?: boolean
  showTooltip?: boolean
  disabled?: boolean
}

export const ChatSettingsForm: FC<ChatSettingsFormProps> = ({
  chatSettings,
  onChangeChatSettings,
  useAdvancedDropdown = true,
  showTooltip = true,
  disabled
}) => {
  const { profile, models, role, setWorkspaces } = useContext(ChatbotUIContext)

  useEffect(() => {
    if (profile) {
      // Fetch workspaces and set them when the profile is available
      const fetchWorkspaces = async () => {
        const workspace = await getWorkspacesByUserId(profile.user_id)
        setWorkspaces(workspace)
      }
      fetchWorkspaces()
    }
  }, [profile, setWorkspaces])

  if (!profile) return null

  const handleChangeSettings = async () => {
    try {
      // Fetch organization information
      const organization = await getOrganizationById(profile.organization_id)

      // Construct payload for updating organization settings
      const updateOrganizationPayload = {
        default_model: chatSettings.model,
        default_prompt: chatSettings.prompt,
        default_temperature: chatSettings.temperature,
        default_context_length: chatSettings.contextLength,
        embeddings_provider: chatSettings.embeddingsProvider
      }

      console.log({ updateOrganizationPayload })

      // Update organization settings
      const updatedOrganization = await updateOrganization(
        organization.id,
        updateOrganizationPayload
      )

      if (updatedOrganization) {
        // Update workspace associated with the user
        const updatedWorkspace = await updateWorkspaceByOrganization(
          profile.user_id,
          updatedOrganization
        )
        if (updatedWorkspace) {
          // Mark organization as not synced
          const updateSync = await updateOrganization(profile.organization_id, {
            sync: false
          })

          if (updateSync) {
            // Fetch and update workspaces
            const updatedWorkspaces = await getWorkspacesByUserId(
              profile.user_id
            )
            setWorkspaces(updatedWorkspaces)

            // Display success message
            toast.success("Chat settings updated successfully")
          }
        }
      }
    } catch (error) {
      // Handle errors
      toast.error("Failed to update chat settings")
      console.error("Failed to update organization settings:", error)
    }
  }

  return (
    <>
      <div className="space-y-3">
        <div className="space-y-1">
          <Label>Model</Label>
          <ModelSelect
            selectedModelId={chatSettings.model}
            onSelectModel={model => {
              onChangeChatSettings({ ...chatSettings, model })
            }}
            disabled={disabled}
          />
        </div>

        {/* <div className="space-y-1">
          <Label>Prompt</Label>
          <TextareaAutosize
            style={sidebarStyle}
            className="bg-background border-input border-2"
            placeholder="You are a helpful AI assistant."
            onValueChange={prompt => {
              onChangeChatSettings({ ...chatSettings, prompt })
            }}
            readOnly={disabled}
            value={chatSettings.prompt}
            minRows={3}
            maxRows={6}
          />
        </div> */}

        {useAdvancedDropdown ? (
          <AdvancedSettings>
            <AdvancedContent
              chatSettings={chatSettings}
              onChangeChatSettings={onChangeChatSettings}
              showTooltip={showTooltip}
              disabled={disabled}
            />
          </AdvancedSettings>
        ) : null}

        <div className="mt-3 flex justify-end">
          <Button
            size="sm"
            onClick={handleChangeSettings}
            disabled={disabled}
            style={successButtonStyle}
          >
            Save
          </Button>
        </div>
      </div>
    </>
  )
}

interface AdvancedContentProps {
  chatSettings: ChatSettings
  onChangeChatSettings: (value: ChatSettings) => void
  showTooltip: boolean
  disabled?: boolean
}

const AdvancedContent: FC<AdvancedContentProps> = ({
  chatSettings,
  onChangeChatSettings,
  showTooltip,
  disabled
}) => {
  const {
    profile,
    organization,
    selectedWorkspace,
    availableOpenRouterModels,
    models
  } = useContext(ChatbotUIContext)

  const isCustomModel = models.some(
    model => model.model_id === chatSettings.model
  )

  function findOpenRouterModel(modelId: string) {
    return availableOpenRouterModels.find(model => model.modelId === modelId)
  }

  const MODEL_LIMITS = CHAT_SETTING_LIMITS[chatSettings.model] || {
    MIN_TEMPERATURE: 0,
    MAX_TEMPERATURE: 1,
    MAX_CONTEXT_LENGTH:
      findOpenRouterModel(chatSettings.model)?.maxContext || 4096
  }

  return (
    <div className="mt-5">
      <div className="space-y-3">
        <Label className="flex items-center space-x-1">
          <div>Temperature:</div>

          <div>{chatSettings.temperature}</div>
        </Label>

        <Slider
          value={[chatSettings.temperature]}
          onValueChange={temperature => {
            onChangeChatSettings({
              ...chatSettings,
              temperature: temperature[0]
            })
          }}
          disabled={disabled}
          min={MODEL_LIMITS.MIN_TEMPERATURE}
          max={MODEL_LIMITS.MAX_TEMPERATURE}
          step={0.01}
        />
      </div>

      <div className="mt-6 space-y-3">
        <Label className="flex items-center space-x-1">
          <div>Context Length:</div>

          <div>{chatSettings.contextLength}</div>
        </Label>

        <Slider
          value={[chatSettings.contextLength]}
          onValueChange={contextLength => {
            onChangeChatSettings({
              ...chatSettings,
              contextLength: contextLength[0]
            })
          }}
          disabled={disabled}
          min={0}
          max={
            isCustomModel
              ? models.find(model => model.model_id === chatSettings.model)
                  ?.context_length
              : MODEL_LIMITS.MAX_CONTEXT_LENGTH
          }
          step={1}
        />
      </div>

      <div className="mt-7 flex items-center space-x-2">
        <Checkbox
          checked={chatSettings.includeProfileContext}
          onCheckedChange={(value: boolean) =>
            onChangeChatSettings({
              ...chatSettings,
              includeProfileContext: value
            })
          }
          disabled={disabled}
        />

        <Label>Chats Include Profile Context</Label>

        {showTooltip && (
          <WithTooltip
            delayDuration={0}
            display={
              <div className="w-[400px] p-3">
                {organization?.profile_context || "No profile context."}
              </div>
            }
            trigger={
              <IconInfoCircle className="cursor-hover:opacity-50" size={16} />
            }
          />
        )}
      </div>

      <div className="mt-4 flex items-center space-x-2">
        <Checkbox
          checked={chatSettings.includeWorkspaceInstructions}
          onCheckedChange={(value: boolean) =>
            onChangeChatSettings({
              ...chatSettings,
              includeWorkspaceInstructions: value
            })
          }
          disabled={disabled}
        />

        <Label>Chats Include Workspace Instructions</Label>

        {showTooltip && (
          <WithTooltip
            delayDuration={0}
            display={
              <div className="w-[400px] p-3">
                {selectedWorkspace?.instructions ||
                  "No workspace instructions."}
              </div>
            }
            trigger={
              <IconInfoCircle className="cursor-hover:opacity-50" size={16} />
            }
          />
        )}
      </div>

      <div className="mt-5">
        <Label>Embeddings Provider</Label>

        <Select
          value={chatSettings.embeddingsProvider}
          onValueChange={(embeddingsProvider: "openai" | "local") => {
            onChangeChatSettings({
              ...chatSettings,
              embeddingsProvider
            })
          }}
          disabled={disabled}
        >
          <SelectTrigger disabled={disabled}>
            <SelectValue defaultValue="openai" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="openai">
              {profile?.use_azure_openai ? "Azure OpenAI" : "OpenAI"}
            </SelectItem>

            {window.location.hostname === "localhost" && (
              <SelectItem value="local">Local</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
