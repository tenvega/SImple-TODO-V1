import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import { Task } from '../models/Task.js';
import { TimeTracking } from '../models/TimeTracking.js';

dotenv.config();

const USERS = 3;
const TASKS_PER_USER = 20;
const PRIORITIES = ['low', 'medium', 'high'];
const TAGS = ['work', 'personal', 'study', 'health', 'project'];

async function generateUsers() {
    const users = [];
    for (let i = 0; i < USERS; i++) {
        const password = await bcrypt.hash('password123', 10);
        users.push({
            name: `Test User ${i + 1}`,
            email: `user${i + 1}@test.com`,
            password
        });
    }
    return User.insertMany(users);
}

async function generateTasks(users) {
    const tasks = [];
    const now = new Date();
    
    for (const user of users) {
        for (let i = 0; i < TASKS_PER_USER; i++) {
            // Random date within last 30 days
            const createdDate = new Date(now - Math.random() * 30 * 24 * 60 * 60 * 1000);
            const dueDate = new Date(createdDate.getTime() + Math.random() * 14 * 24 * 60 * 60 * 1000);
            
            const completed = Math.random() > 0.4;
            const completionDate = completed ? 
                new Date(dueDate.getTime() + (Math.random() > 0.7 ? 1 : -1) * Math.random() * 24 * 60 * 60 * 1000) : 
                null;

            tasks.push({
                userId: user._id,
                title: `Task ${i + 1} for ${user.name}`,
                description: `Description for task ${i + 1}`,
                createdDate,
                dueDate,
                completed,
                completionDate,
                completedLate: completed && completionDate > dueDate,
                priority: PRIORITIES[Math.floor(Math.random() * PRIORITIES.length)],
                tags: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, 
                    () => TAGS[Math.floor(Math.random() * TAGS.length)]),
                pomodoroCount: Math.floor(Math.random() * 5),
                timeSpent: Math.floor(Math.random() * 7200) // Up to 2 hours
            });
        }
    }
    return Task.insertMany(tasks);
}

async function generateTimeTracking(tasks) {
    const timeRecords = [];
    
    for (const task of tasks) {
        if (task.pomodoroCount > 0) {
            for (let i = 0; i < task.pomodoroCount; i++) {
                const startTime = new Date(task.createdDate.getTime() + Math.random() * 24 * 60 * 60 * 1000);
                const endTime = new Date(startTime.getTime() + 25 * 60 * 1000); // 25 minutes

                timeRecords.push({
                    userId: task.userId,
                    taskId: task._id,
                    startTime,
                    endTime,
                    duration: 1500, // 25 minutes in seconds
                    type: 'pomodoro'
                });
            }
        }
    }
    return TimeTracking.insertMany(timeRecords);
}

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing data
        await Promise.all([
            User.deleteMany({}),
            Task.deleteMany({}),
            TimeTracking.deleteMany({})
        ]);
        console.log('Cleared existing data');

        // Generate new data
        const users = await generateUsers();
        console.log(`Created ${users.length} users`);

        const tasks = await generateTasks(users);
        console.log(`Created ${tasks.length} tasks`);

        const timeRecords = await generateTimeTracking(tasks);
        console.log(`Created ${timeRecords.length} time tracking records`);

        console.log('Seeding completed successfully');
    } catch (error) {
        console.error('Seeding error:', error);
    } finally {
        await mongoose.connection.close();
    }
}

seed(); 