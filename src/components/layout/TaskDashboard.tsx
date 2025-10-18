"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Sidebar } from "@/components/layout/Sidebar"
import { MainDashboard } from "@/components/dashboard/MainDashboard"
import { TaskList } from "@/components/task/TaskList"
import { PomodoroTimerNew } from "@/components/pomodoro/PomodoroTimerNew"
import { AnalyticsDashboardNew } from "@/components/analytics/AnalyticsDashboardNew"
import { ProfileViewNew } from "@/components/profile/ProfileViewNew"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { useTask } from "@/contexts/TaskContext"
import { usePomodoro } from "@/contexts/PomodoroContext"
import { useAuth } from "@/contexts/AuthContext"
import { Task } from "@/types"

type View = "dashboard" | "tasks" | "pomodoro" | "analytics" | "profile"

export function TaskDashboard() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [currentView, setCurrentView] = useState<View>("dashboard")
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [mounted, setMounted] = useState(false)
    const { setUserId } = useTask()
    const { setCurrentTask } = usePomodoro()
    const { user, logout } = useAuth()

    // Set user ID from authentication
    useEffect(() => {
        setMounted(true)
        if (user?._id) {
            setUserId(user._id.toString())
        }
    }, [user, setUserId])

    // Handle URL-based navigation
    useEffect(() => {
        const view = searchParams.get('view') as View
        if (view && ['dashboard', 'tasks', 'pomodoro', 'analytics', 'profile'].includes(view)) {
            setCurrentView(view)
        }
    }, [searchParams])

    // Update URL when view changes
    const handleViewChange = (view: View) => {
        setCurrentView(view)
        router.push(`/?view=${view}`, { scroll: false })
    }

    const handleStartPomodoro = (task: Task) => {
        setCurrentTask(task)
        handleViewChange("pomodoro") // Switch to pomodoro view when starting timer
    }

    if (!mounted) {
        return (
            <div className="flex h-screen bg-background animate-pulse">
                <div className="w-64 bg-muted"></div>
                <div className="flex-1">
                    <div className="h-16 bg-muted"></div>
                    <div className="p-6">
                        <div className="h-32 bg-muted rounded-lg"></div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen bg-background">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <div
                className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <Sidebar currentView={currentView} onViewChange={handleViewChange} />
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
                    {currentView === "dashboard" && <MainDashboard onNavigate={handleViewChange} />}
                    {currentView === "tasks" && <TaskList onStartPomodoro={handleStartPomodoro} />}
                    {currentView === "pomodoro" && <PomodoroTimerNew />}
                    {currentView === "analytics" && <AnalyticsDashboardNew userId={user?._id?.toString() || ""} />}
                    {currentView === "profile" && (
                        <ProfileViewNew 
                            userId={user?._id?.toString() || ""} 
                            onLogout={logout}
                        />
                    )}
                </main>
            </div>
        </div>
    )
}
