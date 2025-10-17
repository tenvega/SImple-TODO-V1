"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Play, Pause, RotateCcw, Coffee } from "lucide-react"

export function PomodoroTimerNew() {
  const [minutes, setMinutes] = useState(25)
  const [seconds, setSeconds] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [isBreak, setIsBreak] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isActive) {
      interval = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            setIsActive(false)
            // Timer completed
            if (isBreak) {
              setMinutes(25)
              setIsBreak(false)
            } else {
              setMinutes(5)
              setIsBreak(true)
            }
          } else {
            setMinutes(minutes - 1)
            setSeconds(59)
          }
        } else {
          setSeconds(seconds - 1)
        }
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, minutes, seconds, isBreak])

  const toggleTimer = () => {
    setIsActive(!isActive)
  }

  const resetTimer = () => {
    setIsActive(false)
    setMinutes(isBreak ? 5 : 25)
    setSeconds(0)
  }

  const startBreak = () => {
    setIsActive(false)
    setIsBreak(true)
    setMinutes(5)
    setSeconds(0)
  }

  const startFocus = () => {
    setIsActive(false)
    setIsBreak(false)
    setMinutes(25)
    setSeconds(0)
  }

  const progress = isBreak
    ? ((5 * 60 - (minutes * 60 + seconds)) / (5 * 60)) * 100
    : ((25 * 60 - (minutes * 60 + seconds)) / (25 * 60)) * 100

  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-balance">Pomodoro Timer</h1>
          <p className="text-sm text-muted-foreground">Stay focused with the Pomodoro Technique</p>
        </div>

        {/* Timer card */}
        <Card className="p-8 lg:p-12">
          <div className="space-y-8">
            {/* Mode indicator */}
            <div className="flex justify-center">
              <div
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
                  isBreak ? "bg-chart-2/10 text-chart-2" : "bg-primary/10 text-primary"
                }`}
              >
                {isBreak ? (
                  <>
                    <Coffee className="h-4 w-4" />
                    Break Time
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Focus Time
                  </>
                )}
              </div>
            </div>

            {/* Timer display */}
            <div className="relative">
              <div className="flex justify-center">
                <div className="text-center">
                  <div className="font-mono text-8xl font-bold tabular-nums tracking-tight lg:text-9xl">
                    {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-8 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full transition-all duration-1000 ${isBreak ? "bg-chart-2" : "bg-primary"}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap justify-center gap-3">
              <Button size="lg" onClick={toggleTimer} className="gap-2 px-8">
                {isActive ? (
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
              <Button size="lg" variant="outline" onClick={resetTimer} className="gap-2 bg-transparent">
                <RotateCcw className="h-5 w-5" />
                Reset
              </Button>
            </div>

            {/* Mode switchers */}
            <div className="flex justify-center gap-3">
              <Button variant={!isBreak ? "secondary" : "ghost"} onClick={startFocus} disabled={isActive}>
                Focus (25m)
              </Button>
              <Button variant={isBreak ? "secondary" : "ghost"} onClick={startBreak} disabled={isActive}>
                Break (5m)
              </Button>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold">8</div>
              <div className="text-sm text-muted-foreground">Today</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold">42</div>
              <div className="text-sm text-muted-foreground">This Week</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold">3.5h</div>
              <div className="text-sm text-muted-foreground">Focus Time</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
