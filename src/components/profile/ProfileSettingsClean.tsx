"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { User, Shield, LogOut, Save, Edit3, Eye, EyeOff, Camera } from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileSettingsCleanProps {
    userId: string;
}

interface UserProfile {
    id: string;
    name: string;
    email: string;
    createdAt: string;
    image?: string;
}

export function ProfileSettingsClean({ userId }: ProfileSettingsCleanProps) {
    // ALL HOOKS AT THE TOP - NO EXCEPTIONS
    const { logout } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: ''
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Demo user data
    const demoUsers = useMemo(() => [
        {
            id: '6896489d2dab362ba354ecfd',
            name: 'Demo User',
            email: 'demo@test.com',
            createdAt: '2024-01-15T10:30:00Z',
            image: '/avatars/demo-user.svg'
        },
        {
            id: '6896489d2dab362ba354ed00',
            name: 'John Doe',
            email: 'john@example.com',
            createdAt: '2024-01-10T14:20:00Z',
            image: '/avatars/john-doe.svg'
        },
    ], []);

    // Check if this is the default demo user (John Doe) - should be read-only
    const isDefaultDemoUser = profile?.email === 'john@example.com' || profile?.id === '6896489d2dab362ba354ed00';

    useEffect(() => {
        const fetchProfile = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/users/${userId}`);
                if (response.ok) {
                    const userData = await response.json();
                    setProfile({
                        id: userData._id,
                        name: userData.name,
                        email: userData.email,
                        createdAt: userData.createdAt,
                        image: userData.image
                    });
                    setFormData({
                        name: userData.name,
                        email: userData.email
                    });
                } else {
                    const user = demoUsers.find(u => u.id === userId);
                    if (user) {
                        setProfile(user);
                        setFormData({
                            name: user.name,
                            email: user.email
                        });
                    }
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
                const user = demoUsers.find(u => u.id === userId);
                if (user) {
                    setProfile(user);
                    setFormData({
                        name: user.name,
                        email: user.email
                    });
                }
            }
            setIsLoading(false);
        };

        fetchProfile();
    }, [userId, demoUsers]);

    // ALL FUNCTIONS AFTER HOOKS
    const handleProfileUpdate = async () => {
        if (!formData.name.trim() || !formData.email.trim()) {
            toast.error("Please fill in all required fields.");
            return;
        }

        if (!formData.email.includes('@')) {
            toast.error("Please enter a valid email address.");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            toast.error("Please enter a valid email address format.");
            return;
        }

        if (formData.email !== profile?.email) {
            toast.info("Email change will require verification in a production app.");
        }

        setIsLoading(true);

        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email
                }),
            });

            if (response.ok) {
                const updatedUser = await response.json();
                setProfile(prev => prev ? {
                    ...prev,
                    name: updatedUser.name,
                    email: updatedUser.email
                } : null);
                setIsEditing(false);
                toast.success("Your profile has been successfully updated.");
            } else {
                const error = await response.json();
                toast.error(error.error || "Failed to update profile");
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error("Failed to update profile. Please try again.");
        }

        setIsLoading(false);
    };

    const handlePasswordChange = async () => {
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            toast.error("Please fill in all password fields.");
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error("New password and confirm password do not match.");
            return;
        }

        if (passwordData.newPassword.length < 8) {
            toast.error("Password must be at least 8 characters long.");
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`/api/users/${userId}/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                }),
            });

            if (response.ok) {
                setIsChangingPassword(false);
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                toast.success("Your password has been successfully updated.");
            } else {
                const error = await response.json();
                toast.error(error.error || "Failed to update password");
            }
        } catch (error) {
            console.error('Error updating password:', error);
            toast.error("Failed to update password. Please try again.");
        }

        setIsLoading(false);
    };

    const handleLogout = () => {
        logout(); // This clears the auth state and localStorage
        toast.success("You have been successfully signed out.");
        // The AuthContext will handle the redirect automatically
    };

    // CONDITIONAL RENDERING - NO EARLY RETURNS
    return (
        <div className="space-y-6">
            {/* Loading State */}
            {isLoading && !profile && (
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
            )}

            {/* User Not Found */}
            {!isLoading && !profile && (
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-center text-muted-foreground">User not found</p>
                    </CardContent>
                </Card>
            )}

            {/* Main Content */}
            {profile && (
                <>
                    {/* Profile Information */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <UserAvatar
                                            name={profile.name}
                                            email={profile.email}
                                            size="lg"
                                            imageUrl={profile.image}
                                        />
                                        {isEditing && (
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                                                onClick={() => {
                                                    toast.info("Profile picture upload feature would be implemented here");
                                                }}
                                            >
                                                <Camera className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <User className="h-5 w-5" />
                                            Profile Information
                                        </CardTitle>
                                        <CardDescription>
                                            Update your personal information and account details
                                        </CardDescription>
                                    </div>
                                </div>
                                <Badge variant="outline">
                                    Member since {new Date(profile.createdAt).toLocaleDateString()}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {!isEditing ? (
                                <div className="space-y-3">
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                                        <p className="text-lg font-medium">{profile.name}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                                        <p className="text-lg font-medium">{profile.email}</p>
                                    </div>
                                    <Button
                                        onClick={() => setIsEditing(true)}
                                        className="mt-4"
                                        disabled={isLoading || isDefaultDemoUser}
                                    >
                                        <Edit3 className="h-4 w-4 mr-2" />
                                        {isDefaultDemoUser ? 'Edit Profile (Read-only)' : 'Edit Profile'}
                                    </Button>
                                    {isDefaultDemoUser && (
                                        <p className="text-xs text-amber-600 mt-2">
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
                        </CardContent>
                    </Card>

                    {/* Password Change - Only show for non-default demo users */}
                    {!isDefaultDemoUser && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5" />
                                    Security Settings
                                </CardTitle>
                                <CardDescription>
                                    Change your password to keep your account secure
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {!isChangingPassword ? (
                                    <Button
                                        onClick={() => setIsChangingPassword(true)}
                                        variant="outline"
                                        disabled={isLoading}
                                    >
                                        <Shield className="h-4 w-4 mr-2" />
                                        Change Password
                                    </Button>
                                ) : (
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="currentPassword">Current Password</Label>
                                        <div className="relative">
                                            <Input
                                                id="currentPassword"
                                                type={showCurrentPassword ? "text" : "password"}
                                                value={passwordData.currentPassword}
                                                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                                                placeholder="Enter current password"
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
                                        <Label htmlFor="newPassword">New Password</Label>
                                        <div className="relative">
                                            <Input
                                                id="newPassword"
                                                type={showNewPassword ? "text" : "password"}
                                                value={passwordData.newPassword}
                                                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                                                placeholder="Enter new password"
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
                                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                        <div className="relative">
                                            <Input
                                                id="confirmPassword"
                                                type={showConfirmPassword ? "text" : "password"}
                                                value={passwordData.confirmPassword}
                                                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                                placeholder="Confirm new password"
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
                                        >
                                            <Save className="h-4 w-4 mr-2" />
                                            Update Password
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
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    )}

                    <Separator />

                    {/* Email Change Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Email Management
                            </CardTitle>
                            <CardDescription>
                                How email changes work in a production application
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="p-3 bg-muted rounded-lg">
                                <h4 className="font-medium mb-2">Email Change Process:</h4>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                    <li>• User enters new email address</li>
                                    <li>• System sends verification email to new address</li>
                                    <li>• User clicks verification link in email</li>
                                    <li>• Email is updated after successful verification</li>
                                    <li>• Old email receives notification of change</li>
                                </ul>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                This demo shows the UI/UX for email changes. In production, this would include email verification, security notifications, and proper validation.
                            </p>
                        </CardContent>
                    </Card>

                    <Separator />

                    {/* User Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Demo User Features
                            </CardTitle>
                            <CardDescription>
                                Special features available for demo users
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isDefaultDemoUser ? (
                                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                                    <h4 className="font-medium mb-2 text-amber-900 dark:text-amber-100">Default Demo Account</h4>
                                    <p className="text-sm text-amber-700 dark:text-amber-300">
                                        This is the default demo account (John Doe). Password changes and generation are disabled 
                                        to preserve the demo experience for all users. To access password management features, 
                                        create a new account through the demo access flow.
                                    </p>
                                </div>
                            ) : (
                                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                                    <h4 className="font-medium mb-2 text-blue-900 dark:text-blue-100">Password Reset for Demo Users</h4>
                                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                                        Demo users can generate a new random password. This is useful for testing and demonstration purposes.
                                    </p>
                                    <Button
                                        onClick={async () => {
                                            try {
                                                const response = await fetch(`/api/users/${userId}/reset-password`, {
                                                    method: 'POST',
                                                });
                                                if (response.ok) {
                                                    const data = await response.json();
                                                    toast.success(`New password generated: ${data.newPassword}`);
                                                } else {
                                                    toast.error('Failed to reset password');
                                                }
                                            } catch (error) {
                                                toast.error('Failed to reset password');
                                            }
                                        }}
                                        variant="outline"
                                        size="sm"
                                        disabled={isLoading}
                                    >
                                        <Shield className="h-4 w-4 mr-2" />
                                        Generate New Password
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Separator />

                    {/* Logout Section */}
                    <Card className="border-blue-200 dark:border-blue-800">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                <LogOut className="h-5 w-5" />
                                Sign Out
                            </CardTitle>
                            <CardDescription>
                                Sign out of your account
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" disabled={isLoading}>
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
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
