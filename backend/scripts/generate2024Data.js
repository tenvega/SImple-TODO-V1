import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Task, TimeTracking } from '../models/index.js';
import bcrypt from 'bcrypt';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const PRIORITIES = ['low', 'medium', 'high'];
const TAGS = ['work', 'personal', 'study', 'health', 'project'];

async function generateHistoricalData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Create test user if doesn't exist
        let user = await User.findOne({ email: 'test@example.com' });
        if (!user) {
            user = await User.create({
                email: 'test@example.com',
                name: 'Test User',
                password: await bcrypt.hash('password123', 10)
            });
            console.log('Created test user');
        }

        // Generate data from 2025 until today
        const startDate = new Date(2025, 0, 1); // January 1, 2025
        const endDate = new Date(); // Today

        // Calculate total months
        const totalMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                          (endDate.getMonth() - startDate.getMonth()) + 1;

        console.log(`Generating data from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`);
        console.log(`Total months to generate: ${totalMonths}`);

        for (let i = 0; i < totalMonths; i++) {
            const currentDate = new Date(startDate);
            currentDate.setMonth(startDate.getMonth() + i);
            
            const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
            const tasksPerMonth = Math.floor(Math.random() * 30) + 20; // 20-50 tasks per month

            console.log(`Generating ${tasksPerMonth} tasks for ${currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`);

            for (let j = 0; j < tasksPerMonth; j++) {
                const day = Math.floor(Math.random() * daysInMonth) + 1;
                const createdDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                
                // Don't create tasks in the future
                if (createdDate > endDate) continue;
                
                // Random completion status (60% chance of completion)
                const completed = Math.random() < 0.6;
                const completedDate = completed ? 
                    new Date(createdDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) : null;

                // Don't set completion date in the future
                if (completedDate && completedDate > endDate) continue;

                const task = await Task.create({
                    userId: user._id,
                    title: `Task ${j + 1} - ${currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
                    description: `Description for task ${j + 1}`,
                    createdDate,
                    completedDate,
                    completed,
                    priority: PRIORITIES[Math.floor(Math.random() * PRIORITIES.length)],
                    tags: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, 
                        () => TAGS[Math.floor(Math.random() * TAGS.length)]),
                    pomodoroCount: Math.floor(Math.random() * 5),
                    timeSpent: Math.floor(Math.random() * 7200) // Up to 2 hours
                });

                // Generate time tracking sessions
                const sessionsCount = Math.floor(Math.random() * 5) + 1; // 1-5 sessions per task
                for (let k = 0; k < sessionsCount; k++) {
                    const startTime = new Date(createdDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000);
                    
                    // Don't create sessions in the future
                    if (startTime > endDate) continue;
                    
                    const duration = Math.floor(Math.random() * 3600) + 1800; // 30-90 minutes
                    const endTime = new Date(startTime.getTime() + duration * 1000);

                    // Don't create sessions that end in the future
                    if (endTime > endDate) continue;

                    await TimeTracking.create({
                        userId: user._id,
                        taskId: task._id,
                        startTime,
                        endTime,
                        duration,
                        type: Math.random() > 0.5 ? 'pomodoro' : 'manual'
                    });
                }
            }
        }

        console.log('Successfully generated historical data');
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error generating historical data:', error);
        await mongoose.disconnect();
    }
}

generateHistoricalData(); 