"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Search, Filter } from 'lucide-react';
import { TaskFilters as TaskFiltersType } from '@/types';

interface TaskFiltersProps {
    filters: TaskFiltersType;
    onFiltersChange: (filters: TaskFiltersType) => void;
    availableTags: string[];
}

export function TaskFilters({ filters, onFiltersChange, availableTags }: TaskFiltersProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [localFilters, setLocalFilters] = useState<TaskFiltersType>(filters);

    useEffect(() => {
        setLocalFilters(filters);
    }, [filters]);

    const handleFilterChange = (key: keyof TaskFiltersType, value: string | boolean | undefined) => {
        const newFilters = { ...localFilters, [key]: value };
        setLocalFilters(newFilters);
        onFiltersChange(newFilters);
    };

    const clearFilters = () => {
        const clearedFilters: TaskFiltersType = {};
        setLocalFilters(clearedFilters);
        onFiltersChange(clearedFilters);
    };

    const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== '');

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search tasks..."
                    value={localFilters.search || ''}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center justify-between">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-2"
                >
                    <Filter className="h-4 w-4" />
                    Filters
                    {hasActiveFilters && (
                        <Badge variant="secondary" className="ml-1">
                            {Object.values(filters).filter(v => v !== undefined && v !== '').length}
                        </Badge>
                    )}
                </Button>

                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-4 w-4 mr-1" />
                        Clear
                    </Button>
                )}
            </div>

            {/* Expanded Filters */}
            {isExpanded && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/50">
                    {/* Status Filter */}
                    <div className="space-y-2">
                        <Label htmlFor="status-filter">Status</Label>
                        <Select
                            value={localFilters.completed?.toString() || ''}
                            onValueChange={(value) => handleFilterChange('completed', value === 'true' ? true : value === 'false' ? false : undefined)}
                        >
                            <SelectTrigger id="status-filter">
                                <SelectValue placeholder="All tasks" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All tasks</SelectItem>
                                <SelectItem value="false">Active</SelectItem>
                                <SelectItem value="true">Completed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Priority Filter */}
                    <div className="space-y-2">
                        <Label htmlFor="priority-filter">Priority</Label>
                        <Select
                            value={localFilters.priority || ''}
                            onValueChange={(value) => handleFilterChange('priority', value || undefined)}
                        >
                            <SelectTrigger id="priority-filter">
                                <SelectValue placeholder="All priorities" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All priorities</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Tag Filter */}
                    <div className="space-y-2">
                        <Label htmlFor="tag-filter">Tag</Label>
                        <Select
                            value={localFilters.tag || ''}
                            onValueChange={(value) => handleFilterChange('tag', value || undefined)}
                        >
                            <SelectTrigger id="tag-filter">
                                <SelectValue placeholder="All tags" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All tags</SelectItem>
                                {availableTags.map((tag) => (
                                    <SelectItem key={tag} value={tag}>
                                        {tag}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}

            {/* Active Filters Display */}
            {hasActiveFilters && (
                <div className="flex flex-wrap gap-2">
                    {filters.completed !== undefined && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                            Status: {filters.completed ? 'Completed' : 'Active'}
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => handleFilterChange('completed', undefined)}
                            />
                        </Badge>
                    )}
                    {filters.priority && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                            Priority: {filters.priority}
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => handleFilterChange('priority', undefined)}
                            />
                        </Badge>
                    )}
                    {filters.tag && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                            Tag: {filters.tag}
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => handleFilterChange('tag', undefined)}
                            />
                        </Badge>
                    )}
                    {filters.search && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                            Search: &quot;{filters.search}&quot;
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => handleFilterChange('search', undefined)}
                            />
                        </Badge>
                    )}
                </div>
            )}
        </div>
    );
}