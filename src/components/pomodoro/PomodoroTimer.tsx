"use client";

import React from 'react';
import { Play, Pause, Square, RotateCcw, Coffee, Clock } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { usePomodoro } from '@/contexts/PomodoroContext';
import { cn } from '@/lib/utils';

export function PomodoroTimer() {
    const {
        state,
        startWorkSession,
        startBreakSession,
        pauseSession,
        resumeSession,
        stopSession,
        getNextSessionType,
        formatTime,
    } = usePomodoro();

    const { currentSession, isActive, isPaused, completedSessions, currentTask, settings } = state;

    const getSessionTypeInfo = (type: 'work' | 'short-break' | 'long-break') => {
        switch (type) {
            case 'work':
                return {
                    label: 'Work Session',
                    color: 'bg-red-500',
                    icon: Clock,
                    description: 'Focus time!'
                };
            case 'short-break':
                return {
                    label: 'Short Break',
                    color: 'bg-green-500',
                    icon: Coffee,
                    description: 'Take a quick break'
                };
            case 'long-break':
                return {
                    label: 'Long Break',
                    color: 'bg-blue-500',
                    icon: Coffee,
                    description: 'Time for a longer rest'
                };
        }
    };

    const getProgressPercentage = () => {
        if (!currentSession) return 0;
        const elapsed = currentSession.duration - currentSession.remainingTime;
        return (elapsed / currentSession.duration) * 100;
    };

    const handleStartWork = () => {
        startWorkSession(currentTask || undefined);
    };

    const handleStartBreak = () => {
        const nextType = getNextSessionType();
        startBreakSession(nextType === 'long-break');
    };

    const handleToggleTimer = () => {
        if (isPaused) {
            resumeSession();
        } else {
            pauseSession();
        }
    };

    const sessionInfo = currentSession ? getSessionTypeInfo(currentSession.type) : null;
    const SessionIcon = sessionInfo?.icon || Clock;

    return (
        <Card className="w-full">
            <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-xl">
                    <Clock className="h-5 w-5" />
                    Pomodoro Timer
                </CardTitle>
                {completedSessions > 0 && (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                            {completedSessions} sessions completed
                        </Badge>
                        <span>•</span>
                        <span>Next long break in {settings.sessionsUntilLongBreak - (completedSessions % settings.sessionsUntilLongBreak)} sessions</span>
                    </div>
                )}
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Current Session Info */}
                {currentSession && (
                    <div className="text-center space-y-2">
                        <div className="flex items-center justify-center gap-2">
                            <div className={cn("w-3 h-3 rounded-full", sessionInfo?.color)} />
                            <span className="font-medium">{sessionInfo?.label}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{sessionInfo?.description}</p>
                        {currentTask && currentSession.type === 'work' && (
                            <div className="bg-muted p-2 rounded-lg">
                                <p className="text-sm font-medium">Working on:</p>
                                <p className="text-sm text-muted-foreground">{currentTask.title}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Timer Display */}
                <div className="text-center">
                    <div className="text-6xl font-mono font-bold mb-4">
                        {currentSession ? formatTime(currentSession.remainingTime) : '25:00'}
                    </div>

                    {currentSession && (
                        <div className="space-y-2">
                            <Progress
                                value={getProgressPercentage()}
                                className="h-2"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>0:00</span>
                                <span>{formatTime(currentSession.duration)}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="space-y-4">
                    {!currentSession ? (
                        // Not running - show start options
                        <div className="grid grid-cols-2 gap-3">
                            <Button onClick={handleStartWork} className="flex items-center gap-2">
                                <Play className="h-4 w-4" />
                                Start Work
                            </Button>
                            <Button onClick={() => startBreakSession(false)} variant="outline" className="flex items-center gap-2">
                                <Coffee className="h-4 w-4" />
                                Start Break
                            </Button>
                        </div>
                    ) : (
                        // Running - show controls
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    onClick={handleToggleTimer}
                                    variant={isPaused ? "default" : "outline"}
                                    className="flex items-center gap-2"
                                >
                                    {isPaused ? (
                                        <>
                                            <Play className="h-4 w-4" />
                                            Resume
                                        </>
                                    ) : (
                                        <>
                                            <Pause className="h-4 w-4" />
                                            Pause
                                        </>
                                    )}
                                </Button>

                                <Button
                                    onClick={stopSession}
                                    variant="outline"
                                    className="flex items-center gap-2"
                                >
                                    <Square className="h-4 w-4" />
                                    Stop
                                </Button>
                            </div>

                            {/* Session completed - show next session option */}
                            {currentSession.remainingTime === 0 && (
                                <div className="pt-2 border-t">
                                    <Button
                                        onClick={currentSession.type === 'work' ? handleStartBreak : handleStartWork}
                                        className="w-full flex items-center gap-2"
                                    >
                                        {currentSession.type === 'work' ? (
                                            <>
                                                <Coffee className="h-4 w-4" />
                                                Start {getNextSessionType() === 'long-break' ? 'Long' : 'Short'} Break
                                            </>
                                        ) : (
                                            <>
                                                <Clock className="h-4 w-4" />
                                                Start Work Session
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Session Pattern Indicator */}
                <div className="flex justify-center space-x-1 pt-4 border-t">
                    {Array.from({ length: settings.sessionsUntilLongBreak }, (_, index) => (
                        <div
                            key={index}
                            className={cn(
                                "w-3 h-3 rounded-full border-2",
                                index < (completedSessions % settings.sessionsUntilLongBreak)
                                    ? "bg-red-500 border-red-500"
                                    : "border-gray-300"
                            )}
                        />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}