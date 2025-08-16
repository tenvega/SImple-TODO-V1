"use client";

import React, { useEffect, useState } from 'react';
import { Moon, Sun, CheckSquare, User, Settings, LogIn } from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { UserAvatar } from '@/components/profile/UserAvatar';

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

    // Demo users for portfolio demonstration
    const demoUsers = [
        {
            id: '6896489d2dab362ba354ecfd',
            name: 'Demo User',
            email: 'demo@taskflow.com',
            role: 'Product Manager',
            avatar: 'DU',
            image: '/avatars/demo-user.svg'
        },
        {
            id: '6896489d2dab362ba354ed00',
            name: 'John Doe',
            email: 'john@taskflow.com',
            role: 'Software Developer',
            avatar: 'JD',
            image: '/avatars/john-doe.svg'
        },
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
                        Portfolio Demo
                    </Badge>
                </div>

                {/* Right side controls */}
                <div className="flex items-center gap-2">
                    {/* Profile Settings Link */}
                    <Link href="/profile">
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            Profile
                        </Button>
                    </Link>

                    {/* User Selector (Portfolio Demo) */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="flex items-center gap-2">
                                {currentUser ? (
                                    <div className="flex items-center gap-2">
                                        <UserAvatar
                                            name={currentUser.name}
                                            email={currentUser.email}
                                            size="sm"
                                            imageUrl={currentUser.image}
                                            className="h-6 w-6"
                                        />
                                        <span className="hidden sm:inline">{currentUser.name}</span>
                                    </div>
                                ) : (
                                    'Select User'
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64">
                            <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                                Demo Users (Portfolio)
                            </div>
                            <DropdownMenuSeparator />
                            {demoUsers.map((user) => (
                                <DropdownMenuItem
                                    key={user.id}
                                    onClick={() => onUserChange?.(user.id)}
                                    className={`flex items-center gap-3 p-3 ${currentUserId === user.id ? 'bg-accent' : ''}`}
                                >
                                    <UserAvatar
                                        name={user.name}
                                        email={user.email}
                                        size="sm"
                                        imageUrl={user.image}
                                        className="h-8 w-8"
                                    />
                                    <div className="flex flex-col">
                                        <span className="font-medium">{user.name}</span>
                                        <span className="text-xs text-muted-foreground">{user.email}</span>
                                        <span className="text-xs text-muted-foreground">{user.role}</span>
                                    </div>
                                </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <div className="px-2 py-1.5 text-xs text-muted-foreground">
                                This demonstrates multi-user architecture and data isolation
                            </div>
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