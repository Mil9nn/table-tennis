import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { User } from "@/models/User";
import cloudinary from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const decoded = verifyToken(token);
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

  try {
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
  } catch (error) {
    console.error("Upload profile image error:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}