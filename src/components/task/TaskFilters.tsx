"use client";

import React from 'react';
import { Search, Filter, X } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskFilters } from '@/types';

interface TaskFiltersProps {
    filters: TaskFilters;
    onFiltersChange: (filters: TaskFilters) => void;
    availableTags: string[];
    taskCounts: {
        all: number;
        pending: number;
        completed: number;
    };
}

export function TaskFiltersComponent({
    filters,
    onFiltersChange,
    availableTags,
    taskCounts
}: TaskFiltersProps) {
    const updateFilter = (key: keyof TaskFilters, value: any) => {
        onFiltersChange({ ...filters, [key]: value });
    };

    const clearFilter = (key: keyof TaskFilters) => {
        const newFilters = { ...filters };
        delete newFilters[key];
        onFiltersChange(newFilters);
    };

    const clearAllFilters = () => {
        onFiltersChange({});
    };

    const getActiveFilterCount = () => {
        return Object.keys(filters).filter(key =>
            filters[key as keyof TaskFilters] !== undefined &&
            filters[key as keyof TaskFilters] !== ''
        ).length;
    };

    return (
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            {/* Completion Status Tabs */}
            <Tabs
                value={filters.completed === undefined ? 'all' : filters.completed ? 'completed' : 'pending'}
                onValueChange={(value) => {
                    if (value === 'all') {
                        clearFilter('completed');
                    } else {
                        updateFilter('completed', value === 'completed');
                    }
                }}
            >
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="all" className="flex items-center gap-2">
                        All
                        <Badge variant="secondary" className="text-xs">
                            {taskCounts.all}
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="flex items-center gap-2">
                        Pending
                        <Badge variant="secondary" className="text-xs">
                            {taskCounts.pending}
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="completed" className="flex items-center gap-2">
                        Completed
                        <Badge variant="secondary" className="text-xs">
                            {taskCounts.completed}
                        </Badge>
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Search and Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search tasks..."
                        value={filters.search || ''}
                        onChange={(e) => updateFilter('search', e.target.value || undefined)}
                        className="pl-9"
                    />
                    {filters.search && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                            onClick={() => clearFilter('search')}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    )}
                </div>

                {/* Priority Filter */}
                <Select
                    value={filters.priority || 'all'}
                    onValueChange={(value) => {
                        if (value === 'all') {
                            clearFilter('priority');
                        } else {
                            updateFilter('priority', value);
                        }
                    }}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="All Priorities" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="high">High Priority</SelectItem>
                        <SelectItem value="medium">Medium Priority</SelectItem>
                        <SelectItem value="low">Low Priority</SelectItem>
                    </SelectContent>
                </Select>

                {/* Tag Filter */}
                <Select
                    value={filters.tag || 'all'}
                    onValueChange={(value) => {
                        if (value === 'all') {
                            clearFilter('tag');
                        } else {
                            updateFilter('tag', value);
                        }
                    }}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="All Tags" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Tags</SelectItem>
                        {availableTags.map((tag) => (
                            <SelectItem key={tag} value={tag}>
                                {tag}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Active Filters */}
            {getActiveFilterCount() > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Filter className="h-4 w-4" />
                        Active filters:
                    </div>

                    {filters.search && (
                        <Badge variant="outline" className="flex items-center gap-1">
                            Search: "{filters.search}"
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 ml-1"
                                onClick={() => clearFilter('search')}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </Badge>
                    )}

                    {filters.priority && (
                        <Badge variant="outline" className="flex items-center gap-1">
                            Priority: {filters.priority}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 ml-1"
                                onClick={() => clearFilter('priority')}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </Badge>
                    )}

                    {filters.tag && (
                        <Badge variant="outline" className="flex items-center gap-1">
                            Tag: {filters.tag}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 ml-1"
                                onClick={() => clearFilter('tag')}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </Badge>
                    )}

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={clearAllFilters}
                        className="ml-auto"
                    >
                        Clear All
                    </Button>
                </div>
            )}
        </div>
    );
}