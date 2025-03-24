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

async function seedData() {
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

    // Generate random tasks
    const priorities = ['low', 'medium', 'high'];
    const tags = ['work', 'personal', 'study', 'health', 'project'];
    
    // Create 20 tasks over the last 30 days
    const now = new Date();
    for (let i = 0; i < 20; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const createdDate = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
      
      const task = await Task.create({
        userId: user._id,
        title: `Task ${i + 1}`,
        description: `Description for task ${i + 1}`,
        createdDate,
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        tags: [tags[Math.floor(Math.random() * tags.length)]],
        completed: Math.random() > 0.5,
        completedDate: Math.random() > 0.5 ? new Date() : null
      });

      // Create 1-3 time tracking sessions for each task
      const sessionsCount = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < sessionsCount; j++) {
        const startTime = new Date(createdDate.getTime() + Math.random() * (now - createdDate));
        const duration = Math.floor(Math.random() * 3600) + 1800; // 30-90 minutes
        const endTime = new Date(startTime.getTime() + duration * 1000);

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

    console.log('Seeded test data successfully');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}

seedData(); 