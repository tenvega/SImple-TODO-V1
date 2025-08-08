"use client";

import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { Task, TaskFilters, CreateTaskData } from '@/types';
import { toast } from 'sonner';

interface TaskState {
    tasks: Task[];
    filteredTasks: Task[];
    loading: boolean;
    error: string | null;
    filters: TaskFilters;
    currentUserId: string | null;
}

type TaskAction =
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'SET_TASKS'; payload: Task[] }
    | { type: 'ADD_TASK'; payload: Task }
    | { type: 'UPDATE_TASK'; payload: Task }
    | { type: 'DELETE_TASK'; payload: string }
    | { type: 'SET_FILTERS'; payload: TaskFilters }
    | { type: 'SET_USER_ID'; payload: string };

const initialState: TaskState = {
    tasks: [],
    filteredTasks: [],
    loading: false,
    error: null,
    filters: {},
    currentUserId: null,
};

function taskReducer(state: TaskState, action: TaskAction): TaskState {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload, loading: false };
        case 'SET_TASKS': {
            const filteredTasks = applyFilters(action.payload, state.filters);
            return { ...state, tasks: action.payload, filteredTasks, loading: false, error: null };
        }
        case 'ADD_TASK': {
            const newTasks = [action.payload, ...state.tasks];
            const filteredTasks = applyFilters(newTasks, state.filters);
            return { ...state, tasks: newTasks, filteredTasks };
        }
        case 'UPDATE_TASK': {
            const updatedTasks = state.tasks.map(task =>
                task._id.toString() === action.payload._id.toString() ? action.payload : task
            );
            const filteredTasks = applyFilters(updatedTasks, state.filters);
            return { ...state, tasks: updatedTasks, filteredTasks };
        }
        case 'DELETE_TASK': {
            const filteredTaskList = state.tasks.filter(task => task._id.toString() !== action.payload);
            const filteredTasks = applyFilters(filteredTaskList, state.filters);
            return { ...state, tasks: filteredTaskList, filteredTasks };
        }
        case 'SET_FILTERS': {
            const filteredTasks = applyFilters(state.tasks, action.payload);
            return { ...state, filters: action.payload, filteredTasks };
        }
        case 'SET_USER_ID':
            return { ...state, currentUserId: action.payload };
        default:
            return state;
    }
}

function applyFilters(tasks: Task[], filters: TaskFilters): Task[] {
    return tasks.filter(task => {
        if (filters.completed !== undefined && task.completed !== filters.completed) return false;
        if (filters.priority && task.priority !== filters.priority) return false;
        if (filters.tag && !task.tags.includes(filters.tag)) return false;
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            return task.title.toLowerCase().includes(searchLower) ||
                (task.description?.toLowerCase().includes(searchLower));
        }
        return true;
    });
}

const TaskContext = createContext<{
    state: TaskState;
    fetchTasks: () => Promise<void>;
    createTask: (taskData: CreateTaskData) => Promise<void>;
    updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
    setFilters: (filters: TaskFilters) => void;
    setUserId: (userId: string) => void;
} | null>(null);

export function TaskProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(taskReducer, initialState);

    const fetchTasks = useCallback(async () => {
        if (!state.currentUserId) return;

        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const params = new URLSearchParams({ userId: state.currentUserId });
            const response = await fetch(`/api/tasks?${params}`);

            if (!response.ok) throw new Error('Failed to fetch tasks');

            const tasks = await response.json();
            dispatch({ type: 'SET_TASKS', payload: tasks });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch tasks' });
            toast.error('Failed to fetch tasks');
        }
    }, [state.currentUserId]);

    const createTask = useCallback(async (taskData: CreateTaskData) => {
        if (!state.currentUserId) return;

        try {
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...taskData, userId: state.currentUserId }),
            });

            if (!response.ok) throw new Error('Failed to create task');

            const newTask = await response.json();
            dispatch({ type: 'ADD_TASK', payload: newTask });
            toast.success('Task created successfully!');
        } catch (error) {
            toast.error('Failed to create task');
        }
    }, [state.currentUserId]);

    const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
        try {
            const response = await fetch(`/api/tasks/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });

            if (!response.ok) throw new Error('Failed to update task');

            const updatedTask = await response.json();
            dispatch({ type: 'UPDATE_TASK', payload: updatedTask });
            toast.success('Task updated successfully!');
        } catch (error) {
            toast.error('Failed to update task');
        }
    }, []);

    const deleteTask = useCallback(async (id: string) => {
        try {
            const response = await fetch(`/api/tasks/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete task');

            dispatch({ type: 'DELETE_TASK', payload: id });
            toast.success('Task deleted successfully!');
        } catch (error) {
            toast.error('Failed to delete task');
        }
    }, []);

    const setFilters = useCallback((filters: TaskFilters) => {
        dispatch({ type: 'SET_FILTERS', payload: filters });
    }, []);

    const setUserId = useCallback((userId: string) => {
        dispatch({ type: 'SET_USER_ID', payload: userId });
    }, []);

    // Fetch tasks when user ID changes
    useEffect(() => {
        if (state.currentUserId) {
            fetchTasks();
        }
    }, [state.currentUserId, fetchTasks]);

    return (
        <TaskContext.Provider value={{
            state,
            fetchTasks,
            createTask,
            updateTask,
            deleteTask,
            setFilters,
            setUserId,
        }}>
            {children}
        </TaskContext.Provider>
    );
}

export function useTask() {
    const context = useContext(TaskContext);
    if (!context) {
        throw new Error('useTask must be used within a TaskProvider');
    }
    return context;
}