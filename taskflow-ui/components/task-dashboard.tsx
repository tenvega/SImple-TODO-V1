"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TaskList } from "@/components/task-list"
import { PomodoroTimer } from "@/components/pomodoro-timer"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { ProfileView } from "@/components/profile-view"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

type View = "tasks" | "pomodoro" | "analytics" | "profile"

export function TaskDashboard() {
  const [currentView, setCurrentView] = useState<View>("tasks")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="flex items-center gap-4 border-b border-border bg-card px-4 py-3 lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">TaskFlow</h1>
        </div>

        {/* Content area */}
        <main className="flex-1 overflow-auto">
          {currentView === "tasks" && <TaskList />}
          {currentView === "pomodoro" && <PomodoroTimer />}
          {currentView === "analytics" && <AnalyticsDashboard />}
          {currentView === "profile" && <ProfileView />}
        </main>
      </div>
    </div>
  )
}
