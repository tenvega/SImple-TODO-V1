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

async function updateUserPassword() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find and update the test user
        const password = 'prmngbdtasks123';
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const user = await User.findOneAndUpdate(
            { email: 'test@example.com' },
            { password: hashedPassword },
            { new: true }
        );
        
        if (user) {
            console.log('\nUser password updated successfully:');
            console.log('Email:', user.email);
            console.log('Name:', user.name);
            console.log('New password hash:', user.password);
            
            // Verify the new password
            const isMatch = await bcrypt.compare(password, user.password);
            console.log('\nPassword verification:');
            console.log('Testing new password "prmngbdtasks123":', isMatch ? 'MATCH' : 'NO MATCH');
        } else {
            console.log('Test user not found!');
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

updateUserPassword(); 