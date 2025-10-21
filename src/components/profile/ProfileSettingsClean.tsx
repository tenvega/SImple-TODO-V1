"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { User, Shield, LogOut, Save, Edit3, Eye, EyeOff, Settings, Clock, Bell, Info } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { UserAvatar } from './UserAvatar';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileSettingsCleanProps {
    userId: string;
}

interface Profile {
    id: string;
    name: string;
    email: string;
    image?: string;
    createdAt: string;
}

const defaultSettings = {
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

export function ProfileSettingsClean({ userId }: ProfileSettingsCleanProps) {
    const { logout } = useAuth();

    // All hooks at the top - no conditional logic
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [settings, setSettings] = useState(defaultSettings);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: ''
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Check if this is the default demo user (John Doe) - should be read-only
    const isDefaultDemoUser = profile?.email === 'john@example.com' || profile?.id === '6896489d2dab362ba354ed00';
    
    // Debug logging
    console.log('Profile data:', profile);
    console.log('Is default demo user:', isDefaultDemoUser);
    console.log('Profile email:', profile?.email);
    console.log('Profile ID:', profile?.id);

    const fetchProfile = useCallback(async () => {
        if (!userId) return;

        setIsLoading(true);
        try {
            const response = await fetch(`/api/users/${userId}`);
            if (response.ok) {
                const userData = await response.json();
                setProfile(userData);
                setFormData({
                    name: userData.name,
                    email: userData.email
                });
            } else {
                console.error('Failed to fetch profile');
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
        setIsLoading(false);
    }, [userId]);

    const fetchSettings = useCallback(async () => {
        if (!userId) return;

        try {
            const response = await fetch(`/api/users/${userId}/settings`);
            if (response.ok) {
                const userSettings = await response.json();
                setSettings(userSettings);
            } else {
                setSettings(defaultSettings);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            setSettings(defaultSettings);
        }
    }, [userId]);

    useEffect(() => {
        fetchProfile();
        fetchSettings();
    }, [fetchProfile, fetchSettings]);

    const handleProfileUpdate = async () => {
        if (!profile) return;

        setIsLoading(true);
        try {
            const response = await fetch(`/api/users/${profile.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const updatedProfile = await response.json();
                setProfile(updatedProfile);
                setIsEditing(false);
                toast.success('Profile updated successfully!');
            } else {
                const error = await response.json();
                toast.error(error.error || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile. Please try again.');
        }
        setIsLoading(false);
    };

    const handlePasswordChange = async () => {
        if (!profile) return;

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters long');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`/api/users/${profile.id}/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword,
                }),
            });

            if (response.ok) {
                setIsChangingPassword(false);
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                toast.success('Password changed successfully!');
            } else {
                const error = await response.json();
                toast.error(error.error || 'Failed to change password');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            toast.error('Failed to change password. Please try again.');
        }
        setIsLoading(false);
    };

    const handlePomodoroChange = (field: string, value: number) => {
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

    const handleNotificationChange = (field: string, value: boolean) => {
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
                toast.success(`New password: ${result.newPassword}`);
            } else {
                const error = await response.json();
                toast.error(error.error || 'Failed to reset password');
            }
        } catch (error) {
            console.error('Error resetting password:', error);
            toast.error('Failed to reset password. Please try again.');
        }
    };

    const handleLogout = () => {
        logout();
        toast.success("You have been successfully signed out.");
    };

    return (
        <div className="h-full overflow-auto p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-3xl font-semibold tracking-tight text-balance">Profile Settings</h1>
                    <p className="text-sm text-muted-foreground">
                        {isLoading ? "Loading your profile..." : "Manage your account settings and preferences"}
                    </p>
                    {/* Debug info */}
                    {profile && (
                        <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded text-xs">
                            <p>Debug: Email: {profile.email} | ID: {profile.id}</p>
                            <p>Is Default Demo User: {isDefaultDemoUser ? 'YES' : 'NO'}</p>
                        </div>
                    )}
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <Card key={i}>
                                <CardContent className="p-6">
                                    <div className="animate-pulse">
                                        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                                        <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                                        <div className="h-3 bg-muted rounded w-1/3"></div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Main Content - only show when not loading */}
                {!isLoading && (
                    <div className="space-y-6">
                        {/* Profile Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Profile Info Card */}
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Profile Status</p>
                                            <p className="text-2xl font-bold">{profile ? 'Active' : 'Inactive'}</p>
                                            <p className="text-xs text-green-600 flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                {profile ? 'Account verified' : 'Not found'}
                                            </p>
                                        </div>
                                        <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                                            <User className="h-6 w-6 text-blue-500" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Member Since Card */}
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                                            <p className="text-2xl font-bold">
                                                {profile ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
                                            </p>
                                            <p className="text-xs text-blue-600 flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {profile ? `${Math.floor((Date.now() - new Date(profile.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days` : '0 days'}
                                            </p>
                                        </div>
                                        <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                                            <Clock className="h-6 w-6 text-green-500" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Account Type Card */}
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Account Type</p>
                                            <p className="text-2xl font-bold">{isDefaultDemoUser ? 'Demo' : 'User'}</p>
                                            <p className="text-xs text-purple-600 flex items-center gap-1">
                                                <Shield className="h-3 w-3" />
                                                {isDefaultDemoUser ? 'Read-only access' : 'Full access'}
                                            </p>
                                        </div>
                                        <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                                            <Shield className="h-6 w-6 text-purple-500" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Settings Status Card */}
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Settings</p>
                                            <p className="text-2xl font-bold">{hasChanges ? 'Modified' : 'Saved'}</p>
                                            <p className="text-xs text-orange-600 flex items-center gap-1">
                                                <Settings className="h-3 w-3" />
                                                {hasChanges ? 'Unsaved changes' : 'All saved'}
                                            </p>
                                        </div>
                                        <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                                            <Settings className="h-6 w-6 text-orange-500" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Main Content Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Profile Information Widget */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-base font-medium">Profile Information</CardTitle>
                                    <User className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {profile && (
                                            <>
                                                <div className="flex items-center gap-4">
                                                    <UserAvatar
                                                        name={profile.name}
                                                        email={profile.email}
                                                        size="lg"
                                                        imageUrl={profile.image}
                                                    />
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-lg">{profile.name}</h3>
                                                        <p className="text-sm text-muted-foreground">{profile.email}</p>
                                                        <Badge variant="outline" className="mt-1">
                                                            Member since {new Date(profile.createdAt).toLocaleDateString()}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                {!isEditing ? (
                                                    <div className="space-y-3">
                                                        <Button
                                                            onClick={() => setIsEditing(true)}
                                                            className="w-full"
                                                            disabled={isLoading || isDefaultDemoUser}
                                                        >
                                                            <Edit3 className="h-4 w-4 mr-2" />
                                                            {isDefaultDemoUser ? 'Edit Profile (Read-only)' : 'Edit Profile'}
                                                        </Button>
                                                        {isDefaultDemoUser && (
                                                            <p className="text-xs text-amber-600 text-center">
                                                                Default demo account is read-only to preserve the demo experience
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        <div>
                                                            <Label htmlFor="name">Name</Label>
                                                            <Input
                                                                id="name"
                                                                value={formData.name}
                                                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                                                placeholder="Enter your name"
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="email">Email</Label>
                                                            <Input
                                                                id="email"
                                                                type="email"
                                                                value={formData.email}
                                                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                                                placeholder="Enter your email"
                                                                className={formData.email !== profile?.email ? 'border-orange-300' : ''}
                                                            />
                                                            {formData.email !== profile?.email && (
                                                                <p className="text-xs text-orange-600 mt-1">
                                                                    Email change will require verification in a production app
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                onClick={handleProfileUpdate}
                                                                disabled={isLoading}
                                                                className="flex-1"
                                                            >
                                                                <Save className="h-4 w-4 mr-2" />
                                                                Save Changes
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                onClick={() => {
                                                                    setIsEditing(false);
                                                                    setFormData({
                                                                        name: profile.name,
                                                                        email: profile.email
                                                                    });
                                                                }}
                                                                disabled={isLoading}
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Security Settings Widget */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-base font-medium">Security Settings</CardTitle>
                                    <Shield className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {/* Password Change - Only show for non-default demo users */}
                                        {!isDefaultDemoUser && (
                                            <div>
                                                {!isChangingPassword ? (
                                                    <Button
                                                        onClick={() => setIsChangingPassword(true)}
                                                        variant="outline"
                                                        className="w-full"
                                                        disabled={isLoading}
                                                    >
                                                        <Shield className="h-4 w-4 mr-2" />
                                                        Change Password
                                                    </Button>
                                                ) : (
                                                    <div className="space-y-3">
                                                        <div>
                                                            <Label htmlFor="currentPassword" className="text-xs">Current Password</Label>
                                                            <div className="relative">
                                                                <Input
                                                                    id="currentPassword"
                                                                    type={showCurrentPassword ? "text" : "password"}
                                                                    value={passwordData.currentPassword}
                                                                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                                                                    placeholder="Current password"
                                                                    className="text-sm"
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                                >
                                                                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="newPassword" className="text-xs">New Password</Label>
                                                            <div className="relative">
                                                                <Input
                                                                    id="newPassword"
                                                                    type={showNewPassword ? "text" : "password"}
                                                                    value={passwordData.newPassword}
                                                                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                                                                    placeholder="New password"
                                                                    className="text-sm"
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                                >
                                                                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="confirmPassword" className="text-xs">Confirm Password</Label>
                                                            <div className="relative">
                                                                <Input
                                                                    id="confirmPassword"
                                                                    type={showConfirmPassword ? "text" : "password"}
                                                                    value={passwordData.confirmPassword}
                                                                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                                                    placeholder="Confirm password"
                                                                    className="text-sm"
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                                >
                                                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                onClick={handlePasswordChange}
                                                                disabled={isLoading}
                                                                size="sm"
                                                                className="flex-1"
                                                            >
                                                                <Save className="h-4 w-4 mr-2" />
                                                                Save
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                onClick={() => {
                                                                    setIsChangingPassword(false);
                                                                    setPasswordData({
                                                                        currentPassword: '',
                                                                        newPassword: '',
                                                                        confirmPassword: ''
                                                                    });
                                                                }}
                                                                disabled={isLoading}
                                                                size="sm"
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Demo User Features */}
                                        <div className="pt-4 border-t">
                                            {isDefaultDemoUser ? (
                                                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                                                    <h4 className="font-medium mb-2 text-amber-900 dark:text-amber-100">Default Demo Account</h4>
                                                    <p className="text-sm text-amber-700 dark:text-amber-300">
                                                        This is the default demo account (John Doe). Password changes and generation are disabled
                                                        to preserve the demo experience for all users.
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                                                    <h4 className="font-medium mb-2 text-blue-900 dark:text-blue-100">Password Reset for Demo Users</h4>
                                                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                                                        Demo users can generate a new random password.
                                                    </p>
                                                    <Button
                                                        onClick={handlePasswordReset}
                                                        variant="outline"
                                                        className="w-full"
                                                        size="sm"
                                                    >
                                                        <Shield className="h-4 w-4 mr-2" />
                                                        Generate New Password
                                                    </Button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Sign Out */}
                                        <div className="pt-4 border-t">
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="outline" className="w-full" disabled={isLoading}>
                                                        <LogOut className="h-4 w-4 mr-2" />
                                                        Sign Out
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure you want to sign out?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            You will be signed out of your account and redirected to the login page.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={handleLogout} className="bg-blue-600 text-white hover:bg-blue-700">
                                                            Sign Out
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Pomodoro Settings */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    Pomodoro Timer Settings
                                    {isDefaultDemoUser && (
                                        <Badge variant="secondary" className="ml-2">
                                            Read-only
                                        </Badge>
                                    )}
                                </CardTitle>
                                <CardDescription>
                                    {isDefaultDemoUser
                                        ? "Default demo account settings are read-only to preserve the demo experience"
                                        : "Customize your Pomodoro timer durations and session preferences"
                                    }
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {isDefaultDemoUser ? (
                                    <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                                        <h4 className="font-medium mb-2 text-amber-900 dark:text-amber-100">Default Demo Account</h4>
                                        <p className="text-sm text-amber-700 dark:text-amber-300">
                                            This is the default demo account (John Doe). Pomodoro settings are read-only
                                            to preserve the demo experience for all users. To access customizable settings,
                                            create a new account through the demo access flow.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Notification Settings */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Bell className="h-5 w-5" />
                                    Notification Preferences
                                    {isDefaultDemoUser ? (
                                        <Badge variant="secondary" className="ml-2">
                                            Read-only
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary" className="ml-2">
                                            Demo Mode
                                        </Badge>
                                    )}
                                </CardTitle>
                                <CardDescription>
                                    {isDefaultDemoUser
                                        ? "Default demo account settings are read-only to preserve the demo experience"
                                        : "Configure your notification preferences (Demo: No real emails sent)"
                                    }
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {isDefaultDemoUser ? (
                                    <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                                        <h4 className="font-medium mb-2 text-amber-900 dark:text-amber-100">Default Demo Account</h4>
                                        <p className="text-sm text-amber-700 dark:text-amber-300">
                                            This is the default demo account (John Doe). Notification settings are read-only
                                            to preserve the demo experience for all users. To access customizable settings,
                                            create a new account through the demo access flow.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                            <div className="flex items-start gap-2">
                                                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                                                <div className="text-sm text-blue-800">
                                                    <p className="font-medium">Demo Mode Notice</p>
                                                    <p>These are mock notification preferences. In production, this would integrate with email services like SendGrid, AWS SES, or similar.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                            </div>

                                            <div className="space-y-4">
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
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Production Features Info */}
                        <Card className="border-blue-200 dark:border-blue-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                    <Info className="h-5 w-5" />
                                    Production Features
                                </CardTitle>
                                <CardDescription>
                                    Features that would be available in a production application
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                                    <h4 className="font-medium mb-2 text-blue-900 dark:text-blue-100">Email Notifications</h4>
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        In production, users would receive email notifications for task reminders, daily summaries,
                                        weekly reports, and Pomodoro session completions. This demo shows the UI/UX for notification settings.
                                    </p>
                                </div>
                                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                                    <h4 className="font-medium mb-2 text-green-900 dark:text-green-100">Real-time Collaboration</h4>
                                    <p className="text-sm text-green-700 dark:text-green-300">
                                        Production apps would include real-time task sharing, team collaboration,
                                        and live updates when team members complete tasks or start Pomodoro sessions.
                                    </p>
                                </div>
                                <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                                    <h4 className="font-medium mb-2 text-purple-900 dark:text-purple-100">Advanced Analytics</h4>
                                    <p className="text-sm text-purple-700 dark:text-purple-300">
                                        Enhanced analytics would include productivity trends, time tracking insights,
                                        team performance metrics, and AI-powered productivity recommendations.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}