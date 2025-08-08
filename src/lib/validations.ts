import { z } from 'zod';

export const taskFormSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
    description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
    dueDate: z.date().optional(),
    priority: z.enum(['low', 'medium', 'high']),
    tags: z.array(z.string()),
});

export const userFormSchema = z.object({
    email: z.string().email('Invalid email address'),
    name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginFormSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export const pomodoroSettingsSchema = z.object({
    workDuration: z.number().min(1).max(60).default(25),
    shortBreakDuration: z.number().min(1).max(30).default(5),
    longBreakDuration: z.number().min(1).max(60).default(15),
    sessionsUntilLongBreak: z.number().min(2).max(10).default(4),
});

export type TaskFormData = z.infer<typeof taskFormSchema>;
export type UserFormData = z.infer<typeof userFormSchema>;
export type LoginFormData = z.infer<typeof loginFormSchema>;
export type PomodoroSettings = z.infer<typeof pomodoroSettingsSchema>;