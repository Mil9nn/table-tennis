import mongoose from "mongoose";
import { User } from "../models/User";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not found in environment variables");
  console.error("Please make sure your .env file contains MONGODB_URI");
  process.exit(1);
}

// User data from the provided list
const userDataList = [
  { fullName: "Riant Dadra", username: "riant", email: "2025psp0009@iitjammu.ac.in" },
  { fullName: "Daksh Gupta", username: "daksh", email: "2025ucs0084@iitjammu.ac.in" },
  { fullName: "chethan", username: "chethan", email: "2024ume0259@iitjammu.ac.in" },
  { fullName: "Ayush Agarwal", username: "ayush", email: "2024uch0011@iitjammu.ac.in" },
  { fullName: "Yash", username: "yash", email: "2024uch0036@iitjammu.ac.in" },
  { fullName: "Ronak Prajapati", username: "ronak", email: "2024uch0025@iitjammu.ac.in" },
  { fullName: "Aarnav Jindal", username: "aarnav", email: "2025ucs0086@iitjammu.ac.in" },
  { fullName: "Prithvi Singh Solanki", username: "prithvi", email: "2025uch0008@iitjammu.ac.in" },
  { fullName: "Sumit Meena", username: "sumit", email: "2024uch0033@iitjammu.ac.in" },
  { fullName: "Akshat Rai", username: "akshat", email: "2024uch0004@iitjammu.ac.in" },
  { fullName: "Japnoor Kaur", username: "japnoor", email: "2023uma0215@iitjammu.ac.in" },
  { fullName: "Shivam Arora", username: "shivam", email: "2024ume0263@iitjammu.ac.in" },
  { fullName: "Kshitij Kaushal", username: "kshitij", email: "2025uch0005@iitjammu.ac.in" },
  { fullName: "Keshav kumar nayak", username: "keshav", email: "2025ume0280@iitjammu.ac.in" },
  { fullName: "Arun Yadav", username: "arun", email: "2025uch0024@iitjammu.ac.in" },
  { fullName: "Chethan sai", username: "chethan", email: "2024ume0259@iitjammu.ac.in" },
  { fullName: "Sri Tharang Pullipudi", username: "sri", email: "2025umt0188@iitjammu.ac.in" },
  { fullName: "Kunal Jain", username: "kunal", email: "2025uee0131@iitjammu.ac.in" },
  { fullName: "Daksh Tomar", username: "daksh", email: "2025uma0223@iitjammu.ac.in" },
  { fullName: "Hitesh kumar", username: "hitesh", email: "2025uma0217@iitjammu.ac.in" },
  { fullName: "Kovid Baid", username: "kovid", email: "2024uma0214@iitjammu.ac.in" },
  { fullName: "Shubham Angural", username: "shubham", email: "2024ucs0111@iitjammu.ac.in" },
  { fullName: "Arnavchoubey", username: "arnavchoubey", email: "2025ume0259@iitjammu.ac.in" },
  { fullName: "Pari Khanna", username: "pari", email: "2025ume0270@iitjammu.ac.in" },
  { fullName: "HEET GHADIYA", username: "heet", email: "2025uma0222@iitjammu.ac.in" },
  { fullName: "Ashwini", username: "ashwini", email: "2022ume0199@iitjammu.ac.in" },
  { fullName: "Ansh Kumar", username: "ansh", email: "2025ucs0081@iitjammu.ac.in" },
  { fullName: "Abhay Punia", username: "abhay", email: "2023uma0201@iitjammu.ac.in" },
  { fullName: "Anshu Dankhara", username: "anshu", email: "2025uma0224@iitjammu.ac.in" },
  { fullName: "Surjeet Kumar Rai", username: "surjeet", email: "2025ubs0004@iitjammu.ac.in" },
  { fullName: "Tanwar", username: "tanwar", email: "2025uep0182@iitjammu.ac.in" },
  { fullName: "Ayush Agarwal", username: "ayush", email: "2025ucs0088@iitjammu.ac.in" },
  { fullName: "Kanhiya Agrawal", username: "kanhiya", email: "2024uce0052@iitjammu.ac.in" },
  { fullName: "Aarushi Singh", username: "aarushi", email: "2023uee0121@iitjammu.ac.in" },
  { fullName: "Janhavi", username: "janhavi", email: "2025ucs0109@iitjammu.ac.in" },
  { fullName: "Rishabh Sharma", username: "rishabh", email: "2022uce0024@iitjammu.ac.in" },
  { fullName: "Arnav Sohani", username: "arnav", email: "2025uma0227@iitjammu.ac.in" },
  { fullName: "Yash Gupta", username: "yash", email: "2025uce0045@iitjammu.ac.in" },
  { fullName: "Sachi Singh", username: "sachi", email: "2025uce0054@iitjammu.ac.in" },
  { fullName: "Tanish Tyagi", username: "tanish", email: "2025ucs0087@iitjammu.ac.in" },
  { fullName: "Kadali suchir", username: "kadali", email: "2024uee0129@iitjammu.ac.in" },
  { fullName: "Mohit Bishnoi", username: "mohit", email: "2025uce0041@iitjammu.ac.in" },
  { fullName: "Akhil", username: "akhil", email: "2024uee0140@iitjammu.ac.in" },
  { fullName: "Tushar Singh", username: "tushar", email: "2024uch0034@iitjammu.ac.in" },
  { fullName: "Priyanshu Kumar", username: "priyanshu", email: "2025ucs0106@iitjammu.ac.in" },
  { fullName: "Akshat Bajaj", username: "akshat", email: "2025ubs0005@iitjammu.ac.in" },
  { fullName: "Aayush kumar", username: "aayush", email: "2024umt0157@iitjammu.ac.in" },
  { fullName: "Jai Soni", username: "jai", email: "2025uma0229@iitjammu.ac.in" },
  { fullName: "Ansh Bhardwaj", username: "ansh", email: "2024uma0199@iitjammu.ac.in" },
  { fullName: "AMIT kumar saini", username: "amit", email: "2025uee0146@iitjammu.ac.in" },
  { fullName: "Karanbir Singh Dhindsa", username: "karanbir", email: "2024uch0021@iitjammu.ac.in" },
  { fullName: "Athul M", username: "athul", email: "2025pst0068@iitjammu.ac.in" },
  { fullName: "Ujjwal Gupta", username: "ujjwal", email: "2023ume0278@iitjammu.ac.in" },
  { fullName: "Sayuj Gupta", username: "sayuj", email: "2023ucs0112@iitjammu.ac.in" },
  { fullName: "Ashvanee Kumar", username: "ashvanee", email: "2023uce0043@iitjammu.ac.in" },
  { fullName: "Saksham vijay", username: "saksham", email: "2023uee0150@iitjammu.ac.in" },
  { fullName: "Nand Naman", username: "nand", email: "2023uce0057@iitjammu.ac.in" },
  { fullName: "Shreya Joshi", username: "shreya", email: "2025uma0232@iitjammu.ac.in" },
  { fullName: "Riddhima Sharma", username: "riddhima", email: "2025uee0135@iitjammu.ac.in" },
  { fullName: "Saksham Manu Shukla", username: "saksham", email: "2024umt0183@iitjammu.ac.in" },
  { fullName: "Tejas Boyina", username: "tejas", email: "2025uma0220@iitjammu.ac.in" },
  { fullName: "Abbas Mehdi", username: "abbas", email: "2024umt0158@iitjammu.ac.in" },
  { fullName: "Sandeep", username: "sandeep", email: "2023umt0193@iitjammu.ac.in" },
  { fullName: "Khushi", username: "khushi", email: "2024ume0247@iitjammu.ac.in" },
  { fullName: "Himanshu Singh", username: "himanshu", email: "2020ree2057@iitjammu.ac.in" },
  { fullName: "Navyuv Dogra", username: "navyuv", email: "2025ucs0083@iitjammu.ac.in" },
  { fullName: "Lokesh Kumar", username: "lokesh", email: "2024pcr0046@iitjammu.ac.in" },
  { fullName: "Muskan sahu", username: "muskan", email: "2025ume0287@iitjammu.ac.in" },
  { fullName: "Khushi", username: "khushi", email: "2024ucs0096@iitjammu.ac.in" },
  { fullName: "Pratibha", username: "pratibha", email: "2024uma0220@iitjammu.ac.in" },
  { fullName: "Chirag Upadhyay", username: "chirag", email: "2023uch0013@iitjammu.ac.in" },
  { fullName: "Naveen Kumar", username: "naveen", email: "2025pms0047@iitjammu.ac.in" },
  { fullName: "Sneha Hansrajani", username: "sneha", email: "2024uch0032@iitjammu.ac.in" },
  { fullName: "Amitesh Keshari", username: "amitesh", email: "2025pcs0018@iitjammu.ac.in" },
  { fullName: "Mohammad Sadiq Radu", username: "mohammad", email: "2025rme2026@iitjammu.ac.in" },
  { fullName: "Dev Bhardwaj", username: "dev", email: "2024ucs0089@iitjammu.ac.in" },
  { fullName: "Dhanush Karthik Chunduru", username: "dhanush", email: "2025pvl0105@iitjammu.ac.in" },
  { fullName: "Mishthi", username: "mishthi", email: "2023ume0268@iitjammu.ac.in" },
  { fullName: "Disha", username: "disha", email: "2023ume0256@iitjammu.ac.in" },
  { fullName: "Kashvi Bansal", username: "kashvi", email: "2022uee0135@iitjammu.ac.in" },
  { fullName: "Jitya Varshney", username: "jitya", email: "2022uch0051@iitjammu.ac.in" },
  // Additional users
  { fullName: "suchie", username: "suchie", email: "2024uee0129@iitjammu.ac.in" },
  { fullName: "Ayush Aggarwal", username: "ayush", email: "2024uch0011@iitjammu.ac.in" },
  { fullName: "Sumit Meena", username: "sumit", email: "2024uch0033@iitjammu.ac.in" },
  { fullName: "Prithvi Singh Solanki", username: "prithvi", email: "2025ucs0008@iitjammu.ac.in" },
  { fullName: "Aarnav Jindal", username: "aarnav", email: "2025ucs0086@iitjammu.ac.in" },
  { fullName: "Ram Krishan Kunal", username: "ram", email: "2024uee0128@iitjammu.ac.in" },
  { fullName: "Sawan", username: "sawan", email: "2024uma0226@iitjammu.ac.in" },
  { fullName: "Premendu Gain", username: "premendu", email: "2025uch0033@iitjammu.ac.in" },
  { fullName: "Arun Yadav", username: "arun", email: "2025uch0024@iitjammu.ac.in" },
  { fullName: "Daksh Tomar", username: "daksh", email: "2025uma0223@iitjammu.ac.in" },
  { fullName: "Kunal Jain", username: "kunal", email: "2025uee0131@iitjammu.ac.in" },
  { fullName: "Tejas Boyina", username: "tejas", email: "2025uma0220@iitjammu.ac.in" },
  { fullName: "Shamim", username: "shamim", email: "2024umt0186@iitjammu.ac.in" },
  { fullName: "Chiranjeev sharma", username: "chiranjeev", email: "2025ume0257@iitjammu.ac.in" },
  { fullName: "Arnav Sohani", username: "arnav", email: "2025uma0227@iitjammu.ac.in" },
  { fullName: "Divyansh gangwar", username: "divyansh", email: "2025ucs0105@iitjammu.ac.in" },
  { fullName: "Nikhil Pachar", username: "nikhil", email: "2025uee0144@iitjammu.ac.in" },
  { fullName: "Manthan", username: "manthan", email: "2024ucs0099@iitjammu.ac.in" },
  { fullName: "Japnoor Kaur", username: "japnoor", email: "2023uma0215@iitjammu.ac.in" },
  { fullName: "Ansh Kumar", username: "ansh", email: "2025ucs0081@iitjammu.ac.in" },
  { fullName: "Mohit Bishnoi", username: "mohit", email: "2025uce0041@iitjammu.ac.in" },
  { fullName: "Arushi", username: "arushi", email: "2025uma0233@iitjammu.ac.in" },
  { fullName: "Rushi Virani", username: "rushi", email: "2025ucs97@iitjammu.ac.in" },
  { fullName: "Chethan", username: "chethan", email: "2024ume0259@iitjammu.ac.in" },
  { fullName: "Yash Gupta", username: "yash", email: "2025uce0045@iitjammu.ac.in" },
  { fullName: "Prasanna", username: "prasanna", email: "2024umt0177@iitjammu.ac.in" },
  { fullName: "Navyuv", username: "navyuv", email: "2025ucs0083@iitjammu.ac.in" },
  { fullName: "Ansh Bhardwaj", username: "ansh", email: "2024uma0199@iitjammu.ac.in" },
  { fullName: "Aayush Kumar", username: "aayush", email: "2024umt0157@iitjammu.ac.in" },
  { fullName: "Aryan krishna", username: "aryan", email: "2025umt0198@iitjammu.ac.in" },
  { fullName: "Nand Naman", username: "nand", email: "2023uce0057@iitjammu.ac.in" },
  { fullName: "Mohit Singla", username: "mohit", email: "2023uma0223@iitjammu.ac.in" },
  { fullName: "Sayuj Gupta", username: "sayuj", email: "2023ucs0112@iitjammu.ac.in" },
  { fullName: "Shreya Joshi", username: "shreya", email: "2025uma0232@iitjammu.ac.in" },
  { fullName: "Hitesh Kumar", username: "hitesh", email: "2025uma0217@iitjammu.ac.in" },
  { fullName: "Rajat Prakash", username: "rajat", email: "2024pcr0047@iitjammu.ac.in" },
  { fullName: "Pari khanna", username: "pari", email: "2025ume0270@iitjammu.ac.in" },
  { fullName: "Pratibha", username: "pratibha", email: "2024uma0220@iitjammu.ac.in" },
  { fullName: "Khushi", username: "khushi", email: "2024ucs0096@iitjammu.ac.in" },
  { fullName: "Gaurav Chaudhary", username: "gaurav", email: "2023uce0049@iitjammu.ac.in" },
  { fullName: "Suhan", username: "suhan", email: "2024uma0230@iitjammu.ac.in" },
  { fullName: "Mishthi", username: "mishthi", email: "2023ume0268@iitjammu.ac.in" },
  { fullName: "Jitya Varshney", username: "jitya", email: "2022uch0051@iitjammu.ac.in" },
  { fullName: "Kashvi Bansal", username: "kashvi", email: "2022uee135@iitjammu.ac.in" },
];

// Valid password that meets requirements
const PASSWORD = "Password123!";

interface InsertResult {
  created: number;
  skipped: {
    duplicate: number;
    exists: number;
    error: number;
  };
  usernameModified: number;
  errors: Array<{ user: string; reason: string }>;
}

/**
 * Generate a unique username by appending random 2-digit numbers
 * Checks both seen usernames in batch and database
 */
async function generateUniqueUsername(
  baseUsername: string,
  seenUsernames: Set<string>,
  maxAttempts: number = 10
): Promise<string> {
  const normalizedBase = baseUsername.toLowerCase().trim();
  
  // If base username is already unique, return it
  if (!seenUsernames.has(normalizedBase)) {
    const existsInDB = await User.findOne({ username: normalizedBase });
    if (!existsInDB) {
      return normalizedBase;
    }
  }

  // Try to find a unique username by appending random numbers
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const randomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    const candidateUsername = `${normalizedBase}${randomNum}`;
    
    // Check if candidate is unique in batch and database
    if (!seenUsernames.has(candidateUsername)) {
      const existsInDB = await User.findOne({ username: candidateUsername });
      if (!existsInDB) {
        return candidateUsername;
      }
    }
  }

  // Fallback: use timestamp if all random attempts fail
  const timestamp = Date.now().toString().slice(-4);
  return `${normalizedBase}${timestamp}`;
}

async function insertUsers() {
  const result: InsertResult = {
    created: 0,
    skipped: {
      duplicate: 0,
      exists: 0,
      error: 0,
    },
    usernameModified: 0,
    errors: [],
  };

  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI!);
    console.log("✅ Connected to MongoDB\n");

    // Hash password once for all users
    console.log("🔐 Hashing password...");
    const hashedPassword = await bcrypt.hash(PASSWORD, 10);
    console.log("✅ Password hashed\n");

    // Track seen usernames and emails to detect duplicates in current batch
    const seenUsernames = new Set<string>();
    const seenEmails = new Set<string>();

    console.log(`📝 Processing ${userDataList.length} users...\n`);

    for (let i = 0; i < userDataList.length; i++) {
      const userData = userDataList[i];
      const { fullName, username, email } = userData;

      // Normalize email to lowercase for comparison
      const normalizedEmail = email.toLowerCase().trim();
      const originalUsername = username.toLowerCase().trim();

      // Skip if email is duplicate in current batch
      if (seenEmails.has(normalizedEmail)) {
        console.log(`  ⏭️  [${i + 1}/${userDataList.length}] Skipping ${fullName} (@${username}) - duplicate email in batch`);
        result.skipped.duplicate++;
        continue;
      }

      // Mark email as seen
      seenEmails.add(normalizedEmail);

      try {
        // Check if user already exists in database by email
        const existingUserByEmail = await User.findOne({ email: normalizedEmail });
        if (existingUserByEmail) {
          console.log(`  ⏭️  [${i + 1}/${userDataList.length}] Skipping ${fullName} (@${username}) - email already exists in database`);
          result.skipped.exists++;
          continue;
        }

        // Generate unique username (handles duplicates by appending random numbers)
        const uniqueUsername = await generateUniqueUsername(originalUsername, seenUsernames);
        const usernameWasModified = uniqueUsername !== originalUsername;

        if (usernameWasModified) {
          result.usernameModified++;
          console.log(`  🔄 [${i + 1}/${userDataList.length}] Username modified: ${originalUsername} → ${uniqueUsername} for ${fullName}`);
        }

        // Mark username as seen
        seenUsernames.add(uniqueUsername);

        // Create new user
        const user = await User.create({
          username: uniqueUsername,
          fullName: fullName.trim(),
          email: normalizedEmail,
          password: hashedPassword,
          isEmailVerified: true, // Set to true so users can login immediately
          isProfileComplete: false,
        });

        const usernameDisplay = usernameWasModified ? `${username} → ${uniqueUsername}` : username;
        console.log(`  ✅ [${i + 1}/${userDataList.length}] Created user: ${fullName} (@${usernameDisplay}) - ${normalizedEmail}`);
        result.created++;

      } catch (error: any) {
        console.error(`  ❌ [${i + 1}/${userDataList.length}] Error creating ${fullName} (@${username}):`, error.message);
        result.skipped.error++;
        result.errors.push({
          user: `${fullName} (@${username})`,
          reason: error.message || "Unknown error",
        });
      }
    }

    // Print summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 SUMMARY");
    console.log("=".repeat(60));
    console.log(`✅ Created: ${result.created} users`);
    console.log(`🔄 Usernames modified: ${result.usernameModified}`);
    console.log(`⏭️  Skipped (duplicate emails in batch): ${result.skipped.duplicate}`);
    console.log(`⏭️  Skipped (already exists in DB): ${result.skipped.exists}`);
    console.log(`❌ Errors: ${result.skipped.error}`);
    console.log(`\n🔑 Default password for all users: ${PASSWORD}`);
    console.log(`📧 All users have isEmailVerified: true (can login immediately)`);

    if (result.errors.length > 0) {
      console.log("\n❌ Errors encountered:");
      result.errors.forEach((err) => {
        console.log(`   - ${err.user}: ${err.reason}`);
      });
    }

    console.log("\n✅ User insertion complete!");

  } catch (error) {
    console.error("❌ Fatal error:", error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

// Run the script
insertUsers().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});

