"use client"
import { FC } from "react"
import BlackLogo from "./dark_logo.png"
import WhiteLogo from "./light_logo.png"
import { useTheme } from "next-themes"

export const LoginSVG = () => {
  const { theme } = useTheme()
  return (
    <>
      {theme === "light" ? (
        <img src={WhiteLogo.src} alt="" />
      ) : (
        <img src={BlackLogo.src} alt="" />
      )}
    </>
  )
}
