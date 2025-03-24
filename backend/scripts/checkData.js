import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Task, TimeTracking } from '../models/index.js';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

async function checkData() {
  try {
    console.log('MONGO_URI:', process.env.MONGO_URI); // Debug log
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const tasks = await Task.find({});
    const timeTrackings = await TimeTracking.find({});

    console.log('\nDatabase Contents:');
    console.log('----------------');
    console.log('Tasks:', tasks.length);
    console.log('Time Trackings:', timeTrackings.length);

    if (tasks.length > 0) {
      console.log('\nSample Task:');
      console.log(JSON.stringify(tasks[0], null, 2));
    }

    if (timeTrackings.length > 0) {
      console.log('\nSample Time Tracking:');
      console.log(JSON.stringify(timeTrackings[0], null, 2));
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkData(); 