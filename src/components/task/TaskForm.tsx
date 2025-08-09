"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DatePicker } from '@/components/ui/date-picker';
import { TagSelector } from '@/components/ui/tag-selector';
import { taskFormSchema, TaskFormData } from '@/lib/validations';
import { useTask } from '@/contexts/TaskContext';
import { CreateTaskData } from '@/types';

interface TaskFormProps {
    onClose?: () => void;
    initialData?: Partial<TaskFormData>;
    isEditing?: boolean;
    taskId?: string;
}

export function TaskForm({ onClose, initialData, isEditing = false, taskId }: TaskFormProps) {
    const { createTask, updateTask } = useTask();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<TaskFormData>({
        resolver: zodResolver(taskFormSchema),
        defaultValues: {
            title: initialData?.title || '',
            description: initialData?.description || '',
            dueDate: initialData?.dueDate,
            priority: initialData?.priority || 'medium',
            tags: initialData?.tags || [],
        },
    });



    const onSubmit = async (data: TaskFormData) => {
        setIsSubmitting(true);
        try {
            if (isEditing && taskId) {
                await updateTask(taskId, data);
            } else {
                // Create a complete task object with required fields
                const taskData: CreateTaskData = {
                    ...data,
                    completed: false,
                    timeSpent: 0,
                    pomodoroCount: 0,
                };
                await createTask(taskData);
            }
            form.reset();
            onClose?.();
        } catch (error) {
            console.error('Error submitting task:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>{isEditing ? 'Edit Task' : 'Create New Task'}</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter task title..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Enter task description..."
                                            className="min-h-[100px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="dueDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Due Date (Optional)</FormLabel>
                                        <FormControl>
                                            <DatePicker
                                                date={field.value}
                                                onDateChange={field.onChange}
                                                placeholder="Select due date..."
                                                disablePastDates={!isEditing} // Allow past dates when editing
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="priority"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Priority</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select priority" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="low">Low</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="high">High</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="tags"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tags</FormLabel>
                                    <FormControl>
                                        <TagSelector
                                            selectedTags={field.value}
                                            onTagsChange={field.onChange}
                                            maxTags={8}
                                            placeholder="Add tags to categorize your task..."
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex gap-2 pt-4">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : (isEditing ? 'Update Task' : 'Create Task')}
                            </Button>
                            {onClose && (
                                <Button type="button" variant="outline" onClick={onClose}>
                                    Cancel
                                </Button>
                            )}
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}