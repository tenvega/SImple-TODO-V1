"use client";

import React, { useState, useMemo } from 'react';
import { Plus, ListTodo } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTask } from '@/contexts/TaskContext';
import { Task } from '@/types';
import { TaskItem } from './TaskItem';
import { TaskForm } from './TaskForm';
import { TaskFiltersComponent } from './TaskFilters';

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
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ListTodo className="h-6 w-6" />
                    <h2 className="text-3xl font-bold">Tasks</h2>
                </div>
                <Button onClick={() => setShowCreateForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                </Button>
            </div>

            {/* Filters */}
            <TaskFiltersComponent
                filters={filters}
                onFiltersChange={setFilters}
                availableTags={availableTags}
                taskCounts={taskCounts}
            />

            {/* Task List */}
            <div className="space-y-3">
                {filteredTasks.length === 0 ? (
                    <Card>
                        <CardContent className="pt-12 pb-12">
                            <div className="text-center text-muted-foreground">
                                <ListTodo className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                {tasks.length === 0 ? (
                                    <>
                                        <h3 className="font-medium mb-2">No tasks yet</h3>
                                        <p className="text-sm mb-4">Create your first task to get started!</p>
                                        <Button onClick={() => setShowCreateForm(true)}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create Task
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <h3 className="font-medium mb-2">No tasks match your filters</h3>
                                        <p className="text-sm">Try adjusting your search criteria.</p>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    filteredTasks.map((task) => (
                        <TaskItem
                            key={task._id.toString()}
                            task={task}
                            onEdit={handleEditTask}
                            onStartPomodoro={onStartPomodoro}
                        />
                    ))
                )}
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