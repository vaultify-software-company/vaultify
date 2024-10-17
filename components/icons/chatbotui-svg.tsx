import { FC } from "react"
import Image from "./logo.svg"
interface ChatbotUISVGProps {
  theme: "dark" | "light"
  scale?: number
}

export const ChatbotUISVG: FC<ChatbotUISVGProps> = ({ theme, scale = 1 }) => {
  return (
    <>
      {theme === "dark" ? (
        <svg
          id="Layer_1"
          data-name="Layer 1"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 500 384.15"
          width={100}
          height={100}
        >
          <defs>
            <style>
              {
                "\n      .cls-1 {\n        opacity: .65;\n      }\n\n      .cls-2 {\n        opacity: .8;\n      }\n\n      .cls-3 {\n        opacity: .45;\n      }\n\n      .cls-4 {\n        fill: #fff;\n        stroke-width: 0px;\n      }\n    "
              }
            </style>
          </defs>
          <g className="cls-3">
            <path
              className="cls-4"
              d="M240.86,226.7L157.23,42.8c-1.16-1.6-2.26-3.44-3.25-5.62-14.11-30.79-37.77-30.79-45.23-30.79-.26,0-.5-.1-.74-.25H5.68l139.67,281.26,92.84-59,2.66-1.69Z"
            />
          </g>
          <g className="cls-1">
            <path
              className="cls-4"
              d="M388.34,6.14c-.24.15-.48.25-.74.25-5.87,0-21.73.07-35.11,15.03l-85.92,188.95,160.22-101.82,27.53-17.5L494.32,6.14h-105.98Z"
            />
          </g>
          <g className="cls-2">
            <path
              className="cls-4"
              d="M175.06,347.23h0c.78,1.72,1.61,3.3,2.45,4.83.26.47.52.92.79,1.38.62,1.07,1.26,2.09,1.9,3.08.27.42.55.85.82,1.25.83,1.2,1.68,2.33,2.54,3.39.39.48.8.92,1.2,1.38.5.57,1,1.13,1.51,1.66.51.53,1.01,1.05,1.53,1.54.36.34.72.66,1.08.98,1.31,1.18,2.63,2.26,3.96,3.21h0c11.28,8.05,22.68,8.09,27.45,8.09h89.37l-.56-1.23.62-1.23.55,1.21,75.89-152.81,51.71-97.98-188.6,119.85-94.68,60.17,20.47,41.23Z"
            />
          </g>
        </svg>
      ) : (
        <img src={Image.src} className="size-[100px]" alt="" />
      )}
    </>
  )
}
