"use client";

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Navigation } from '@/components/layout/Navigation';
import { ProfileSettings } from '@/components/profile/ProfileSettings';
import { useTask } from '@/contexts/TaskContext';

export default function ProfilePage() {
    const { setUserId } = useTask();
    const [currentUserId, setCurrentUserId] = useState<string>('');
    const [mounted, setMounted] = useState(false);

    // Set default user on mount
    useEffect(() => {
        setMounted(true);
        const defaultUserId = '6896489d2dab362ba354ecfd'; // Demo user ID
        setCurrentUserId(defaultUserId);
        setUserId(defaultUserId);
    }, [setUserId]);

    const handleUserChange = (userId: string) => {
        setCurrentUserId(userId);
        setUserId(userId);
        // Force a re-render of the profile settings when user changes
        setMounted(false);
        setTimeout(() => setMounted(true), 100);
    };

    if (!mounted) {
        return (
            <div className="min-h-screen bg-background animate-pulse">
                <div className="h-14 bg-muted"></div>
                <div className="container mx-auto px-4 py-6">
                    <div className="max-w-2xl mx-auto">
                        <div className="h-32 bg-muted rounded-lg"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Header
                currentUserId={currentUserId}
                onUserChange={handleUserChange}
            />

            <main className="container mx-auto px-4 py-6">
                <div className="max-w-2xl mx-auto">
                    <Navigation />

                    <div className="mb-6">
                        <h1 className="text-3xl font-bold">Profile Settings</h1>
                        <p className="text-muted-foreground mt-2">
                            Manage your account settings and preferences
                        </p>
                    </div>

                    <ProfileSettings userId={currentUserId} />
                </div>
            </main>
        </div>
    );
}
