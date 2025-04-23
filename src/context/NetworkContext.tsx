"use client"

import type React from "react"
import { createContext, useState, useEffect } from "react"
import NetInfo from "@react-native-community/netinfo"

type NetworkContextType = {
  isConnected: boolean
}

export const NetworkContext = createContext<NetworkContextType>({
  isConnected: true,
})

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true)

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected !== null ? state.isConnected : true)
    })

    // Initial check
    NetInfo.fetch().then((state) => {
      setIsConnected(state.isConnected !== null ? state.isConnected : true)
    })

    // Cleanup
    return () => {
      unsubscribe()
    }
  }, [])

  return <NetworkContext.Provider value={{ isConnected }}>{children}</NetworkContext.Provider>
}
