import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/index.js';
import bcrypt from 'bcrypt';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

async function checkUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find the test user
        const user = await User.findOne({ email: 'test@example.com' });
        
        if (user) {
            console.log('\nUser found:');
            console.log('Email:', user.email);
            console.log('Name:', user.name);
            console.log('Password hash:', user.password);
            
            // Test password verification
            const testPassword = 'password123';
            const isMatch = await bcrypt.compare(testPassword, user.password);
            console.log('\nPassword verification:');
            console.log('Testing password "password123":', isMatch ? 'MATCH' : 'NO MATCH');
        } else {
            console.log('Test user not found!');
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkUser(); 