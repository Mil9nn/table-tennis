import mongoose from "mongoose";

let cached = (global as any).mongoose;

if (!cached) {
    cached = (global as any).mongoose = { conn: null, promise: null };
}

export const connectDB = async () => {
    // 1. Return the existing connection if it exists
    if (cached.conn) {
        return cached.conn;
    }

    // 2. Create a new connection if it doesn't exist
    if (!cached.promise) {
        cached.promise = mongoose.connect(process.env.MONGODB_URI!).then((mongooseInstance) => {
            console.log("Connected to MongoDB:", mongooseInstance.connection.host);
            return mongooseInstance;
        }).catch((error) => {
            console.error("Error connecting to MongoDB:", error);
            cached.promise = null; // Reset promise on failure
            throw error;
        });
    }

    // 3. Await the promise and cache the connection
    cached.conn = await cached.promise;
    return cached.conn;
}

// export const connectDB = async () => {
//     if (mongoose.connection && mongoose.connection.readyState >= 1) return;
//     try {
//         const connection = await mongoose.connect(process.env.MONGODB_URI!);
//         console.log("Connected to MongoDB:", connection.connection.host);
//         return connection;
//     } catch (error) {
//         console.error("Error connecting to MongoDB:", error);
//         throw error;
//     }
// }