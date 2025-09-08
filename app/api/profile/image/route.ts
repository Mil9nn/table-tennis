import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary"
import { User } from "@/models/user";

// GET /api/profile/image - Fetch profile image
export async function GET(req: NextRequest) {
  try {
    // 1. Get JWT from cookies
    const token = (await cookies()).get("token")?.value;
    if (!token)
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );

    // 2. Verify token
    const decoded = verifyToken(token);

    // 3. Get user profile image
    const user = await User.findById(decoded?.id).select('profileImage');
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      url: user.profileImage || null 
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch profile image" },
      { status: 500 }
    );
  }
}

// POST /api/profile/image - Upload profile image
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

    // 1. Get JWT from cookies
    const token = (await cookies()).get("token")?.value;
    if (!token)
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );

    // 2. Verify token
    const decoded = verifyToken(token);

    // 3. Process file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Cloudinary Storage
    const base64Data = `data:${file.type};base64,${buffer.toString("base64")}`;

    const uploadResult = await cloudinary.uploader.upload(base64Data, {
      folder: "profile_images",
      resource_type: "image",
      public_id: `profile_${decoded?.id}`, // Fixed typo: "proflie" -> "profile"
      overwrite: true,
    });

    // 4. Update user
    await User.findOneAndUpdate(
      { _id: decoded?.id },
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