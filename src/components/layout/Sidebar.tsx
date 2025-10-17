"use client"

import { Button } from "@/components/ui/button"
import { CheckSquare, Timer, BarChart3, User, Moon, Sun, LayoutDashboard, Settings } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

type View = "dashboard" | "tasks" | "pomodoro" | "analytics" | "profile"

interface SidebarProps {
    currentView: View
    onViewChange: (view: View) => void
}

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const navItems = [
        { id: "dashboard" as View, label: "Dashboard", icon: LayoutDashboard },
        { id: "tasks" as View, label: "Tasks", icon: CheckSquare },
        { id: "pomodoro" as View, label: "Pomodoro", icon: Timer },
        { id: "analytics" as View, label: "Analytics", icon: BarChart3 },
    ]

    return (
        <div className="flex h-full flex-col border-r border-sidebar-border bg-sidebar">
            {/* Logo */}
            <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                    <CheckSquare className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-lg font-semibold text-sidebar-foreground">TaskFlow</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 p-4">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = currentView === item.id
                    return (
                        <Button
                            key={item.id}
                            variant={isActive ? "secondary" : "ghost"}
                            className={`w-full justify-start gap-3 ${isActive
                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                }`}
                            onClick={() => onViewChange(item.id)}
                        >
                            <Icon className="h-5 w-5" />
                            {item.label}
                        </Button>
                    )
                })}
            </nav>

            {/* Profile Section */}
            <div className="border-t border-sidebar-border p-4 space-y-2">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    onClick={() => onViewChange("profile")}
                >
                    <User className="h-5 w-5" />
                    Profile
                </Button>
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                    {mounted && theme === "dark" ? (
                        <>
                            <Sun className="h-5 w-5" />
                            Light Mode
                        </>
                    ) : (
                        <>
                            <Moon className="h-5 w-5" />
                            Dark Mode
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
