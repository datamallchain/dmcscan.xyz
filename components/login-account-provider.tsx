"use client"

import * as React from "react"

export const AppContext = React.createContext('')
export function AppProvider({ children, ...props }: any) {
  return <AppContext.Provider {...props}>{children}</AppContext.Provider>
}
