/**
 * Helper script to load environment variables before other modules
 * This must be imported/required BEFORE any other imports that use env vars
 */

const dotenv = require("dotenv");
const path = require("path");

// Load .env files from project root
const projectRoot = process.cwd();
const envLocalPath = path.resolve(projectRoot, ".env.local");
const envPath = path.resolve(projectRoot, ".env");

// Try .env.local first, then fallback to .env
dotenv.config({ path: envLocalPath });
const result = dotenv.config({ path: envPath });

if (result.error && !process.env.MONGODB_URI) {
  console.error("⚠️  Warning: Could not load .env files. Make sure .env exists in project root.");
}

export {};

