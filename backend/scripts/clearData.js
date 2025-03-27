import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Task, TimeTracking } from '../models/index.js';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

async function clearData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear all collections
        await Promise.all([
            User.deleteMany({}),
            Task.deleteMany({}),
            TimeTracking.deleteMany({})
        ]);

        console.log('Successfully cleared all data');
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error clearing data:', error);
        await mongoose.disconnect();
    }
}

clearData(); 