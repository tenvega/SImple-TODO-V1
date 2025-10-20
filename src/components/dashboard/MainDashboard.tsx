"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CheckSquare, Clock, Target, TrendingUp, Play, Pause, Plus, ArrowRight, BarChart3, Coffee } from "lucide-react"
import { useTask } from "@/contexts/TaskContext"
import { TaskForm } from "@/components/task/TaskForm"
import { Task } from "@/types"

interface MainDashboardProps {
    onNavigate: (view: string) => void
}

export function MainDashboard({ onNavigate }: MainDashboardProps) {
    const { state, fetchTasks } = useTask()
    const [pomodoroTime, setPomodoroTime] = useState(25 * 60) // 25 minutes in seconds
    const [isPomodoroActive, setIsPomodoroActive] = useState(false)
    const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)

    // Extract tasks and loading from state
    const { tasks, loading } = state

    // Tasks are automatically fetched by TaskContext when user ID changes
    // No need to manually fetch here to prevent duplicate calls

    // Ensure tasks is an array with fallback
    const safeTasks = tasks || []

    // Timer effect - moved to top to avoid early return issues
    useEffect(() => {
        let interval: NodeJS.Timeout

        if (isPomodoroActive && pomodoroTime > 0) {
            interval = setInterval(() => {
                setPomodoroTime((prev) => {
                    if (prev <= 1) {
                        setIsPomodoroActive(false)
                        return 25 * 60 // Reset to 25 minutes
                    }
                    return prev - 1
                })
            }, 1000)
        }

        return () => {
            if (interval) clearInterval(interval)
        }
    }, [isPomodoroActive, pomodoroTime])

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
                    <p className="text-sm text-muted-foreground">
                        {loading ? "Loading your productivity overview..." : "Your productivity overview"}
                    </p>
                </div>

                {/* Loading State */}
                {loading && (
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
                )}

                {/* Main Content - only show when not loading */}
                {!loading && (
                    <div className="space-y-6">
                        {/* Analytics Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                                                <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
                                                    <DialogTrigger asChild>
                                                        <Button className="gap-2">
                                                            <Plus className="h-4 w-4" />
                                                            Create Task
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                                        <DialogHeader>
                                                            <DialogTitle>Create New Task</DialogTitle>
                                                        </DialogHeader>
                                                        <TaskForm onClose={() => setIsCreateTaskOpen(false)} />
                                                    </DialogContent>
                                                </Dialog>
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

                        {/* Production Features Info */}
                        <Card className="border-blue-200 dark:border-blue-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                    <Target className="h-5 w-5" />
                                    Production Features
                                </CardTitle>
                                <CardDescription>
                                    Features that would be available in a production application
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                                    <h4 className="font-medium mb-2 text-blue-900 dark:text-blue-100">Email Notifications</h4>
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        In production, users would receive email notifications for task reminders, daily summaries,
                                        weekly reports, and Pomodoro session completions. This demo shows the UI/UX for notification settings.
                                    </p>
                                </div>
                                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                                    <h4 className="font-medium mb-2 text-green-900 dark:text-green-100">Real-time Collaboration</h4>
                                    <p className="text-sm text-green-700 dark:text-green-300">
                                        Production apps would include real-time task sharing, team collaboration,
                                        and live updates when team members complete tasks or start Pomodoro sessions.
                                    </p>
                                </div>
                                <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                                    <h4 className="font-medium mb-2 text-purple-900 dark:text-purple-100">Advanced Analytics</h4>
                                    <p className="text-sm text-purple-700 dark:text-purple-300">
                                        Enhanced analytics would include productivity trends, time tracking insights,
                                        team performance metrics, and AI-powered productivity recommendations.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                                <CardDescription>Jump to different sections</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                )}
            </div>
        </div>
    )
}
