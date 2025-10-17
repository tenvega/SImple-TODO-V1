"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckSquare, Clock, Target, TrendingUp } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts"

interface AnalyticsDashboardNewProps {
  userId: string
}

// Mock data for demonstration - in real app, this would come from API
const getCurrentWeekDates = () => {
  const today = new Date()
  const currentDay = today.getDay()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - currentDay + 1) // Monday
  
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return days.map((day, index) => {
    const date = new Date(startOfWeek)
    date.setDate(startOfWeek.getDate() + index)
    return {
      day,
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      completed: Math.floor(Math.random() * 15) + 3,
      sessions: Math.floor(Math.random() * 8) + 2,
    }
  })
}

const getCurrentMonthWeeks = () => {
  const today = new Date()
  const currentWeek = Math.ceil(today.getDate() / 7)
  
  return Array.from({ length: 4 }, (_, index) => {
    const weekNum = index + 1
    const isCurrentWeek = weekNum === currentWeek
    return {
      week: `Week ${weekNum}`,
      date: isCurrentWeek ? 'This Week' : `${weekNum} weeks ago`,
      score: Math.floor(Math.random() * 20) + 70,
      isCurrent: isCurrentWeek,
    }
  })
}

const mockData = {
  summary: {
    tasksCompleted: 69,
    focusSessions: 42,
    focusTime: 17.5,
    productivity: 85,
  },
  weeklyActivity: getCurrentWeekDates(),
  productivityTrend: getCurrentMonthWeeks(),
}

export function AnalyticsDashboardNew({ userId }: AnalyticsDashboardNewProps) {
  const [data, setData] = useState(mockData)
  const [loading, setLoading] = useState(false)

  // In a real app, you would fetch data from your API here
  useEffect(() => {
    // Simulate API call
    setLoading(true)
    setTimeout(() => {
      setData(mockData)
      setLoading(false)
    }, 500)
  }, [userId])

  if (loading) {
    return (
      <div className="h-full p-6 lg:p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-balance">Analytics</h1>
            <p className="text-sm text-muted-foreground">Track your productivity and progress</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-full"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-balance">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Track your productivity and progress • {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tasks Completed</p>
                  <p className="text-2xl font-bold">{data.summary.tasksCompleted}</p>
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +12% from last week
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
                  <p className="text-2xl font-bold">{data.summary.focusSessions}</p>
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +8% from last week
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
                  <p className="text-2xl font-bold">{data.summary.focusTime}h</p>
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +15% from last week
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
                  <p className="text-2xl font-bold">{data.summary.productivity}%</p>
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +7% from last week
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Activity</CardTitle>
              <CardDescription>Tasks completed and focus sessions • This week</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.weeklyActivity} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                            <p className="font-medium text-foreground">{label} ({data.date})</p>
                            <p className="text-sm text-blue-500">
                              📋 Tasks: {data.completed}
                            </p>
                            <p className="text-sm text-green-500">
                              ⏱️ Sessions: {data.sessions}
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar 
                    dataKey="completed" 
                    fill="#3b82f6" 
                    radius={[4, 4, 0, 0]}
                    name="Tasks Completed"
                  />
                  <Bar 
                    dataKey="sessions" 
                    fill="#10b981" 
                    radius={[4, 4, 0, 0]}
                    name="Focus Sessions"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Productivity Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Productivity Trend</CardTitle>
              <CardDescription>Your productivity score over time • This month</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.productivityTrend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                  <XAxis 
                    dataKey="week" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    domain={[60, 100]}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                            <p className="font-medium text-foreground">{label}</p>
                            <p className="text-sm text-muted-foreground">{data.date}</p>
                            <p className="text-lg font-semibold text-purple-500">
                              📈 Score: {data.score}%
                            </p>
                            {data.isCurrent && (
                              <p className="text-xs text-green-500 font-medium">Current Week</p>
                            )}
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    dot={(props) => {
                      const { cx, cy, payload } = props
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={payload.isCurrent ? 6 : 4}
                          fill={payload.isCurrent ? "#8b5cf6" : "#a855f7"}
                          stroke={payload.isCurrent ? "#ffffff" : "#8b5cf6"}
                          strokeWidth={payload.isCurrent ? 2 : 1}
                        />
                      )
                    }}
                    activeDot={{ r: 6, fill: "#8b5cf6", stroke: "#ffffff", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
