"use client";

import React from 'react';
import Image from 'next/image';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
    name: string;
    email: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    imageUrl?: string;
}

export function UserAvatar({ name, email, size = 'md', className, imageUrl }: UserAvatarProps) {
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const sizeClasses = {
        sm: 'h-8 w-8 text-xs',
        md: 'h-12 w-12 text-sm',
        lg: 'h-16 w-16 text-base'
    };

    const imageSizeClasses = {
        sm: 'h-8 w-8',
        md: 'h-12 w-12',
        lg: 'h-16 w-16'
    };

    // Use custom className if provided, otherwise use size classes
    const finalSizeClass = className || sizeClasses[size];
    const finalImageSizeClass = className || imageSizeClasses[size];

    // If we have an image URL, try to use it
    if (imageUrl) {
        return (
            <div className={cn('relative rounded-full overflow-hidden', finalImageSizeClass)}>
                <Image
                    src={imageUrl}
                    alt={`${name}'s profile picture`}
                    fill
                    className="object-cover"
                    onError={(e) => {
                        // Fallback to initials if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                            parent.innerHTML = `
                                <div class="flex items-center justify-center w-full h-full bg-primary text-primary-foreground font-semibold ${finalSizeClass}">
                                    ${getInitials(name)}
                                </div>
                            `;
                        }
                    }}
                />
            </div>
        );
    }

    // Fallback to initials
    return (
        <div
            className={cn(
                'flex items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold',
                finalSizeClass
            )}
            title={`${name} (${email})`}
        >
            {name ? getInitials(name) : <User className="h-1/2 w-1/2" />}
        </div>
    );
}
