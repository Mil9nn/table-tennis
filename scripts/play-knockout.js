/**
 * Entry point wrapper - loads environment variables before importing TypeScript script
 * This is a .js file so it executes synchronously before ES6 imports are processed
 */

// Load environment variables FIRST using CommonJS require
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
  process.exit(1);
}

// Verify env vars are loaded
if (!process.env.MONGODB_URI) {
  console.error("❌ Error: Environment variables not loaded. Check your .env file.");
  process.exit(1);
}

// Now spawn tsx to run the TypeScript script
// Pass all current env vars to the child process
const { spawn } = require("child_process");

const scriptPath = path.resolve(__dirname, "play-knockout.ts");

// Use tsx from node_modules
const child = spawn("npx", ["tsx", scriptPath], {
  env: process.env,
  stdio: "inherit",
  cwd: process.cwd(),
  shell: true // Required on Windows
});

child.on("error", (error) => {
  console.error("❌ Error running script:", error);
  process.exit(1);
});

child.on("exit", (code) => {
  process.exit(code || 0);
});

