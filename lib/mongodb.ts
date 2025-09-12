import mongoose from "mongoose";

export const connectDB = async () => {
    if (mongoose.connection && mongoose.connection.readyState >= 1) return;
    try {
        const connection = await mongoose.connect(process.env.MONGODB_URI!);
        console.log("Connected to MongoDB:", connection.connection.host);
        return connection;
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        throw error;
    }
}