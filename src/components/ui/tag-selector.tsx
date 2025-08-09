"use client";

import React, { useState } from 'react';
import { Badge } from './badge';
import { Button } from './button';
import { Input } from './input';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Separator } from './separator';
import { X, Plus, Tag } from 'lucide-react';
import { PREDEFINED_TAGS, TAG_CATEGORIES, getTagsByCategory, getTagColor } from '@/lib/tagCategories';
import { cn } from '@/lib/utils';

interface TagSelectorProps {
    selectedTags: string[];
    onTagsChange: (tags: string[]) => void;
    maxTags?: number;
    placeholder?: string;
}

export function TagSelector({
    selectedTags,
    onTagsChange,
    maxTags = 10,
    placeholder = "Add tags..."
}: TagSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [customTag, setCustomTag] = useState('');

    const addTag = (tagName: string) => {
        if (!selectedTags.includes(tagName) && selectedTags.length < maxTags) {
            onTagsChange([...selectedTags, tagName]);
        }
    };

    const removeTag = (tagName: string) => {
        onTagsChange(selectedTags.filter(tag => tag !== tagName));
    };

    const addCustomTag = () => {
        if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
            addTag(customTag.trim().toLowerCase());
            setCustomTag('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addCustomTag();
        }
    };

    return (
        <div className="space-y-2">
            {/* Selected Tags Display */}
            <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-2 border rounded-md bg-background">
                {selectedTags.length > 0 ? (
                    selectedTags.map((tag) => (
                        <Badge
                            key={tag}
                            variant="secondary"
                            className="flex items-center gap-1 pr-1"
                            style={{ backgroundColor: `${getTagColor(tag)}20`, borderColor: getTagColor(tag) }}
                        >
                            <span className="text-xs">{tag}</span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0.5 hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => removeTag(tag)}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </Badge>
                    ))
                ) : (
                    <span className="text-muted-foreground text-sm flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        {placeholder}
                    </span>
                )}
            </div>

            {/* Tag Selector Popover */}
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start"
                        disabled={selectedTags.length >= maxTags}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add tags ({selectedTags.length}/{maxTags})
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                    <div className="p-4 space-y-4">
                        {/* Custom Tag Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Create Custom Tag</label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Enter custom tag..."
                                    value={customTag}
                                    onChange={(e) => setCustomTag(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    className="flex-1"
                                />
                                <Button
                                    type="button"
                                    onClick={addCustomTag}
                                    disabled={!customTag.trim()}
                                    size="sm"
                                >
                                    Add
                                </Button>
                            </div>
                        </div>

                        <Separator />

                        {/* Predefined Tags by Category */}
                        <div className="space-y-4 max-h-64 overflow-y-auto">
                            {Object.values(TAG_CATEGORIES).map((category) => {
                                const categoryTags = getTagsByCategory(category);
                                return (
                                    <div key={category} className="space-y-2">
                                        <h4 className="text-sm font-medium text-muted-foreground">
                                            {category}
                                        </h4>
                                        <div className="flex flex-wrap gap-1">
                                            {categoryTags.map((tag) => {
                                                const isSelected = selectedTags.includes(tag.name);
                                                return (
                                                    <Button
                                                        key={tag.name}
                                                        type="button"
                                                        variant={isSelected ? "default" : "outline"}
                                                        size="sm"
                                                        className={cn(
                                                            "h-7 text-xs",
                                                            isSelected && "opacity-50 cursor-not-allowed"
                                                        )}
                                                        style={
                                                            !isSelected ? {
                                                                borderColor: tag.color,
                                                                color: tag.color,
                                                            } : undefined
                                                        }
                                                        onClick={() => addTag(tag.name)}
                                                        disabled={isSelected || selectedTags.length >= maxTags}
                                                    >
                                                        {tag.name}
                                                    </Button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}