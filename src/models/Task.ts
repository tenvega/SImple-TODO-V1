import mongoose, { Schema } from 'mongoose';
import type { Task } from '@/types';

const taskSchema = new Schema<Task>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    createdDate: {
        type: Date,
        default: Date.now
    },
    dueDate: {
        type: Date
    },
    completed: {
        type: Boolean,
        default: false
    },
    completedDate: {
        type: Date
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    tags: [String],
    timeSpent: {
        type: Number,
        default: 0
    },
    pomodoroCount: {
        type: Number,
        default: 0
    }
});

// Add index for better query performance
taskSchema.index({ userId: 1, completed: 1 });
taskSchema.index({ userId: 1, createdDate: -1 });

export default mongoose.models.Task || mongoose.model<Task>('Task', taskSchema);