const mongoose = require('mongoose');
require('dotenv').config();

async function connectToMongo() {
    try {
        await mongoose.connect(process.env.DB_URL, {
            serverSelectionTimeoutMS: 5000, // fail hurtigt hvis DB ikke svarer
        });

        console.log("Connected to MongoDB");
    } catch (err) {
        console.error("❌ Could not connect to MongoDB");
        console.error(err.message);

        // Stop serveren – Railway genstarter automatisk
        process.exit(1);
    }

    // Hvis Mongo mister forbindelsen efter start
    mongoose.connection.on("error", (err) => {
        console.error("❌ MongoDB connection error:", err);
        process.exit(1); // crash → Railway genstarter
    });

    mongoose.connection.on("disconnected", () => {
        console.error("❌ MongoDB disconnected");
        process.exit(1); // crash → Railway genstarter
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
        await mongoose.connection.close();
        console.log("MongoDB connection closed");
        process.exit(0);
    });
}

module.exports = { connectToMongo };
