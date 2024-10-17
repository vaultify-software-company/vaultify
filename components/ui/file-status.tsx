import { IconCheck, IconX, IconAlertTriangle } from "@tabler/icons-react" // Import the icons
import { Spin, Tooltip } from "antd" // Import the spinner and tooltip components

interface Item {
  status: "completed" | "pending" | "failed" | "corrupted"
}

interface ShowFileStatusProps {
  contentType: string
  item: Item
}

const ShowFileStatus: React.FC<ShowFileStatusProps> = ({
  contentType,
  item
}) => {
  return (
    <div>
      {contentType === "files" ? (
        item?.status === "completed" ? (
          <Tooltip title="Upload completed">
            <div style={{ color: "greenyellow" }}>
              <IconCheck />
            </div>
          </Tooltip>
        ) : item?.status === "pending" ? (
          <Tooltip title="Uploading...">
            <div>
              <Spin style={{ color: "black" }} />
            </div>
          </Tooltip>
        ) : item?.status === "failed" ? (
          <Tooltip title="Upload failed">
            <div style={{ color: "red" }}>
              <IconX />
            </div>
          </Tooltip>
        ) : item?.status === "corrupted" ? (
          <Tooltip title="File is corrupted">
            <div style={{ color: "orange" }}>
              <IconAlertTriangle /> {/* Warning sign for corrupted status */}
            </div>
          </Tooltip>
        ) : null
      ) : null}
    </div>
  )
}

export default ShowFileStatus
