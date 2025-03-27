import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { TimeTracking, Task } from '../models/index.js';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

async function analyzeTimeTracking() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get all time tracking records
        const timeTrackings = await TimeTracking.find().populate('taskId', 'title');
        
        console.log('\nTime Tracking Analysis:');
        console.log('=======================');
        console.log(`Total time tracking records: ${timeTrackings.length}`);

        // Group by task
        const timeByTask = timeTrackings.reduce((acc, record) => {
            const taskTitle = record.taskId?.title || 'Unknown Task';
            if (!acc[taskTitle]) {
                acc[taskTitle] = {
                    totalTime: 0,
                    sessions: 0
                };
            }
            acc[taskTitle].totalTime += record.duration;
            acc[taskTitle].sessions += 1;
            return acc;
        }, {});

        console.log('\nTime Distribution by Task:');
        console.log('=========================');
        Object.entries(timeByTask)
            .sort(([,a], [,b]) => b.totalTime - a.totalTime)
            .forEach(([taskTitle, data]) => {
                console.log(`\nTask: ${taskTitle}`);
                console.log(`Total Time: ${Math.round(data.totalTime / 60)} minutes`);
                console.log(`Number of Sessions: ${data.sessions}`);
            });

        // Check for tasks without time tracking
        const allTasks = await Task.find();
        const tasksWithTimeTracking = new Set(timeTrackings.map(tt => tt.taskId?._id?.toString()));
        const tasksWithoutTimeTracking = allTasks.filter(task => !tasksWithTimeTracking.has(task._id.toString()));

        console.log('\nTasks Without Time Tracking:');
        console.log('============================');
        tasksWithoutTimeTracking.forEach(task => {
            console.log(`- ${task.title}`);
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

analyzeTimeTracking(); 