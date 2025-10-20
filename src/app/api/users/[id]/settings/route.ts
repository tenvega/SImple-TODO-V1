import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { UserSettings } from '@/types';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        const { id } = await params;
        const user = await User.findById(id).select('settings');

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(user.settings);
    } catch (error) {
        console.error('Error fetching user settings:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        const { id } = await params;
        const settings: Partial<UserSettings> = await request.json();

        // Validate settings structure
        if (settings.pomodoro) {
            const { workDuration, shortBreakDuration, longBreakDuration, sessionsUntilLongBreak } = settings.pomodoro;

            if (workDuration && (workDuration < 5 || workDuration > 60)) {
                return NextResponse.json(
                    { error: 'Work duration must be between 5 and 60 minutes' },
                    { status: 400 }
                );
            }

            if (shortBreakDuration && (shortBreakDuration < 1 || shortBreakDuration > 30)) {
                return NextResponse.json(
                    { error: 'Short break duration must be between 1 and 30 minutes' },
                    { status: 400 }
                );
            }

            if (longBreakDuration && (longBreakDuration < 5 || longBreakDuration > 60)) {
                return NextResponse.json(
                    { error: 'Long break duration must be between 5 and 60 minutes' },
                    { status: 400 }
                );
            }

            if (sessionsUntilLongBreak && (sessionsUntilLongBreak < 2 || sessionsUntilLongBreak > 10)) {
                return NextResponse.json(
                    { error: 'Sessions until long break must be between 2 and 10' },
                    { status: 400 }
                );
            }
        }

        const user = await User.findByIdAndUpdate(
            id,
            { $set: { settings } },
            { new: true, runValidators: true }
        ).select('settings');

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(user.settings);
    } catch (error) {
        console.error('Error updating user settings:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
