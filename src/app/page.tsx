"use client"

import { TaskDashboard } from "@/components/layout/TaskDashboard"
import { AuthPage } from "@/components/auth/AuthPage"
import { useAuth } from "@/contexts/AuthContext"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  return isAuthenticated ? <TaskDashboard /> : <AuthPage />
}