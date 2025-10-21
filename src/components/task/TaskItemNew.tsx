"use client";

import React, { useState } from 'react';
import { format, isAfter, isToday, isTomorrow } from 'date-fns';
import { Calendar, Clock, Edit, Trash2, Play, MoreVertical, Circle, CheckCircle2 } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

export function TaskItemNew({ task, onEdit, onStartPomodoro }: TaskItemProps) {
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

    const getDueDateDisplay = (dueDate: Date) => {
        if (isToday(dueDate)) return 'Today';
        if (isTomorrow(dueDate)) return 'Tomorrow';
        return format(dueDate, 'MMM dd, yyyy');
    };

    const getStatusIcon = (completed: boolean) => {
        return completed ? (
            <CheckCircle2 className="h-5 w-5 text-chart-2" />
        ) : (
            <Circle className="h-5 w-5 text-muted-foreground" />
        );
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "high":
                return "bg-destructive/10 text-destructive border-destructive/20";
            case "medium":
                return "bg-chart-3/10 text-chart-3 border-chart-3/20";
            case "low":
                return "bg-muted text-muted-foreground border-border";
            default:
                return "bg-muted text-muted-foreground border-border";
        }
    };

    return (
        <>
            <Card className="p-4 transition-colors hover:bg-muted/50">
                <div className="flex items-start gap-4">
                    <button
                        onClick={handleToggleComplete}
                        className="mt-0.5 transition-transform hover:scale-110"
                    >
                        {getStatusIcon(task.completed)}
                    </button>
                    <button onClick={() => onEdit?.(task)} className="flex-1 space-y-2 text-left">
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                                <h3 className={cn(
                                    "font-medium leading-none",
                                    task.completed && "line-through text-muted-foreground"
                                )}>
                                    {task.title}
                                </h3>
                                {task.description && (
                                    <p className={cn(
                                        "text-sm text-muted-foreground",
                                        task.completed && "line-through"
                                    )}>
                                        {task.description}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className={getPriorityColor(task.priority)}>
                                {task.priority}
                            </Badge>
                            {task.tags.map((tag) => (
                                <Badge key={tag} variant="secondary">
                                    {tag}
                                </Badge>
                            ))}
                            {task.dueDate && (
                                <span className="text-xs text-muted-foreground">
                                    Due {getDueDateDisplay(task.dueDate)}
                                </span>
                            )}
                        </div>
                    </button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit?.(task)}>Edit</DropdownMenuItem>
                            {!task.completed && onStartPomodoro && (
                                <DropdownMenuItem onClick={() => onStartPomodoro(task)}>
                                    Start Pomodoro
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-destructive" onClick={() => setShowDeleteDialog(true)}>
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Task</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &quot;{task.title}&quot;? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
