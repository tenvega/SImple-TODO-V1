import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

// User schema
const userSchema = new mongoose.Schema({
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
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        try {
            this.password = await bcrypt.hash(this.password, 10);
        } catch (error) {
            return next(error);
        }
    }
    next();
});

// Task schema
const taskSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
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

// Time tracking schema
const timeTrackingSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        index: true
    },
    taskId: { 
        type: mongoose.Schema.Types.ObjectId, 
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

// Create and export models
export const User = mongoose.model('User', userSchema);
export const Task = mongoose.model('Task', taskSchema);
export const TimeTracking = mongoose.model('TimeTracking', timeTrackingSchema); 