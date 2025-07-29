"use client"

import { createContext, useContext, useState, ReactNode } from "react"

export type UserRole = "admin" | "editor" | "viewer"

interface AuthContextType {
  role: UserRole
  setRole: (role: UserRole) => void
  canAdd: boolean
  canEdit: boolean
  canDelete: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<UserRole>("admin")

  const canAdd = role === "admin" || role === "editor"
  const canEdit = canAdd
  const canDelete = role === "admin"

  return (
    <AuthContext.Provider value={{ role, setRole, canAdd, canEdit, canDelete }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
