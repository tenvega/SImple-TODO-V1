"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, Plus, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { taskFormSchema, TaskFormData } from '@/lib/validations';
import { useTask } from '@/contexts/TaskContext';

interface TaskFormProps {
    onClose?: () => void;
    initialData?: Partial<TaskFormData>;
    isEditing?: boolean;
    taskId?: string;
}

export function TaskForm({ onClose, initialData, isEditing = false, taskId }: TaskFormProps) {
    const { createTask, updateTask } = useTask();
    const [newTag, setNewTag] = useState('');
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

    const watchedTags = form.watch('tags');

    const onSubmit = async (data: TaskFormData) => {
        setIsSubmitting(true);
        try {
            if (isEditing && taskId) {
                await updateTask(taskId, data);
            } else {
                // Create a complete task object with required fields
                const taskData = {
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

    const addTag = () => {
        if (newTag.trim() && !watchedTags.includes(newTag.trim())) {
            form.setValue('tags', [...watchedTags, newTag.trim()]);
            setNewTag('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        form.setValue('tags', watchedTags.filter(tag => tag !== tagToRemove));
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag();
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
                                        <FormLabel>Due Date</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="datetime-local"
                                                {...field}
                                                value={field.value ? format(field.value, "yyyy-MM-dd'T'HH:mm") : ''}
                                                onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
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

                        <div className="space-y-2">
                            <FormLabel>Tags</FormLabel>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Add a tag..."
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                />
                                <Button type="button" onClick={addTag} size="sm">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            {watchedTags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {watchedTags.map((tag) => (
                                        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                                            {tag}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-auto p-0 ml-1"
                                                onClick={() => removeTag(tag)}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>

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