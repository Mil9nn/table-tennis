import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { User } from "@/models/user.model";

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)
    if (!token)
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );

    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await User.findById(decoded?.userId).select("profileImage");

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      url: user.profileImage || null,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch profile image" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("profileImage") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file uploaded" },
        { status: 400 }
      );
    }

    const token = getTokenFromRequest(req);
    if (!token)
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );

    const decoded = verifyToken(token);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Cloudinary Storage
    const base64Data = `data:${file.type};base64,${buffer.toString("base64")}`;

    const uploadResult = await cloudinary.uploader.upload(base64Data, {
      folder: "profile_images",
      resource_type: "image",
      public_id: `profile_${decoded?.userId}`,
      overwrite: true,
    });

    // 4. Update user
    await User.findOneAndUpdate(
      { _id: decoded?.userId },
      { profileImage: uploadResult.secure_url }
    );

    return NextResponse.json({ success: true, url: uploadResult.secure_url });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, message: "Upload failed" },
      { status: 500 }
    );
  }
}
