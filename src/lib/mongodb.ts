import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let isConnected = false;

async function connectDB() {
    if (isConnected) {
        return;
    }

    try {
        await mongoose.connect(MONGODB_URI, {
            bufferCommands: false,
            serverSelectionTimeoutMS: 5000, // 5 second timeout
        });
        isConnected = true;
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);

        // Provide helpful error message for common issues
        if (error instanceof Error) {
            if (error.message.includes('whitelist')) {
                throw new Error('MongoDB Atlas IP not whitelisted. Please add your current IP to the Atlas cluster whitelist.');
            } else if (error.message.includes('authentication')) {
                throw new Error('MongoDB authentication failed. Please check your credentials.');
            } else if (error.message.includes('timeout')) {
                throw new Error('MongoDB connection timeout. Please check your network connection.');
            }
        }

        throw error;
    }
}

export default connectDB;