"use client"

import { Brand } from "@/components/ui/brand"
import { ChatbotUIContext } from "@/context/context"
import { Button, Table } from "antd"
import TextArea from "antd/es/input/TextArea"
import { useTheme } from "next-themes"
import { useContext, useEffect, useState } from "react"
import { handleRetrieval } from "@/components/chat/chat-helpers"
import { useRouter, useSearchParams } from "next/navigation"

export default function ChatPage() {
  const [matches, setMatches] = useState<any>([])
  const [message, setMessage] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]) // Track expanded rows
  const { sourceCount } = useContext(ChatbotUIContext)
  const { theme } = useTheme()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const getQueryParams = async () => {
      const query = searchParams.get("message")
      if (query && message !== query) {
        setMessage(query)
        await fetchMatches(query)
      }
    }
    getQueryParams()
  }, [searchParams])

  const fetchMatches = async (query: string) => {
    setLoading(true)
    try {
      const matchers: any[] = await handleRetrieval(
        query,
        [],
        [],
        "openai",
        sourceCount
      )

      const data = matchers.map((matcher: any, index: number) => {
        const extractedContent = extractContent(matcher.content)
        return {
          key: index, // Adding a key for tracking
          file_name: extractedContent.file_name,
          file_description: extractedContent.file_description,
          file_content: extractedContent.file_content,
          similarity: `${(matcher.similarity * 100).toFixed(2)} %`
        }
      })

      setMatches(data)
    } catch (error) {
      console.error("Error fetching matches:", error)
    } finally {
      setLoading(false)
    }
  }

  const extractContent = (content: string) => {
    try {
      const startIndex = content.indexOf("{")
      const endIndex = content.lastIndexOf("}") + 1 // include the closing brace
      const jsonString = content.slice(startIndex, endIndex)

      // Attempt to parse the extracted JSON string
      const parsedData = JSON.parse(jsonString)

      // Return parsed data
      return {
        file_name: parsedData["file name"] || "No name available",
        file_description:
          parsedData["file description"] || "No description available",
        file_content: parsedData["file content"] || "No content available"
      }
    } catch (error) {
      console.error("Error parsing JSON:", error)
      // Return a default error object in case of failure
      return {
        file_name: "Error",
        file_description: "Error",
        file_content: "Error"
      }
    }
  }

  const getMatches = async () => {
    router.push(`?message=${encodeURIComponent(message)}`)
    await fetchMatches(message)
  }

  const handleExpand = (key: React.Key) => {
    const currentIndex = expandedRowKeys.indexOf(key)
    const newExpandedRowKeys =
      currentIndex === -1
        ? [...expandedRowKeys, key] // Add key to expanded
        : expandedRowKeys.filter(k => k !== key) // Remove key from expanded

    setExpandedRowKeys(newExpandedRowKeys)
  }

  const columns = [
    {
      title: "File Name",
      dataIndex: "file_name",
      key: "file_name"
    },
    {
      title: "File Description",
      dataIndex: "file_description",
      key: "file_description"
    },
    {
      title: "File Content",
      key: "file_content",
      render: (text: any, record: any) => (
        <div>
          {expandedRowKeys.includes(record.key) ? (
            <div>
              {record.file_content}
              <Button onClick={() => handleExpand(record.key)} type="link">
                View Less
              </Button>
            </div>
          ) : (
            <Button onClick={() => handleExpand(record.key)} type="link">
              View More
            </Button>
          )}
        </div>
      )
    },
    {
      title: "Similarity %",
      dataIndex: "similarity",
      key: "similarity"
    }
  ]

  return (
    <>
      <div className="relative flex h-full flex-col items-center justify-center">
        <div className="flex max-h-[300px] w-full min-w-[300px] items-end gap-2 px-2 pb-3 pt-0 max-[640px]:pt-[.5rem] sm:w-[600px] sm:pb-8 sm:pt-5 md:w-[700px] lg:w-[700px] xl:w-[800px] dark:bg-[#0a324a]">
          <TextArea
            className="h-[200px] w-full bg-transparent text-white focus:bg-slate-500 focus:text-white"
            placeholder="Search..."
            autoSize
            value={message}
            onChange={e => setMessage(e.target.value)}
          />
          <Button
            onClick={getMatches}
            className="w-[100px]"
            disabled={!message} // Disable button if input is empty
            style={!message ? { color: "#ffffff" } : { color: "#000000" }} // Use a proper CSS value for color
          >
            Search
          </Button>
        </div>
        <div className="top-50% left-50% -translate-x-50% -translate-y-50% absolute mb-20 dark:bg-[#0a324a]">
          <Brand theme={theme === "dark" ? "dark" : "light"} />
        </div>
        <div className="flex h-full grow flex-col items-center justify-center max-[640px]:w-full">
          <Table
            columns={columns}
            dataSource={matches}
            pagination={false}
            loading={loading}
            className="h-[85vh] max-h-[95vh] w-full overflow-auto text-wrap px-2 pb-10 text-white sm:w-[600px] md:w-[700px] lg:w-[700px] xl:w-[800px] dark:bg-[#0a324a] dark:text-[#0a324a] dark:opacity-80"
          />
        </div>
      </div>
    </>
  )
}
