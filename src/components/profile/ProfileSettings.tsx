"use client";

import React from 'react';
import { ProfileSettingsClean } from './ProfileSettingsClean';

interface ProfileSettingsProps {
    userId: string;
}

export function ProfileSettings({ userId }: ProfileSettingsProps) {
    return <ProfileSettingsClean userId={userId} />;
}