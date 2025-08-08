"use client";

import React, { useEffect, useState } from 'react';
import { Moon, Sun, CheckSquare, User } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
    currentUserId?: string;
    onUserChange?: (userId: string) => void;
}

export function Header({ currentUserId, onUserChange }: HeaderProps) {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Demo users for testing (in a real app, this would come from authentication)
    const demoUsers = [
        { id: '6896489d2dab362ba354ecfd', name: 'Demo User', email: 'demo@test.com' },
        { id: '6896489d2dab362ba354ed00', name: 'John Doe', email: 'john@example.com' },
    ];

    const currentUser = demoUsers.find(user => user.id === currentUserId);

    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center justify-between px-4">
                {/* Logo and Title */}
                <div className="flex items-center gap-2">
                    <CheckSquare className="h-6 w-6 text-primary" />
                    <h1 className="text-xl font-bold">TaskFlow</h1>
                    <Badge variant="outline" className="text-xs">
                        Next.js
                    </Badge>
                </div>

                {/* Right side controls */}
                <div className="flex items-center gap-2">
                    {/* User Selector (Demo purposes) */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                {currentUser ? currentUser.name : 'Select User'}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {demoUsers.map((user) => (
                                <DropdownMenuItem
                                    key={user.id}
                                    onClick={() => onUserChange?.(user.id)}
                                    className={currentUserId === user.id ? 'bg-accent' : ''}
                                >
                                    <div className="flex flex-col">
                                        <span className="font-medium">{user.name}</span>
                                        <span className="text-xs text-muted-foreground">{user.email}</span>
                                    </div>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Theme Toggle */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                        suppressHydrationWarning
                    >
                        {mounted && (
                            <>
                                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                            </>
                        )}
                        <span className="sr-only">Toggle theme</span>
                    </Button>
                </div>
            </div>
        </header>
    );
}