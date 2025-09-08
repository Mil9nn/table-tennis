import mongoose from "mongoose";

// 🔥 Global cache for Next.js (avoids multiple connections in dev & hot reload)
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export const connectDB = async () => {
  if (cached.conn) {
    return cached.conn; // ✅ already connected
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGODB_URI || "", {
        bufferCommands: false,
      })
      .then((mongoose) => mongoose);
  }

  try {
    cached.conn = await cached.promise;
    console.log("✅ MongoDB connected:", cached.conn.connection.host);
    return cached.conn;
  } catch (error) {
    cached.promise = null; // reset promise if connection fails
    console.error("❌ MongoDB connection error:", error);
    throw error;
  } 
};
