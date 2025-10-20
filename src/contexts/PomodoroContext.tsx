"use client";

import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { PomodoroSession, Task } from '@/types';
import { toast } from 'sonner';

interface PomodoroSettings {
    workDuration: number; // in minutes
    shortBreakDuration: number;
    longBreakDuration: number;
    sessionsUntilLongBreak: number;
}

interface PomodoroState {
    currentSession: PomodoroSession | null;
    settings: PomodoroSettings;
    isActive: boolean;
    isPaused: boolean;
    completedSessions: number;
    currentTask: Task | null;
}

type PomodoroAction =
    | { type: 'START_SESSION'; payload: { type: 'work' | 'short-break' | 'long-break'; task?: Task } }
    | { type: 'PAUSE_SESSION' }
    | { type: 'RESUME_SESSION' }
    | { type: 'STOP_SESSION' }
    | { type: 'TICK' }
    | { type: 'COMPLETE_SESSION' }
    | { type: 'UPDATE_SETTINGS'; payload: Partial<PomodoroSettings> }
    | { type: 'SET_TASK'; payload: Task | null };

const defaultSettings: PomodoroSettings = {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
};

const initialState: PomodoroState = {
    currentSession: null,
    settings: defaultSettings,
    isActive: false,
    isPaused: false,
    completedSessions: 0,
    currentTask: null,
};

function pomodoroReducer(state: PomodoroState, action: PomodoroAction): PomodoroState {
    switch (action.type) {
        case 'START_SESSION': {
            const duration = getDurationByType(action.payload.type, state.settings);
            const newSession: PomodoroSession = {
                id: Date.now().toString(),
                type: action.payload.type,
                duration: duration * 60, // convert to seconds
                remainingTime: duration * 60,
                isActive: true,
                isPaused: false,
                cycleCount: state.completedSessions,
                taskId: action.payload.task?._id.toString(),
            };

            return {
                ...state,
                currentSession: newSession,
                isActive: true,
                isPaused: false,
                currentTask: action.payload.task || state.currentTask,
            };
        }

        case 'PAUSE_SESSION':
            return {
                ...state,
                isPaused: true,
                isActive: false,
                currentSession: state.currentSession ? {
                    ...state.currentSession,
                    isActive: false,
                    isPaused: true,
                } : null,
            };

        case 'RESUME_SESSION':
            return {
                ...state,
                isPaused: false,
                isActive: true,
                currentSession: state.currentSession ? {
                    ...state.currentSession,
                    isActive: true,
                    isPaused: false,
                } : null,
            };

        case 'STOP_SESSION':
            return {
                ...state,
                currentSession: null,
                isActive: false,
                isPaused: false,
            };

        case 'TICK':
            if (!state.currentSession || !state.isActive) return state;

            const newRemainingTime = Math.max(0, state.currentSession.remainingTime - 1);

            if (newRemainingTime === 0) {
                // Session completed
                return {
                    ...state,
                    currentSession: {
                        ...state.currentSession,
                        remainingTime: 0,
                        isActive: false,
                    },
                    isActive: false,
                };
            }

            return {
                ...state,
                currentSession: {
                    ...state.currentSession,
                    remainingTime: newRemainingTime,
                },
            };

        case 'COMPLETE_SESSION': {
            const newCompletedSessions = state.currentSession?.type === 'work'
                ? state.completedSessions + 1
                : state.completedSessions;

            return {
                ...state,
                completedSessions: newCompletedSessions,
                currentSession: null,
                isActive: false,
                isPaused: false,
            };
        }

        case 'UPDATE_SETTINGS':
            return {
                ...state,
                settings: { ...state.settings, ...action.payload },
            };

        case 'SET_TASK':
            return {
                ...state,
                currentTask: action.payload,
            };

        default:
            return state;
    }
}

function getDurationByType(type: 'work' | 'short-break' | 'long-break', settings: PomodoroSettings): number {
    switch (type) {
        case 'work': return settings.workDuration;
        case 'short-break': return settings.shortBreakDuration;
        case 'long-break': return settings.longBreakDuration;
        default: return settings.workDuration;
    }
}

const PomodoroContext = createContext<{
    state: PomodoroState;
    startWorkSession: (task?: Task) => void;
    startBreakSession: (isLong?: boolean) => void;
    pauseSession: () => void;
    resumeSession: () => void;
    stopSession: () => void;
    completeSession: () => void;
    updateSettings: (settings: Partial<PomodoroSettings>) => void;
    loadUserSettings: (userId: string) => Promise<void>;
    setCurrentTask: (task: Task | null) => void;
    getNextSessionType: () => 'work' | 'short-break' | 'long-break';
    formatTime: (seconds: number) => string;
} | null>(null);

export function PomodoroProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(pomodoroReducer, initialState);

    // Timer tick effect
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (state.isActive && state.currentSession) {
            interval = setInterval(() => {
                dispatch({ type: 'TICK' });
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [state.isActive]);

    const handleSessionComplete = useCallback(() => {
        if (!state.currentSession) return;

        const sessionType = state.currentSession.type;

        // Show completion notification
        if (sessionType === 'work') {
            toast.success('Work session completed! Time for a break.');
        } else {
            toast.success('Break time is over! Ready to focus?');
        }

        // Play notification sound (browser notification)
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`${sessionType === 'work' ? 'Work' : 'Break'} session completed!`);
        }

        dispatch({ type: 'COMPLETE_SESSION' });
    }, [state.currentSession, dispatch]);

    // Session completion effect
    useEffect(() => {
        if (state.currentSession && state.currentSession.remainingTime === 0 && !state.isActive) {
            handleSessionComplete();
        }
    }, [state.currentSession?.remainingTime, state.isActive, handleSessionComplete]);

    const startWorkSession = useCallback((task?: Task) => {
        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        dispatch({ type: 'START_SESSION', payload: { type: 'work', task } });
        toast.success('Work session started! Stay focused.');
    }, []);

    const startBreakSession = useCallback((isLong: boolean = false) => {
        const breakType = isLong ? 'long-break' : 'short-break';
        dispatch({ type: 'START_SESSION', payload: { type: breakType } });
        toast.success(`${isLong ? 'Long' : 'Short'} break started! Take a rest.`);
    }, []);

    const pauseSession = useCallback(() => {
        dispatch({ type: 'PAUSE_SESSION' });
        toast.info('Session paused.');
    }, []);

    const resumeSession = useCallback(() => {
        dispatch({ type: 'RESUME_SESSION' });
        toast.info('Session resumed.');
    }, []);

    const stopSession = useCallback(() => {
        dispatch({ type: 'STOP_SESSION' });
        toast.info('Session stopped.');
    }, []);

    const completeSession = useCallback(() => {
        dispatch({ type: 'COMPLETE_SESSION' });
    }, []);

    const updateSettings = useCallback((settings: Partial<PomodoroSettings>) => {
        dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
    }, []);

    const loadUserSettings = useCallback(async (userId: string) => {
        try {
            const response = await fetch(`/api/users/${userId}/settings`);
            if (response.ok) {
                const userSettings = await response.json();
                if (userSettings.pomodoro) {
                    dispatch({ type: 'UPDATE_SETTINGS', payload: userSettings.pomodoro });
                }
            }
        } catch (error) {
            console.error('Error loading user settings:', error);
        }
    }, [dispatch]);

    const setCurrentTask = useCallback((task: Task | null) => {
        dispatch({ type: 'SET_TASK', payload: task });
    }, []);

    const getNextSessionType = useCallback((): 'work' | 'short-break' | 'long-break' => {
        if (!state.currentSession) return 'work';

        if (state.currentSession.type !== 'work') return 'work';

        // After work session, determine break type
        const nextCycleCount = state.completedSessions + 1;
        return nextCycleCount % state.settings.sessionsUntilLongBreak === 0
            ? 'long-break'
            : 'short-break';
    }, [state.currentSession, state.completedSessions, state.settings.sessionsUntilLongBreak]);

    const formatTime = useCallback((seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, []);

    return (
        <PomodoroContext.Provider value={{
            state,
            startWorkSession,
            startBreakSession,
            pauseSession,
            resumeSession,
            stopSession,
            completeSession,
            updateSettings,
            loadUserSettings,
            setCurrentTask,
            getNextSessionType,
            formatTime,
        }}>
            {children}
        </PomodoroContext.Provider>
    );
}

export function usePomodoro() {
    const context = useContext(PomodoroContext);
    if (!context) {
        throw new Error('usePomodoro must be used within a PomodoroProvider');
    }
    return context;
}