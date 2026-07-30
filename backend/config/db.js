const mongoose = require('mongoose');
const { database } = require('../shared/config');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(database.uri);
        console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    } catch (err) {
        console.error(`❌ MongoDB connection error: ${err.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
