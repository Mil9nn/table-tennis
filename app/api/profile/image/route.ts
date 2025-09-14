import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { User } from "@/models/User";
import cloudinary from "@/lib/cloudinary";

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const user = await User.findById(decoded.userId).select("-password -__v");
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          _id: user._id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          profileImage: user.profileImage,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

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
    // convert to buffer
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

export async function PATCH(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    const updateData = await request.json();

    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updateData.password;
    delete updateData.username;
    delete updateData._id;

    // If email is being updated, check for duplicates
    if (updateData.email) {
      const existingUser = await User.findOne({
        email: updateData.email,
        _id: { $ne: decoded.userId },
      });

      if (existingUser) {
        return NextResponse.json(
          { success: false, message: "Email is already taken by another user" },
          { status: 400 }
        );
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      decoded.userId,
      updateData,
      { new: true, select: "-password -__v" }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Patch profile error:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
