"use client"

import { Card } from "@/components/ui/card"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { TrendingUp, CheckCircle2, Clock, Target } from "lucide-react"

const weeklyData = [
  { day: "Mon", completed: 12, focused: 4 },
  { day: "Tue", completed: 8, focused: 3 },
  { day: "Wed", completed: 15, focused: 5 },
  { day: "Thu", completed: 10, focused: 4 },
  { day: "Fri", completed: 14, focused: 6 },
  { day: "Sat", completed: 6, focused: 2 },
  { day: "Sun", completed: 4, focused: 1 },
]

const productivityData = [
  { week: "Week 1", score: 65 },
  { week: "Week 2", score: 72 },
  { week: "Week 3", score: 78 },
  { week: "Week 4", score: 85 },
]

export function AnalyticsDashboard() {
  return (
    <div className="h-full overflow-auto p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-balance">Analytics</h1>
          <p className="text-sm text-muted-foreground">Track your productivity and progress</p>
        </div>

        {/* Stats grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Tasks Completed</p>
                <p className="text-2xl font-bold">69</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-2/10">
                <CheckCircle2 className="h-6 w-6 text-chart-2" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs text-chart-2">
              <TrendingUp className="h-3 w-3" />
              <span>+12% from last week</span>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Focus Sessions</p>
                <p className="text-2xl font-bold">42</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Clock className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs text-chart-2">
              <TrendingUp className="h-3 w-3" />
              <span>+8% from last week</span>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Focus Time</p>
                <p className="text-2xl font-bold">17.5h</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-3/10">
                <Target className="h-6 w-6 text-chart-3" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs text-chart-2">
              <TrendingUp className="h-3 w-3" />
              <span>+15% from last week</span>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Productivity</p>
                <p className="text-2xl font-bold">85%</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-4/10">
                <TrendingUp className="h-6 w-6 text-chart-4" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs text-chart-2">
              <TrendingUp className="h-3 w-3" />
              <span>+7% from last week</span>
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Weekly Activity</h3>
                <p className="text-sm text-muted-foreground">Tasks completed and focus sessions</p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="day" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                  />
                  <Bar dataKey="completed" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="focused" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Productivity Trend</h3>
                <p className="text-sm text-muted-foreground">Your productivity score over time</p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={productivityData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="week" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
