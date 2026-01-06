import { z } from "zod";

const envSchema = z.object({
  // Node Environment
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // MongoDB
  MONGODB_URI: z
    .string()
    .min(1, "MONGODB_URI is required")
    .url("MONGODB_URI must be a valid URL")
    .refine(
      (url) => url.startsWith("mongodb://") || url.startsWith("mongodb+srv://"),
      "MONGODB_URI must be a MongoDB connection string"
    ),

  // JWT
  JWT_SECRET: z
    .string()
    .trim()
    .min(24, "JWT_SECRET must be at least 24 characters long")
    .describe("Secret key for signing JWT tokens"),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z
    .string()
    .min(1, "CLOUDINARY_CLOUD_NAME is required"),
  CLOUDINARY_API_KEY: z
    .string()
    .min(1, "CLOUDINARY_API_KEY is required"),
  CLOUDINARY_API_SECRET: z
    .string()
    .min(1, "CLOUDINARY_API_SECRET is required"),

  // Upstash Redis (optional - for rate limiting)
  UPSTASH_REDIS_REST_URL: z
    .string()
    .url("UPSTASH_REDIS_REST_URL must be a valid URL")
    .optional(),
  UPSTASH_REDIS_REST_TOKEN: z
    .string()
    .optional(),

  // Rate Limiting
  RATE_LIMIT_ENABLED: z
    .enum(["true", "false"])
    .optional()
    .default("true"),
  RATE_LIMIT_BYPASS_KEY: z
    .string()
    .optional(),

  // Socket.IO (optional)
  NEXT_PUBLIC_SOCKET_URL: z
    .string()
    .url("NEXT_PUBLIC_SOCKET_URL must be a valid URL")
    .optional(),
  SOCKET_SERVER_URL: z
    .string()
    .url("SOCKET_SERVER_URL must be a valid URL")
    .optional()
    .describe("URL of the external Socket.IO server (e.g., https://your-socket-server.onrender.com)"),

  // Server Configuration (optional)
  HOSTNAME: z
    .string()
    .optional()
    .default("localhost"),
  PORT: z
    .string()
    .regex(/^\d+$/, "PORT must be a number")
    .optional()
    .default("3000"),

  // GlitchTip Error Monitoring (optional)
  NEXT_PUBLIC_GLITCHTIP_DSN: z
    .string()
    .url("NEXT_PUBLIC_GLITCHTIP_DSN must be a valid URL")
    .optional(),
  GLITCHTIP_ENVIRONMENT: z
    .string()
    .optional()
    .default("development"),
  GLITCHTIP_ENABLED: z
    .enum(["true", "false"])
    .optional()
    .default("false"),

  // Razorpay Payment Processing (optional - for subscription features)
  RAZORPAY_KEY_ID: z
    .string()
    .min(1, "RAZORPAY_KEY_ID is required for subscription features")
    .optional(),
  RAZORPAY_KEY_SECRET: z
    .string()
    .min(1, "RAZORPAY_KEY_SECRET is required for subscription features")
    .optional(),
  RAZORPAY_WEBHOOK_SECRET: z
    .string()
    .min(1, "RAZORPAY_WEBHOOK_SECRET is required for webhook verification")
    .optional(),
  RAZORPAY_PLAN_PRO_MONTHLY: z
    .string()
    .optional()
    .describe("Razorpay Plan ID for Pro monthly subscription"),
  RAZORPAY_PLAN_PRO_YEARLY: z
    .string()
    .optional()
    .describe("Razorpay Plan ID for Pro yearly subscription"),

  // AWS SES (deprecated - kept for backward compatibility during migration)
  AWS_ACCESS_KEY_ID: z
    .string()
    .optional(),
  AWS_SECRET_ACCESS_KEY: z
    .string()
    .optional(),
  AWS_SES_REGION: z
    .string()
    .optional(),
  AWS_SES_FROM_EMAIL: z
    .string()
    .optional(),
  
  // Zoho ZeptoMail (for email verification and password reset)
  ZEPTOMAIL_API_HOST: z
    .string()
    .optional()
    .default("api.zeptomail.com")
    .describe("ZeptoMail API host (api.zeptomail.com for global, api.zeptomail.in for India, api.zeptomail.eu for Europe)"),
  ZEPTOMAIL_SEND_TOKEN: z
    .string()
    .min(1, "ZEPTOMAIL_SEND_TOKEN is required for email sending")
    .optional(),
  ZEPTOMAIL_FROM_EMAIL: z
    .string()
    .email("ZEPTOMAIL_FROM_EMAIL must be a valid email address")
    .min(1, "ZEPTOMAIL_FROM_EMAIL is required")
    .optional(),
  ZEPTOMAIL_FROM_NAME: z
    .string()
    .optional()
    .describe("Display name for email sender"),
  SKIP_EMAIL_IN_DEV: z
    .enum(["true", "false"])
    .optional()
    .default("false")
    .describe("Skip email sending in development (set to 'true' to bypass email sending)"),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .optional(),
});

export const env = (() => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError && error.issues && Array.isArray(error.issues)) {
      // Separate errors into missing vs invalid
      const missingVars = error.issues
        .filter((e) => e.code === "invalid_type" && "received" in e && e.received === "undefined")
        .map((e) => ({
          name: e.path.join("."),
          message: e.message,
        }));

      const invalidVars = error.issues
        .filter((e) => e.code !== "invalid_type" || !("received" in e) || e.received !== "undefined")
        .map((e) => ({
          name: e.path.join("."),
          message: e.message,
          code: e.code,
        }));

      console.error("❌ Environment variable validation failed!\n");

      if (missingVars.length > 0) {
        console.error("Missing required variables:");
        missingVars.forEach(({ name, message }: { name: string; message: string }) => {
          console.error(`  - ${name}: ${message}`);
        });
        console.error("");
      }

      if (invalidVars.length > 0) {
        console.error("Invalid variables (values don't meet requirements):");
        invalidVars.forEach(({ name, message }: { name: string; message: string }) => {
          console.error(`  - ${name}`);
          console.error(`    ${message}`);
          
          // Provide helpful hints for common issues
          if (name === "JWT_SECRET") {
            const currentValue = process.env.JWT_SECRET || "";
            const currentLength = currentValue.trim().length;
            console.error(`    💡 Current length: ${currentLength} characters`);
            console.error(`    💡 Generate a secure secret with: openssl rand -base64 32`);
            console.error(`    💡 Or use Node.js: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`);
          }
        });
        console.error("");
      }

      console.error(
        "Please check your .env.local file and ensure all variables meet the requirements above."
      );

      // In production, throw error to prevent app from starting
      if (process.env.NODE_ENV === "production") {
        const errorSummary = [
          ...missingVars.map((v: { name: string; message: string }) => `${v.name}: ${v.message}`),
          ...invalidVars.map((v: { name: string; message: string }) => `${v.name}: ${v.message}`),
        ].join("\n");
        throw new Error(
          `Environment variable validation failed:\n${errorSummary}\n\nPlease check your .env.local file.`
        );
      }
    } else {
      // Not a ZodError or unexpected error structure
      console.error("❌ Unexpected error during environment variable validation:", error);
    }

    throw error;
  }
})();

export type Env = z.infer<typeof envSchema>;

