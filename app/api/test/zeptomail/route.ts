import { NextRequest, NextResponse } from "next/server";

/**
 * ZeptoMail Test Endpoint
 * 
 * Use this endpoint to test your ZeptoMail configuration
 * DELETE THIS FILE before deploying to production
 * 
 * Test: GET /api/test/zeptomail
 */

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "This endpoint is only available in development" },
      { status: 403 }
    );
  }

  const ZEPTOMAIL_API_HOST = process.env.ZEPTOMAIL_API_HOST || "api.zeptomail.com";
  const ZEPTOMAIL_API_URL = `https://${ZEPTOMAIL_API_HOST}/v1.1/email`;
  const ZEPTOMAIL_SEND_TOKEN = process.env.ZEPTOMAIL_SEND_TOKEN || "";
  const FROM_EMAIL = process.env.ZEPTOMAIL_FROM_EMAIL || "";

  // Clean token
  let authToken = ZEPTOMAIL_SEND_TOKEN.trim();
  if (authToken.toLowerCase().startsWith("zoho-enczapikey")) {
    authToken = authToken.replace(/^zoho-enczapikey\s+/i, "").trim();
  }

  const testPayload = {
    from: {
      address: FROM_EMAIL,
      name: "TTPro Test",
    },
    to: [
      {
        email_address: {
          address: FROM_EMAIL, // Send to yourself for testing
          name: "Test User",
        },
      },
    ],
    subject: "ZeptoMail Test Email",
    htmlbody: "<h1>Test Email</h1><p>If you receive this, your ZeptoMail configuration is working!</p>",
    textbody: "Test Email\n\nIf you receive this, your ZeptoMail configuration is working!",
  };

  try {
    console.log("🧪 [ZeptoMail Test] Testing configuration...");
    console.log("  - API Host:", ZEPTOMAIL_API_HOST);
    console.log("  - API URL:", ZEPTOMAIL_API_URL);
    console.log("  - Token length:", authToken.length);
    console.log("  - Token preview:", authToken.substring(0, 20) + "...");
    console.log("  - FROM_EMAIL:", FROM_EMAIL);

    const response = await fetch(ZEPTOMAIL_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Zoho-enczapikey ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testPayload),
    });

    const responseText = await response.text();
    let responseJson;
    try {
      responseJson = JSON.parse(responseText);
    } catch (e) {
      responseJson = { raw: responseText };
    }

    if (response.ok) {
      return NextResponse.json(
        {
          success: true,
          message: "Email sent successfully! Check your inbox.",
          status: response.status,
          response: responseJson,
          config: {
            apiHost: ZEPTOMAIL_API_HOST,
            apiUrl: ZEPTOMAIL_API_URL,
            tokenLength: authToken.length,
            fromEmail: FROM_EMAIL,
          },
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to send email",
          status: response.status,
          error: responseJson,
          config: {
            apiHost: ZEPTOMAIL_API_HOST,
            apiUrl: ZEPTOMAIL_API_URL,
            tokenLength: authToken.length,
            tokenPreview: authToken.substring(0, 20) + "...",
            fromEmail: FROM_EMAIL,
          },
          troubleshooting: {
            "If status is 401": [
              "Token is invalid or expired - generate a new Send Mail Token",
              "Token doesn't match the Mail Agent - ensure token is from mail_agent_1",
              "FROM_EMAIL domain not verified - check domain verification in ZeptoMail",
              "Token revoked - check if token was regenerated or revoked",
            ],
            "If status is 400": [
              "FROM_EMAIL format is invalid",
              "Email address not allowed by Mail Agent settings",
            ],
            "Check in ZeptoMail Dashboard": [
              "Go to Mail Agents → mail_agent_1 → Setup Info",
              "Verify domain is properly verified (green checkmark)",
              "Check API tab for Send Mail Token",
              "Ensure FROM_EMAIL matches verified domain",
            ],
          },
        },
        { status: response.status }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Error testing ZeptoMail",
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

