import mongoose, { Schema } from 'mongoose';
import type { TimeTracking } from '@/types';

const timeTrackingSchema = new Schema<TimeTracking>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    taskId: {
        type: Schema.Types.ObjectId,
        ref: 'Task'
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date
    },
    duration: {
        type: Number,
        default: 0
    },
    type: {
        type: String,
        enum: ['pomodoro', 'manual'],
        default: 'pomodoro'
    }
});

// Add indexes for better query performance
timeTrackingSchema.index({ userId: 1, startTime: -1 });
timeTrackingSchema.index({ taskId: 1 });

export default mongoose.models.TimeTracking || mongoose.model<TimeTracking>('TimeTracking', timeTrackingSchema);