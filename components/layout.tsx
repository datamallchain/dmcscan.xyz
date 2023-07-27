import { SiteHeader } from "@/components/site-header"
import { createContext, useState, useEffect } from "react"

interface LayoutProps {
  children: React.ReactNode
}

export const UserContext = createContext('')
export function Layout({ children }: LayoutProps) {
  const [loginAccount, setLoginAccount] = useState('')

  return (
    <UserContext.Provider value={loginAccount}>
      <SiteHeader />
      <main>{children}</main>
    </UserContext.Provider>
  )
}
