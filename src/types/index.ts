import { Document, ObjectId } from 'mongoose';

export interface User extends Document {
    _id: ObjectId;
    email: string;
    name: string;
    password: string;
    createdAt: Date;
}

export interface Task extends Document {
    _id: ObjectId;
    userId: ObjectId;
    title: string;
    description?: string;
    createdDate: Date;
    dueDate?: Date;
    completed: boolean;
    completedDate?: Date;
    priority: 'low' | 'medium' | 'high';
    tags: string[];
    timeSpent: number;
    pomodoroCount: number;
}

export interface TimeTracking extends Document {
    _id: ObjectId;
    userId: ObjectId;
    taskId?: ObjectId;
    startTime: Date;
    endTime?: Date;
    duration: number;
    type: 'pomodoro' | 'manual';
}

export interface PomodoroSession {
    id: string;
    taskId?: string;
    type: 'work' | 'short-break' | 'long-break';
    duration: number;
    remainingTime: number;
    isActive: boolean;
    isPaused: boolean;
    cycleCount: number;
}

export interface TaskFormData {
    title: string;
    description?: string;
    dueDate?: Date;
    priority: 'low' | 'medium' | 'high';
    tags: string[];
}

export interface TaskFilters {
    completed?: boolean;
    priority?: 'low' | 'medium' | 'high';
    tag?: string;
    search?: string;
}

export type CreateTaskData = {
    title: string;
    description?: string;
    dueDate?: Date;
    priority: 'low' | 'medium' | 'high';
    tags: string[];
    completed: boolean;
    timeSpent: number;
    pomodoroCount: number;
};