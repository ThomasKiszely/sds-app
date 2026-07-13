const mongoose = require('mongoose');
require('dotenv').config();

function connectToMongo() {
    mongoose.connect(process.env.DB_URL);

    const db = mongoose.connection;

    db.on('error', () => {
        console.error('MongoDB connection error');
    });

    db.once('open', () => {
        console.log('Connected to MongoDB');
    });

    process.on('SIGINT', async() => {
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
        process.exit(0);
    });
}

module.exports = { connectToMongo };