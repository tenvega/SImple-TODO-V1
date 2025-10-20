"use client";

import React, { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTask } from '@/contexts/TaskContext';
import { Task } from '@/types';
import { TaskItemNew } from './TaskItemNew';
import { TaskForm } from './TaskForm';
import { TaskFilters } from './TaskFilters';

interface TaskListProps {
    onStartPomodoro?: (task: Task) => void;
}

export function TaskList({ onStartPomodoro }: TaskListProps) {
    const { state, setFilters } = useTask();
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    const { tasks, filteredTasks, loading, error, filters } = state;

    // Calculate task counts and available tags
    const taskCounts = useMemo(() => {
        return {
            all: tasks.length,
            pending: tasks.filter(task => !task.completed).length,
            completed: tasks.filter(task => task.completed).length,
        };
    }, [tasks]);

    const availableTags = useMemo(() => {
        const tagSet = new Set<string>();
        tasks.forEach(task => {
            task.tags.forEach(tag => tagSet.add(tag));
        });
        return Array.from(tagSet).sort();
    }, [tasks]);

    const handleEditTask = (task: Task) => {
        setEditingTask(task);
    };

    const closeEditForm = () => {
        setEditingTask(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading tasks...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                    <div className="text-center text-red-600">
                        <p className="font-medium">Error loading tasks</p>
                        <p className="text-sm mt-1">{error}</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="h-full p-6 lg:p-8">
            <div className="mx-auto max-w-6xl space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-balance">Tasks</h1>
                        <p className="text-sm text-muted-foreground">Manage your tasks and stay productive</p>
                    </div>
                    <Button className="gap-2" onClick={() => setShowCreateForm(true)}>
                        <Plus className="h-4 w-4" />
                        New Task
                    </Button>
                </div>

                {/* Filters */}
                <TaskFilters
                    filters={filters}
                    onFiltersChange={setFilters}
                    availableTags={availableTags}
                />

                {/* Task list */}
                <div className="space-y-3">
                    {filteredTasks.length === 0 ? (
                        <Card className="p-8 text-center">
                            <p className="text-muted-foreground">
                                {tasks.length === 0 ? "No tasks yet. Create your first task!" : "No tasks found matching your search."}
                            </p>
                        </Card>
                    ) : (
                        filteredTasks.map((task) => (
                            <TaskItemNew
                                key={task._id.toString()}
                                task={task}
                                onEdit={handleEditTask}
                                onStartPomodoro={onStartPomodoro}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Create Task Dialog */}
            <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Create New Task</DialogTitle>
                    </DialogHeader>
                    <TaskForm onClose={() => setShowCreateForm(false)} />
                </DialogContent>
            </Dialog>

            {/* Edit Task Dialog */}
            <Dialog open={!!editingTask} onOpenChange={(open) => !open && closeEditForm()}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Task</DialogTitle>
                    </DialogHeader>
                    {editingTask && (
                        <TaskForm
                            onClose={closeEditForm}
                            initialData={{
                                title: editingTask.title,
                                description: editingTask.description,
                                dueDate: editingTask.dueDate,
                                priority: editingTask.priority,
                                tags: editingTask.tags,
                            }}
                            isEditing={true}
                            taskId={editingTask._id.toString()}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}