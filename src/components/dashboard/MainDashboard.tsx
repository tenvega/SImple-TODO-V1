"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckSquare, Clock, Target, TrendingUp, Play, Pause, Plus, ArrowRight, BarChart3, Coffee } from "lucide-react"
import { useTask } from "@/contexts/TaskContext"
import { Task } from "@/types"

interface MainDashboardProps {
    onNavigate: (view: string) => void
}

export function MainDashboard({ onNavigate }: MainDashboardProps) {
    const { state, fetchTasks } = useTask()
    const [pomodoroTime, setPomodoroTime] = useState(25 * 60) // 25 minutes in seconds
    const [isPomodoroActive, setIsPomodoroActive] = useState(false)

    // Extract tasks and loading from state
    const { tasks, loading } = state

    // Tasks are automatically fetched by TaskContext when user ID changes
    // No need to manually fetch here to prevent duplicate calls

    // Ensure tasks is an array with fallback
    const safeTasks = tasks || []


    // Show loading state if tasks are still being fetched
    if (loading) {
        return (
            <div className="h-full overflow-auto p-6 lg:p-8">
                <div className="mx-auto max-w-7xl space-y-6">
                    <div className="text-center">
                        <h1 className="text-3xl font-semibold tracking-tight text-balance">Dashboard</h1>
                        <p className="text-sm text-muted-foreground">Loading your productivity overview...</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <Card key={i}>
                                <CardContent className="p-6">
                                    <div className="animate-pulse">
                                        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                                        <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                                        <div className="h-3 bg-muted rounded w-1/3"></div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    // Calculate analytics summary
    const completedTasks = safeTasks.filter(task => task.completed).length
    const pendingTasks = safeTasks.filter(task => !task.completed).length
    const totalTasks = safeTasks.length
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    // Get all tasks (since we have a scrollable container)
    const allTasks = safeTasks

    // Calculate real analytics data from user's tasks
    const analyticsData = {
        tasksCompleted: completedTasks,
        focusSessions: Math.floor(completedTasks * 1.5), // Estimate based on completed tasks
        focusTime: Math.round((completedTasks * 0.5) * 10) / 10, // Estimate focus time in hours
        productivity: completionRate,
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const togglePomodoro = () => {
        setIsPomodoroActive(!isPomodoroActive)
    }

    return (
        <div className="h-full overflow-auto p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-3xl font-semibold tracking-tight text-balance">Dashboard</h1>
                    <p className="text-sm text-muted-foreground">Your productivity overview</p>
                </div>

                {/* Analytics Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Tasks Completed</p>
                                    <p className="text-2xl font-bold">{analyticsData.tasksCompleted}</p>
                                    <p className="text-xs text-green-600 flex items-center gap-1">
                                        <TrendingUp className="h-3 w-3" />
                                        {completionRate}% completion rate
                                    </p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                                    <CheckSquare className="h-6 w-6 text-green-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Focus Sessions</p>
                                    <p className="text-2xl font-bold">{analyticsData.focusSessions}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Based on completed tasks
                                    </p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                                    <Clock className="h-6 w-6 text-blue-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Focus Time</p>
                                    <p className="text-2xl font-bold">{analyticsData.focusTime}h</p>
                                    <p className="text-xs text-muted-foreground">
                                        Estimated from tasks
                                    </p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                                    <Target className="h-6 w-6 text-orange-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Productivity</p>
                                    <p className="text-2xl font-bold">{analyticsData.productivity}%</p>
                                    <p className="text-xs text-muted-foreground">
                                        Task completion rate
                                    </p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                                    <TrendingUp className="h-6 w-6 text-purple-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pomodoro Timer Widget */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div>
                                <CardTitle>Pomodoro Timer</CardTitle>
                                <CardDescription>Focus session timer</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => onNavigate('pomodoro')}>
                                <ArrowRight className="h-4 w-4 mr-2" />
                                View All
                            </Button>
                        </CardHeader>
                        <CardContent className="p-8 lg:p-12">
                            <div className="space-y-8">
                                {/* Mode indicator */}
                                <div className="flex justify-center">
                                    <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                                        <Play className="h-4 w-4" />
                                        Focus Time
                                    </div>
                                </div>

                                {/* Timer display */}
                                <div className="relative">
                                    <div className="flex justify-center">
                                        <div className="text-center">
                                            <div className="font-mono text-6xl font-bold tabular-nums tracking-tight lg:text-7xl">
                                                {formatTime(pomodoroTime)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="mt-6 h-2 overflow-hidden rounded-full bg-muted">
                                        <div
                                            className="h-full bg-primary transition-all duration-1000"
                                            style={{ width: `${((25 * 60 - pomodoroTime) / (25 * 60)) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Controls */}
                                <div className="flex justify-center">
                                    <Button onClick={togglePomodoro} size="lg" className="gap-2 px-8">
                                        {isPomodoroActive ? (
                                            <>
                                                <Pause className="h-5 w-5" />
                                                Pause
                                            </>
                                        ) : (
                                            <>
                                                <Play className="h-5 w-5" />
                                                Start
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* All Tasks Widget */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div>
                                <CardTitle>All Tasks</CardTitle>
                                <CardDescription>Your complete task list</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => onNavigate('tasks')}>
                                <ArrowRight className="h-4 w-4 mr-2" />
                                View All
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="max-h-80 overflow-y-auto space-y-3">
                                {allTasks.length === 0 ? (
                                    <div className="text-center py-8">
                                        <CheckSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                        <p className="text-muted-foreground mb-4">No tasks yet</p>
                                        <Button onClick={() => onNavigate('tasks')} className="gap-2">
                                            <Plus className="h-4 w-4" />
                                            Create Task
                                        </Button>
                                    </div>
                                ) : (
                                    allTasks.map((task) => (
                                        <div key={task._id.toString()} className="flex items-center justify-between p-3 rounded-lg border">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-2 w-2 rounded-full ${task.completed ? 'bg-green-500' : 'bg-gray-300'}`} />
                                                <div>
                                                    <p className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                                                        {task.title}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {task.priority} priority
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge variant={task.completed ? "secondary" : "default"}>
                                                {task.completed ? "Done" : "Pending"}
                                            </Badge>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>Jump to different sections</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Button
                                variant="outline"
                                className="h-20 flex-col gap-2"
                                onClick={() => onNavigate('tasks')}
                            >
                                <CheckSquare className="h-6 w-6" />
                                <span>Manage Tasks</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-20 flex-col gap-2"
                                onClick={() => onNavigate('pomodoro')}
                            >
                                <Clock className="h-6 w-6" />
                                <span>Pomodoro Timer</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-20 flex-col gap-2"
                                onClick={() => onNavigate('analytics')}
                            >
                                <BarChart3 className="h-6 w-6" />
                                <span>View Analytics</span>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
