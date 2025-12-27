import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import crypto from "crypto";

// Lazy initialization to avoid errors during build
let sesClient: SESClient | null = null;

function getSESClient(): SESClient {
  if (!sesClient) {
    sesClient = new SESClient({
      region: process.env.AWS_SES_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });
  }
  return sesClient;
}

const FROM_EMAIL = process.env.AWS_SES_FROM_EMAIL || "noreply@example.com";
const APP_NAME = "TTPro";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Generate a secure random token
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Generate a 6-digit OTP
export function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
}

async function sendEmail({ to, subject, html, text }: SendEmailParams): Promise<boolean> {
  try {
    const command = new SendEmailCommand({
      Source: FROM_EMAIL,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: html,
            Charset: "UTF-8",
          },
          Text: {
            Data: text,
            Charset: "UTF-8",
          },
        },
      },
    });

    await getSESClient().send(command);
    return true;
  } catch (error) {
    console.error("Failed to send email via SES:", error);
    return false;
  }
}

// Email template styles
const emailStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8f9fa; margin: 0; padding: 20px; }
  .container { max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #284b63 0%, #3c6e71 100%); padding: 32px 24px; text-align: center; }
  .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; }
  .content { padding: 32px 24px; }
  .content h2 { color: #353535; font-size: 20px; margin: 0 0 16px; }
  .content p { color: #5a5a5a; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
  .otp-box { background: #f1f5f9; border: 2px dashed #3c6e71; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0; }
  .otp-code { font-size: 36px; font-weight: 700; color: #3c6e71; letter-spacing: 8px; font-family: monospace; }
  .btn { display: inline-block; background: #3c6e71; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 15px; margin: 16px 0; }
  .btn:hover { background: #284b63; }
  .footer { background: #f8f9fa; padding: 24px; text-align: center; border-top: 1px solid #e9ecef; }
  .footer p { color: #8a8a8a; font-size: 13px; margin: 0; }
  .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px 16px; margin: 16px 0; border-radius: 0 4px 4px 0; }
  .warning p { color: #856404; margin: 0; font-size: 14px; }
`;

export async function sendVerificationEmail(
  email: string,
  fullName: string,
  token: string
): Promise<boolean> {
  const verificationLink = `${APP_URL}/auth/verify-email?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>${emailStyles}</style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏓 ${APP_NAME}</h1>
          </div>
          <div class="content">
            <h2>Welcome, ${fullName}!</h2>
            <p>Thank you for registering with ${APP_NAME}. Please verify your email address to complete your registration and start tracking your table tennis matches.</p>
            <p style="text-align: center;">
              <a href="${verificationLink}" class="btn">Verify Email Address</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f1f5f9; padding: 12px; border-radius: 4px; font-size: 13px; color: #3c6e71;">
              ${verificationLink}
            </p>
            <div class="warning">
              <p><strong>This link expires in 24 hours.</strong> If you didn't create an account with ${APP_NAME}, please ignore this email.</p>
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Welcome to ${APP_NAME}, ${fullName}!

Please verify your email address by clicking the link below:

${verificationLink}

This link expires in 24 hours.

If you didn't create an account with ${APP_NAME}, please ignore this email.

© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
  `;

  return sendEmail({
    to: email,
    subject: `Verify your email for ${APP_NAME}`,
    html,
    text,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  fullName: string,
  token: string
): Promise<boolean> {
  const resetLink = `${APP_URL}/auth/reset-password?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>${emailStyles}</style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏓 ${APP_NAME}</h1>
          </div>
          <div class="content">
            <h2>Password Reset Request</h2>
            <p>Hi ${fullName},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <p style="text-align: center;">
              <a href="${resetLink}" class="btn">Reset Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f1f5f9; padding: 12px; border-radius: 4px; font-size: 13px; color: #3c6e71;">
              ${resetLink}
            </p>
            <div class="warning">
              <p><strong>This link expires in 1 hour.</strong> If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Password Reset Request

Hi ${fullName},

We received a request to reset your password. Click the link below to create a new password:

${resetLink}

This link expires in 1 hour.

If you didn't request a password reset, please ignore this email. Your password will remain unchanged.

© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
  `;

  return sendEmail({
    to: email,
    subject: `Reset your password for ${APP_NAME}`,
    html,
    text,
  });
}

export async function sendOTPEmail(
  email: string,
  fullName: string,
  otp: string,
  purpose: "email_verification" | "password_reset"
): Promise<boolean> {
  const purposeText = purpose === "email_verification" 
    ? "verify your email address" 
    : "reset your password";
  
  const expiryText = purpose === "email_verification" 
    ? "10 minutes" 
    : "10 minutes";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Verification Code</title>
        <style>${emailStyles}</style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏓 ${APP_NAME}</h1>
          </div>
          <div class="content">
            <h2>Your Verification Code</h2>
            <p>Hi ${fullName},</p>
            <p>Use the following code to ${purposeText}:</p>
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
            </div>
            <div class="warning">
              <p><strong>This code expires in ${expiryText}.</strong> If you didn't request this code, please ignore this email.</p>
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Your Verification Code

Hi ${fullName},

Use the following code to ${purposeText}:

${otp}

This code expires in ${expiryText}.

If you didn't request this code, please ignore this email.

© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
  `;

  return sendEmail({
    to: email,
    subject: `Your ${APP_NAME} verification code: ${otp}`,
    html,
    text,
  });
}

