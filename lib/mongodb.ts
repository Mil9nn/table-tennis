import mongoose from "mongoose";

let cached = (global as any).mongoose;

if (!cached) {
    cached = (global as any).mongoose = { conn: null, promise: null, modelsRegistered: false };
}

/**
 * Ensure all discriminator models are registered
 * This is critical for Next.js API routes with hot reloading
 */
async function ensureModelsRegistered() {
    // Skip if already registered in this process
    if (cached.modelsRegistered) {
        return;
    }

    try {
        // CRITICAL: Import models in correct order to ensure discriminators are registered
        // Using dynamic imports to work with Next.js ES modules

        // 1. Import base models first
        await import('@/models/MatchBase');

        // 2. Import discriminators (this registers them on base models)
        await import('@/models/IndividualMatch');
        await import('@/models/TeamMatch');

        // 3. Import other models
        await import('@/models/Tournament');
        await import('@/models/User');
        await import('@/models/Team');
        await import('@/models/BracketState');

        cached.modelsRegistered = true;
        
    } catch (error) {
        console.error('[MongoDB] ✗ Error registering models:', error);
        throw error;
    }
}

export const connectDB = async () => {
    // 1. Return the existing connection if it exists
    if (cached.conn) {
        // Always ensure models are registered even if connection exists
        await ensureModelsRegistered();
        return cached.conn;
    }

    // 2. Create a new connection if it doesn't exist
    if (!cached.promise) {
        cached.promise = mongoose.connect(process.env.MONGODB_URI!).then(async (mongooseInstance) => {
            
            // Ensure models are registered after successful connection
            await ensureModelsRegistered();

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