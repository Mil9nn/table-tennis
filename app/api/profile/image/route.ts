import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { User } from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import cloudinary from "@/lib/cloudinary";
import { rateLimit } from "@/lib/rate-limit/middleware";
import { logError } from "@/lib/error-logger";

export async function POST(request: NextRequest) {
  let decoded: { userId?: string } | null = null;
  try {
    // Rate limiting
    const rateLimitResponse = await rateLimit(request, "POST", "/api/profile/image");
    if (rateLimitResponse) return rateLimitResponse;

    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    decoded = verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("profileImage") as Blob;

    if (!file || file.size === 0) {
      return NextResponse.json(
        { success: false, message: "No file uploaded" },
        { status: 400 }
      );
    }

    // ✅ Enhanced validation
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: "File size must not exceed 5MB" },
        { status: 400 }
      );
    }

    await connectDB();
    const buffer = Buffer.from(await file.arrayBuffer());
    // convert buffer to base64
    const base64Image = `data:${file.type};base64,${buffer.toString("base64")}`;
    // upload to cloudinary
    const uploadResult = await cloudinary.uploader.upload(base64Image, {
      folder: "profile_images",
      public_id: `user_${decoded.userId}_${Date.now()}`,
      overwrite: true,
      resource_type: "image",
    });

    await User.findByIdAndUpdate(decoded.userId, {
      profileImage: uploadResult.secure_url,
    });

    return NextResponse.json({ success: true, url: uploadResult.secure_url });
  } catch (error: any) {
    logError(error, {
      tags: { feature: "profile", action: "image-upload", endpoint: "POST /api/profile/image" },
      user: { id: decoded?.userId || "unknown" },
    });

    return NextResponse.json(
      {
        success: false,
        message: "Failed to upload profile image",
        ...(process.env.NODE_ENV === "development" && { details: error.message })
      },
      { status: 500 }
    );
  }
}