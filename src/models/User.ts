import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import type { User } from '@/types';

const userSchema = new Schema<User>({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    settings: {
        pomodoro: {
            workDuration: { type: Number, default: 25 },
            shortBreakDuration: { type: Number, default: 5 },
            longBreakDuration: { type: Number, default: 15 },
            sessionsUntilLongBreak: { type: Number, default: 4 }
        },
        notifications: {
            taskReminders: { type: Boolean, default: true },
            dailySummary: { type: Boolean, default: true },
            weeklySummary: { type: Boolean, default: true },
            pomodoroNotifications: { type: Boolean, default: true },
            securityAlerts: { type: Boolean, default: true }
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        try {
            this.password = await bcrypt.hash(this.password, 10);
        } catch (error) {
            return next(error as Error);
        }
    }
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.User || mongoose.model<User>('User', userSchema);