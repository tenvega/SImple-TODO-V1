"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckSquare, Clock, Target, TrendingUp } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface AnalyticsDashboardNewProps {
  userId: string
}

// Mock data for demonstration - in real app, this would come from API
const getWeekDates = (weeksAgo = 0) => {
  const today = new Date()
  const targetDate = new Date(today)
  targetDate.setDate(today.getDate() - (weeksAgo * 7))

  const currentDay = targetDate.getDay()
  const startOfWeek = new Date(targetDate)
  startOfWeek.setDate(targetDate.getDate() - currentDay + 1) // Monday

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

const getMonthWeeks = (monthsAgo = 0) => {
  const today = new Date()
  const targetDate = new Date(today)
  targetDate.setMonth(today.getMonth() - monthsAgo)

  const currentMonth = targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  // Simple approach: divide the month into 4 weeks based on day ranges
  const dayOfMonth = targetDate.getDate()
  let currentWeek = 1

  if (dayOfMonth <= 7) {
    currentWeek = 1
  } else if (dayOfMonth <= 14) {
    currentWeek = 2
  } else if (dayOfMonth <= 21) {
    currentWeek = 3
  } else {
    currentWeek = 4
  }

  return Array.from({ length: 4 }, (_, index) => {
    const weekNum = index + 1
    const isCurrentWeek = weekNum === currentWeek && monthsAgo === 0

    // Create proper date labels for each week
    let dateLabel = ''
    if (isCurrentWeek) {
      dateLabel = 'This Week'
    } else if (monthsAgo === 0) {
      // For the current month, show week ranges
      const startDay = (weekNum - 1) * 7 + 1
      const endDay = Math.min(weekNum * 7, new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate())
      dateLabel = `Days ${startDay}-${endDay}`
    } else {
      // For past months, show week ranges
      const startDay = (weekNum - 1) * 7 + 1
      const endDay = Math.min(weekNum * 7, new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate())
      dateLabel = `Days ${startDay}-${endDay}`
    }

    return {
      week: `Week ${weekNum}`,
      date: dateLabel,
      month: currentMonth,
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
  weeklyActivity: getWeekDates(0),
  productivityTrend: getMonthWeeks(0),
}

export function AnalyticsDashboardNew({ }: AnalyticsDashboardNewProps) {
  const [data, setData] = useState(mockData)
  const [loading, setLoading] = useState(false)
  const [selectedWeek, setSelectedWeek] = useState("0")
  const [selectedMonth, setSelectedMonth] = useState("0")

  // Generate week options (last 8 weeks)
  const weekOptions = Array.from({ length: 8 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (index * 7))
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - date.getDay() + 1) // Monday
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6) // Sunday

    return {
      value: index.toString(),
      label: index === 0
        ? "This Week"
        : `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    }
  })

  // Generate month options (last 6 months)
  const monthOptions = Array.from({ length: 6 }, (_, index) => {
    const date = new Date()
    date.setMonth(date.getMonth() - index)
    return {
      value: index.toString(),
      label: index === 0
        ? "This Month"
        : date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }
  })

  // Update data when dropdowns change
  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      setData({
        ...mockData,
        weeklyActivity: getWeekDates(parseInt(selectedWeek)),
        productivityTrend: getMonthWeeks(parseInt(selectedMonth)),
      })
      setLoading(false)
    }, 300)
  }, [selectedWeek, selectedMonth])

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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Weekly Activity</CardTitle>
                  <CardDescription>Tasks completed and focus sessions</CardDescription>
                </div>
                <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {weekOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                        // Convert to month/day/year format
                        const dateObj = new Date(data.date + ', ' + new Date().getFullYear())
                        const formattedDate = dateObj.toLocaleDateString('en-US', {
                          month: 'numeric',
                          day: 'numeric',
                          year: 'numeric'
                        })
                        return (
                          <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                            <p className="font-medium text-foreground">{label} ({formattedDate})</p>
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Productivity Trend</CardTitle>
                  <CardDescription>Your productivity score over time</CardDescription>
                </div>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.productivityTrend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                            <p className="text-sm text-muted-foreground">{data.date} • {data.month}</p>
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
                  <Bar 
                    dataKey="score" 
                    fill="#8b5cf6" 
                    radius={[4, 4, 0, 0]}
                    name="Productivity Score"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
