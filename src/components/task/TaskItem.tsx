"use client";

import React, { useState } from 'react';
import { format, isAfter, isToday, isTomorrow } from 'date-fns';
import { Calendar, Clock, Edit, Trash2, Play, Check, MoreVertical } from 'lucide-react';
import { getTagColor, getTagCategory } from '@/lib/tagCategories';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { Task } from '@/types';
import { useTask } from '@/contexts/TaskContext';
import { cn } from '@/lib/utils';

interface TaskItemProps {
    task: Task;
    onEdit?: (task: Task) => void;
    onStartPomodoro?: (task: Task) => void;
}

export function TaskItem({ task, onEdit, onStartPomodoro }: TaskItemProps) {
    const { updateTask, deleteTask } = useTask();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const handleToggleComplete = async () => {
        await updateTask(task._id.toString(), {
            completed: !task.completed,
        });
    };

    const handleDelete = async () => {
        await deleteTask(task._id.toString());
        setShowDeleteDialog(false);
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'bg-red-100 text-red-800 border-red-200';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'low': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getDueDateDisplay = (dueDate: Date) => {
        if (isToday(dueDate)) return 'Today';
        if (isTomorrow(dueDate)) return 'Tomorrow';
        return format(dueDate, 'MMM dd, yyyy');
    };

    const isDueSoon = task.dueDate && isAfter(new Date(), task.dueDate) && !task.completed;

    return (
        <>
            <Card className={cn(
                "transition-all duration-200 hover:shadow-md",
                task.completed && "opacity-75 bg-muted/50",
                isDueSoon && "border-red-200 bg-red-50/50"
            )}>
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        {/* Completion Toggle */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "mt-1 h-6 w-6 rounded-full p-0 border-2",
                                task.completed
                                    ? "bg-green-500 border-green-500 text-white hover:bg-green-600"
                                    : "border-gray-300 hover:border-green-400"
                            )}
                            onClick={handleToggleComplete}
                        >
                            {task.completed && <Check className="h-3 w-3" />}
                        </Button>

                        {/* Task Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                                <h3 className={cn(
                                    "font-semibold text-base leading-relaxed",
                                    task.completed && "line-through text-muted-foreground"
                                )}>
                                    {task.title}
                                </h3>

                                {/* Actions Dropdown */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => onEdit?.(task)}>
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit
                                        </DropdownMenuItem>
                                        {!task.completed && onStartPomodoro && (
                                            <DropdownMenuItem onClick={() => onStartPomodoro(task)}>
                                                <Play className="h-4 w-4 mr-2" />
                                                Start Pomodoro
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem
                                            onClick={() => setShowDeleteDialog(true)}
                                            className="text-red-600 focus:text-red-600"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Description */}
                            {task.description && (
                                <p className={cn(
                                    "text-base text-muted-foreground mt-1 line-clamp-2",
                                    task.completed && "line-through"
                                )}>
                                    {task.description}
                                </p>
                            )}

                            {/* Tags */}
                            {task.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                    {task.tags.map((tag) => (
                                        <Badge
                                            key={tag}
                                            variant="outline"
                                            className="text-sm"
                                            style={{
                                                backgroundColor: `${getTagColor(tag)}15`,
                                                borderColor: getTagColor(tag),
                                                color: getTagColor(tag)
                                            }}
                                            title={`Category: ${getTagCategory(tag)}`}
                                        >
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            )}

                            {/* Footer Info */}
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                {/* Priority */}
                                <Badge
                                    variant="outline"
                                    className={cn("text-sm", getPriorityColor(task.priority))}
                                >
                                    {task.priority}
                                </Badge>

                                {/* Due Date */}
                                {task.dueDate && (
                                    <div className={cn(
                                        "flex items-center gap-1",
                                        isDueSoon && "text-red-600 font-medium"
                                    )}>
                                        <Calendar className="h-3 w-3" />
                                        {getDueDateDisplay(task.dueDate)}
                                    </div>
                                )}

                                {/* Time Tracking */}
                                {(task.timeSpent > 0 || task.pomodoroCount > 0) && (
                                    <>
                                        <Separator orientation="vertical" className="h-3" />
                                        <div className="flex items-center gap-2">
                                            {task.pomodoroCount > 0 && (
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {task.pomodoroCount} sessions
                                                </div>
                                            )}
                                            {task.timeSpent > 0 && (
                                                <div>
                                                    {Math.round(task.timeSpent / 60)}m
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}

                                {/* Created Date */}
                                <Separator orientation="vertical" className="h-3" />
                                <div>
                                    Created {format(task.createdDate, 'MMM dd')}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Task</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{task.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}