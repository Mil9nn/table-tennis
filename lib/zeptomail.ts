import crypto from "crypto";

// ZeptoMail API URL - can be region-specific
// Default: api.zeptomail.com (global)
// India: api.zeptomail.in
// Europe: api.zeptomail.eu
const ZEPTOMAIL_API_HOST =
  process.env.ZEPTOMAIL_API_HOST || "api.zeptomail.com";
const ZEPTOMAIL_API_URL = `https://${ZEPTOMAIL_API_HOST}/v1.1/email`;
const ZEPTOMAIL_SEND_TOKEN = process.env.ZEPTOMAIL_SEND_TOKEN || "";
const FROM_EMAIL = process.env.ZEPTOMAIL_FROM_EMAIL || "noreply@example.com";
const FROM_NAME = process.env.ZEPTOMAIL_FROM_NAME || "TTPro";
const APP_NAME = "TTPro";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const SKIP_EMAIL_IN_DEV = process.env.SKIP_EMAIL_IN_DEV === "true"; // Set to "true" to skip email sending in development
const isProduction = process.env.NODE_ENV === "production";

// Critical warnings for production
if (isProduction) {
  if (APP_URL.includes("localhost") || APP_URL.includes("127.0.0.1")) {
    console.error(
      "❌ [ZeptoMail] CRITICAL: APP_URL is set to localhost in PRODUCTION!"
    );
    console.error(
      "❌ [ZeptoMail] Set NEXT_PUBLIC_APP_URL to your production URL (e.g., https://yourdomain.com)"
    );
    console.error("❌ [ZeptoMail] Emails may contain incorrect links!");
  }
  if (!ZEPTOMAIL_SEND_TOKEN) {
    console.error(
      "❌ [ZeptoMail] CRITICAL: ZEPTOMAIL_SEND_TOKEN is not set in PRODUCTION!"
    );
    console.error("❌ [ZeptoMail] Emails will NOT be sent!");
  }
  if (FROM_EMAIL === "noreply@example.com") {
    console.error(
      "❌ [ZeptoMail] CRITICAL: ZEPTOMAIL_FROM_EMAIL is using default value in PRODUCTION!"
    );
    console.error(
      "❌ [ZeptoMail] Set ZEPTOMAIL_FROM_EMAIL to your verified email address"
    );
  }
}

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
  toName?: string;
  subject: string;
  html: string;
  text: string;
}

async function sendEmail({
  to,
  toName,
  subject,
  html,
  text,
}: SendEmailParams): Promise<boolean> {

  // Development bypass - skip actual email sending if enabled (ONLY in development)
  if (!isProduction && (SKIP_EMAIL_IN_DEV || !ZEPTOMAIL_SEND_TOKEN)) {
    console.warn("⚠️ [ZeptoMail] Email sending skipped in development mode");
    console.warn("  - Email would be sent to:", to);
    console.warn("  - Subject:", subject);
    console.warn(
      "  - To enable email sending, set ZEPTOMAIL_SEND_TOKEN and set SKIP_EMAIL_IN_DEV=false"
    );
    console.warn(
      "  - Or set SKIP_EMAIL_IN_DEV=false to force email sending even in dev"
    );
    return true; // Return true to allow registration to proceed
  }

  // In production, never skip email sending
  if (isProduction && SKIP_EMAIL_IN_DEV) {
    console.warn(
      "⚠️ [ZeptoMail] SKIP_EMAIL_IN_DEV is set to 'true' but we're in PRODUCTION - ignoring this setting"
    );
  }

  try {
    if (!ZEPTOMAIL_SEND_TOKEN) {
      console.error("❌ [ZeptoMail] ZEPTOMAIL_SEND_TOKEN is not configured");
      console.error(
        "❌ [ZeptoMail] Please set ZEPTOMAIL_SEND_TOKEN in your .env.local file"
      );
      return false;
    }

    // Validate token format (should not contain "Zoho-enczapikey" prefix, just the token)
    const tokenValue = ZEPTOMAIL_SEND_TOKEN.startsWith("Zoho-enczapikey ")
      ? ZEPTOMAIL_SEND_TOKEN.replace("Zoho-enczapikey ", "")
      : ZEPTOMAIL_SEND_TOKEN;

    if (tokenValue.length < 20) {
      console.warn(
        "⚠️ [ZeptoMail] Token seems too short. Expected a longer token string."
      );
    }

    if (!FROM_EMAIL || FROM_EMAIL === "noreply@example.com") {
      console.error(
        "❌ [ZeptoMail] ZEPTOMAIL_FROM_EMAIL is not properly configured"
      );
      console.error("❌ [ZeptoMail] Current value:", FROM_EMAIL);
      console.error(
        "❌ [ZeptoMail] Please set ZEPTOMAIL_FROM_EMAIL to your verified email address"
      );
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(FROM_EMAIL)) {
      console.error(
        "❌ [ZeptoMail] ZEPTOMAIL_FROM_EMAIL is not a valid email address"
      );
      console.error("❌ [ZeptoMail] Current value:", FROM_EMAIL);
      return false;
    }

    if (!emailRegex.test(to)) {
      console.error(
        "❌ [ZeptoMail] Recipient email is not a valid email address"
      );
      console.error("❌ [ZeptoMail] Recipient value:", to);
      return false;
    }

    const requestBody = {
      from: {
        address: FROM_EMAIL,
        name: FROM_NAME,
      },
      to: [
        {
          email_address: {
            address: to,
            name: toName || to,
          },
        },
      ],
      subject: subject,
      htmlbody: html,
      textbody: text,
    };

    // Use token value - ensure it doesn't have the prefix already
    // The token should be just the token string, we add "Zoho-enczapikey" prefix in the header
    let authToken = tokenValue.trim();

    // Remove any existing prefix if present
    if (authToken.toLowerCase().startsWith("zoho-enczapikey")) {
      authToken = authToken.replace(/^zoho-enczapikey\s+/i, "").trim();
      console.warn(
        "⚠️ [ZeptoMail] Token had 'Zoho-enczapikey' prefix - removed it"
      );
    }

    // Try alternative header format if the standard one fails
    // Some ZeptoMail configurations might require different format
    const requestHeaders: Record<string, string> = {
      Authorization: `Zoho-enczapikey ${authToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const response = await fetch(ZEPTOMAIL_API_URL, {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [ZeptoMail] Request failed:");
      console.error("  - Status Code:", response.status);
      console.error("  - Status Text:", response.statusText);
      console.error("  - Error Response:", errorText);

      try {
        const errorJson = JSON.parse(errorText);
        console.error("  - Parsed Error:", JSON.stringify(errorJson, null, 2));

        // Provide helpful error messages based on error code
        if (response.status === 401) {
          const errorCode = errorJson?.error?.details?.[0]?.code;
          if (errorCode === "SERR_157") {
            console.error("  - 🔍 TROUBLESHOOTING:");
            console.error("     • The API token is invalid or expired");
            console.error(
              "     • Check your ZeptoMail dashboard for the correct Send Mail Token"
            );
            console.error(
              "     • Ensure the token is copied correctly (no extra spaces)"
            );
            console.error(
              "     • Token should be from: ZeptoMail Dashboard → Mail Agent → Setup Info → API tab"
            );
            console.error(
              "     • Make sure you're using the 'Send Mail Token', not other token types"
            );
            console.error(
              "     • Verify the token hasn't been revoked or regenerated"
            );
            console.error(
              "     • ⚠️  IMPORTANT: The FROM_EMAIL must match the domain of the Mail Agent"
            );
            console.error(`     • Your FROM_EMAIL: ${FROM_EMAIL}`);
            console.error(
              "     • The token must be from the Mail Agent that has this domain verified"
            );
            console.error(
              "     • If you have multiple Mail Agents, ensure you're using the token from the correct one"
            );
          }
        }
      } catch (e) {
        console.error("  - Error response is not JSON");
      }

      return false;
    }

    const responseText = await response.text();
    console.log("✅ [ZeptoMail] Email sent successfully to:", to);

    return true;
  } catch (error) {
    console.error("❌ [ZeptoMail] Exception occurred:");
    console.error(
      "  - Error type:",
      error instanceof Error ? error.constructor.name : typeof error
    );
    console.error(
      "  - Error message:",
      error instanceof Error ? error.message : String(error)
    );

    if (error instanceof Error) {
      console.error("  - Error stack:", error.stack);
    }

    if (error instanceof TypeError && error.message.includes("fetch")) {
      console.error(
        "  - Possible issue: Network error or fetch API not available"
      );
    }

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
      <body style="margin:0; padding:0; background:#ffffff; color:#111; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; font-size:14px; line-height:1.5;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="left" style="padding:24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">

          <!-- Message -->
          <tr>
            <td style="padding-bottom:12px;">
              Hi ${fullName},
            </td>
          </tr>

          <tr>
            <td style="padding-bottom:12px;">
              Please verify your email address to complete your registration for ${APP_NAME}.
            </td>
          </tr>

          <!-- Link (not button) -->
          <tr>
            <td style="padding-bottom:16px;">
              <a
                href="${verificationLink}"
                style="color:#2563eb; text-decoration:underline;"
              >
                Verify your email address
              </a>
            </td>
          </tr>

          <!-- Expiry / Safety -->
          <tr>
            <td style="padding-bottom:16px; color:#555;">
              This link will expire in 24 hours.
              If you didn’t create an account, you can safely ignore this email.
            </td>
          </tr>

          <!-- Signature -->
          <tr>
            <td style="color:#888; font-size:12px;">
              — ${APP_NAME}
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
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
    toName: fullName,
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
      <body style="margin:0; padding:0; background:#ffffff; color:#111; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; font-size:14px; line-height:1.5;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="left" style="padding:24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">

          <!-- Message -->
          <tr>
            <td style="padding-bottom:12px;">
              Hi ${fullName},
            </td>
          </tr>

          <tr>
            <td style="padding-bottom:12px;">
              We received a request to reset your password for ${APP_NAME}.
            </td>
          </tr>

          <!-- Link (not button) -->
          <tr>
            <td style="padding-bottom:16px;">
              <a
                href="${resetLink}"
                style="color:#2563eb; text-decoration:underline;"
              >
                Reset your password
              </a>
            </td>
          </tr>

          <!-- Expiry / Safety -->
          <tr>
            <td style="padding-bottom:16px; color:#555;">
              This link will expire in 1 hour.
              If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
            </td>
          </tr>

          <!-- Signature -->
          <tr>
            <td style="color:#888; font-size:12px;">
              — ${APP_NAME}
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
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
    toName: fullName,
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

  const purposeText =
    purpose === "email_verification"
      ? "verify your email address"
      : "reset your password";

  const expiryText =
    purpose === "email_verification" ? "10 minutes" : "10 minutes";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Verification Code</title>
        <style>${emailStyles}</style>
      </head>
      <body style="margin:0; padding:0; background:#ffffff; color:#111; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; font-size:14px; line-height:1.5;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="left" style="padding:24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">

          <!-- Message -->
          <tr>
            <td style="padding-bottom:12px;">
              Hi ${fullName},
            </td>
          </tr>

          <tr>
            <td style="padding-bottom:12px;">
              Use the following code to ${purposeText}:
            </td>
          </tr>

          <!-- OTP Code -->
          <tr>
            <td style="padding-bottom:16px;">
              <div style="background:#f1f5f9; border:1px solid #e2e8f0; border-radius:6px; padding:20px; text-align:center; font-size:32px; font-weight:600; color:#3c6e71; letter-spacing:4px; font-family:monospace;">
                ${otp}
              </div>
            </td>
          </tr>

          <!-- Expiry / Safety -->
          <tr>
            <td style="padding-bottom:16px; color:#555;">
              This code will expire in ${expiryText}.
              If you didn't request this code, you can safely ignore this email.
            </td>
          </tr>

          <!-- Signature -->
          <tr>
            <td style="color:#888; font-size:12px;">
              — ${APP_NAME}
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
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
    toName: fullName,
    subject: `Your ${APP_NAME} verification code: ${otp}`,
    html,
    text,
  });
}
