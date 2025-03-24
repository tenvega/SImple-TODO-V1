require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Successfully connected to MongoDB!');
        
        // Try to perform a simple operation
        const collections = await mongoose.connection.db.collections();
        console.log('Available collections:', collections.map(c => c.collectionName));
        
    } catch (error) {
        console.error('MongoDB connection test failed:', error);
    } finally {
        await mongoose.connection.close();
    }
}

testConnection(); 