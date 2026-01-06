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
    return true; // Return true to allow registration to proceed
  }

  try {
    if (!ZEPTOMAIL_SEND_TOKEN) {
      console.error("❌ [ZeptoMail] ZEPTOMAIL_SEND_TOKEN is not configured");
      console.error(
        "❌ [ZeptoMail] Please set ZEPTOMAIL_SEND_TOKEN in your environment variables"
      );
      if (isProduction) {
        console.error("❌ [ZeptoMail] PRODUCTION: Check your hosting platform's environment variable settings");
      }
      return false;
    }

    // Validate token format (should not contain "Zoho-enczapikey" prefix, just the token)
    const tokenValue = ZEPTOMAIL_SEND_TOKEN.startsWith("Zoho-enczapikey ")
      ? ZEPTOMAIL_SEND_TOKEN.replace("Zoho-enczapikey ", "")
      : ZEPTOMAIL_SEND_TOKEN;


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
    }

    // Try alternative header format if the standard one fails
    // Some ZeptoMail configurations might require different format
    const requestHeaders: Record<string, string> = {
      Authorization: `Zoho-enczapikey ${authToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    // Add timeout to prevent hanging requests (30 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    let response: Response;
    try {
      response = await fetch(ZEPTOMAIL_API_URL, {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        console.error("❌ [ZeptoMail] Request timed out after 30 seconds");
      } else {
        console.error("❌ [ZeptoMail] Fetch error:", fetchError instanceof Error ? fetchError.message : String(fetchError));
      }
      return false;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [ZeptoMail] Request failed:", response.status, response.statusText);
      
      try {
        const errorJson = JSON.parse(errorText);
        if (response.status === 401) {
          const errorCode = errorJson?.error?.details?.[0]?.code;
          if (errorCode === "SERR_157") {
            console.error("❌ [ZeptoMail] Invalid API token. Check ZEPTOMAIL_SEND_TOKEN and ensure FROM_EMAIL matches Mail Agent domain");
          }
        }
      } catch (e) {
        // Error response is not JSON
      }

      return false;
    }

    // Verify the response indicates success
    if (response.status >= 200 && response.status < 300) {
      return true;
    } else {
      const responseText = await response.text();
      console.error("❌ [ZeptoMail] Unexpected response status:", response.status);
      return false;
    }
  } catch (error) {
    console.error("❌ [ZeptoMail] Exception:", error instanceof Error ? error.message : String(error));
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
              <div style="background:#f1f5f9; border:2px dashed #3c6e71; border-radius:8px; padding:24px; text-align:center; margin:24px 0;">
                <div style="font-size:36px; font-weight:700; color:#3c6e71; letter-spacing:8px; font-family:monospace;">
                  ${otp}
                </div>
              </div>
            </td>
          </tr>

          <!-- Expiry / Safety -->
          <tr>
            <td style="padding-bottom:16px; color:#555;">
              This code will expire in 10 minutes and can be used up to 3 times.
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

This code expires in 10 minutes and can be used up to 3 times.

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
