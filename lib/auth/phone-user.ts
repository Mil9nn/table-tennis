import { User } from "@/models/User";
import {
  generatePhoneUsername,
  normalizeIndianPhone,
  syntheticEmailForPhone,
} from "@/lib/phone";

export async function findOrCreatePhoneUser(phone: string) {
  const normalized = normalizeIndianPhone(phone);
  if (!normalized) {
    return null;
  }

  let user = await User.findOne({ phoneNumber: normalized });
  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    const syntheticEmail = syntheticEmailForPhone(normalized);
    let username = generatePhoneUsername(normalized);

    while (await User.findOne({ username })) {
      username = generatePhoneUsername(normalized);
    }

    user = await User.create({
      username,
      fullName: "Player",
      email: syntheticEmail,
      phoneNumber: normalized,
      isPhoneVerified: true,
      phoneVerifiedAt: new Date(),
      isProfileComplete: false,
    });
  } else {
    user.isPhoneVerified = true;
    user.phoneVerifiedAt = new Date();
    if (!user.phoneNumber) {
      user.phoneNumber = normalized;
    }
    await user.save();
  }

  return { user, isNewUser };
}
