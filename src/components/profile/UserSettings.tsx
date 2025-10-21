"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Settings, Clock, Bell, Key, Save, RotateCcw, Info } from 'lucide-react';
import { UserSettings as UserSettingsType } from '@/types';

interface UserSettingsProps {
    userId: string;
    isDefaultDemoUser?: boolean;
}

const defaultSettings: UserSettingsType = {
    pomodoro: {
        workDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        sessionsUntilLongBreak: 4
    },
    notifications: {
        taskReminders: true,
        dailySummary: true,
        weeklySummary: true,
        pomodoroNotifications: true,
        securityAlerts: true
    }
};

export function UserSettings({ userId, isDefaultDemoUser = false }: UserSettingsProps) {
    const [settings, setSettings] = useState<UserSettingsType>(defaultSettings);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [showPasswordReset, setShowPasswordReset] = useState(false);
    const [newPassword, setNewPassword] = useState<string | null>(null);

    const fetchSettings = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/users/${userId}/settings`);
            if (response.ok) {
                const userSettings = await response.json();
                setSettings(userSettings);
            } else {
                // Use default settings if fetch fails
                setSettings(defaultSettings);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            setSettings(defaultSettings);
        }
        setIsLoading(false);
    }, [userId]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handlePomodoroChange = (field: keyof UserSettingsType['pomodoro'], value: number) => {
        const newSettings = {
            ...settings,
            pomodoro: {
                ...settings.pomodoro,
                [field]: value
            }
        };
        setSettings(newSettings);
        setHasChanges(true);
    };

    const handleNotificationChange = (field: keyof UserSettingsType['notifications'], value: boolean) => {
        const newSettings = {
            ...settings,
            notifications: {
                ...settings.notifications,
                [field]: value
            }
        };
        setSettings(newSettings);
        setHasChanges(true);
    };

    const handleSaveSettings = async () => {
        setIsSaving(true);
        try {
            const response = await fetch(`/api/users/${userId}/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(settings),
            });

            if (response.ok) {
                setHasChanges(false);
                toast.success('Settings saved successfully!');
            } else {
                const error = await response.json();
                toast.error(error.error || 'Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Failed to save settings. Please try again.');
        }
        setIsSaving(false);
    };

    const handlePasswordReset = async () => {
        try {
            const response = await fetch(`/api/users/${userId}/reset-password`, {
                method: 'POST',
            });

            if (response.ok) {
                const result = await response.json();
                setNewPassword(result.newPassword);
                setShowPasswordReset(true);
                toast.success('Password reset successfully!');
            } else {
                const error = await response.json();
                toast.error(error.error || 'Failed to reset password');
            }
        } catch (error) {
            console.error('Error resetting password:', error);
            toast.error('Failed to reset password. Please try again.');
        }
    };

    // Show loading state or no user ID
    if (isLoading || !userId) {
        return (
            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <div className="h-6 bg-muted rounded animate-pulse"></div>
                        <div className="h-4 bg-muted rounded animate-pulse w-2/3"></div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="h-10 bg-muted rounded animate-pulse"></div>
                            <div className="h-10 bg-muted rounded animate-pulse"></div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Pomodoro Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Pomodoro Timer Settings
                    </CardTitle>
                    <CardDescription>
                        Customize your Pomodoro timer durations and session preferences
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="workDuration">Work Session Duration (minutes)</Label>
                            <Input
                                id="workDuration"
                                type="number"
                                min="5"
                                max="60"
                                value={settings.pomodoro.workDuration}
                                onChange={(e) => handlePomodoroChange('workDuration', parseInt(e.target.value) || 25)}
                            />
                            <p className="text-xs text-muted-foreground">Recommended: 25 minutes</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="shortBreakDuration">Short Break Duration (minutes)</Label>
                            <Input
                                id="shortBreakDuration"
                                type="number"
                                min="1"
                                max="30"
                                value={settings.pomodoro.shortBreakDuration}
                                onChange={(e) => handlePomodoroChange('shortBreakDuration', parseInt(e.target.value) || 5)}
                            />
                            <p className="text-xs text-muted-foreground">Recommended: 5 minutes</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="longBreakDuration">Long Break Duration (minutes)</Label>
                            <Input
                                id="longBreakDuration"
                                type="number"
                                min="5"
                                max="60"
                                value={settings.pomodoro.longBreakDuration}
                                onChange={(e) => handlePomodoroChange('longBreakDuration', parseInt(e.target.value) || 15)}
                            />
                            <p className="text-xs text-muted-foreground">Recommended: 15 minutes</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="sessionsUntilLongBreak">Sessions Until Long Break</Label>
                            <Input
                                id="sessionsUntilLongBreak"
                                type="number"
                                min="2"
                                max="10"
                                value={settings.pomodoro.sessionsUntilLongBreak}
                                onChange={(e) => handlePomodoroChange('sessionsUntilLongBreak', parseInt(e.target.value) || 4)}
                            />
                            <p className="text-xs text-muted-foreground">Recommended: 4 sessions</p>
                        </div>
                    </div>

                    {hasChanges && (
                        <div className="flex items-center gap-2 pt-4 border-t">
                            <Button onClick={handleSaveSettings} disabled={isSaving}>
                                <Save className="h-4 w-4 mr-2" />
                                {isSaving ? 'Saving...' : 'Save Pomodoro Settings'}
                            </Button>
                            <Badge variant="outline" className="text-orange-600">
                                Unsaved changes
                            </Badge>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notification Preferences
                        <Badge variant="secondary" className="ml-2">
                            Demo Mode
                        </Badge>
                    </CardTitle>
                    <CardDescription>
                        Configure your notification preferences (Demo: No real emails sent)
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-2">
                            <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                            <div className="text-sm text-blue-800">
                                <p className="font-medium">Demo Mode Notice</p>
                                <p>These are mock notification preferences. In production, this would integrate with email services like SendGrid, AWS SES, or similar.</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="taskReminders">Task Reminders</Label>
                                <p className="text-sm text-muted-foreground">Get reminded about upcoming tasks</p>
                            </div>
                            <Switch
                                id="taskReminders"
                                checked={settings.notifications.taskReminders}
                                onCheckedChange={(checked) => handleNotificationChange('taskReminders', checked)}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="dailySummary">Daily Summary</Label>
                                <p className="text-sm text-muted-foreground">Receive daily productivity summaries</p>
                            </div>
                            <Switch
                                id="dailySummary"
                                checked={settings.notifications.dailySummary}
                                onCheckedChange={(checked) => handleNotificationChange('dailySummary', checked)}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="weeklySummary">Weekly Summary</Label>
                                <p className="text-sm text-muted-foreground">Get weekly progress reports</p>
                            </div>
                            <Switch
                                id="weeklySummary"
                                checked={settings.notifications.weeklySummary}
                                onCheckedChange={(checked) => handleNotificationChange('weeklySummary', checked)}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="pomodoroNotifications">Pomodoro Notifications</Label>
                                <p className="text-sm text-muted-foreground">Notifications for session start/end</p>
                            </div>
                            <Switch
                                id="pomodoroNotifications"
                                checked={settings.notifications.pomodoroNotifications}
                                onCheckedChange={(checked) => handleNotificationChange('pomodoroNotifications', checked)}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="securityAlerts">Security Alerts</Label>
                                <p className="text-sm text-muted-foreground">Important security notifications</p>
                            </div>
                            <Switch
                                id="securityAlerts"
                                checked={settings.notifications.securityAlerts}
                                onCheckedChange={(checked) => handleNotificationChange('securityAlerts', checked)}
                            />
                        </div>
                    </div>

                    {hasChanges && (
                        <div className="flex items-center gap-2 pt-4 border-t">
                            <Button onClick={handleSaveSettings} disabled={isSaving}>
                                <Save className="h-4 w-4 mr-2" />
                                {isSaving ? 'Saving...' : 'Save Notification Settings'}
                            </Button>
                            <Badge variant="outline" className="text-orange-600">
                                Unsaved changes
                            </Badge>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Password Reset - Only show for non-default demo users */}
            {!isDefaultDemoUser && (
                <Card className="border-orange-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-700">
                            <Key className="h-5 w-5" />
                            Password Reset (Demo Users)
                        </CardTitle>
                        <CardDescription>
                            Reset your password for demo purposes
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg mb-4">
                            <div className="flex items-start gap-2">
                                <Info className="h-4 w-4 text-orange-600 mt-0.5" />
                                <div className="text-sm text-orange-800">
                                    <p className="font-medium">Demo Password Reset</p>
                                    <p>This generates a new random password and displays it to you. In production, this would be sent via email.</p>
                                </div>
                            </div>
                        </div>

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-50">
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Reset Password
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Reset Password</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will generate a new random password for your account. The new password will be displayed to you since this is demo mode.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handlePasswordReset} className="bg-orange-600 hover:bg-orange-700">
                                        Reset Password
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        {newPassword && (
                            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <h4 className="font-medium text-green-800 mb-2">New Password Generated</h4>
                                <div className="bg-white p-3 rounded border font-mono text-sm">
                                    {newPassword}
                                </div>
                                <p className="text-xs text-green-700 mt-2">
                                    Please save this password securely. You can use it to log in immediately.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
