import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(startTime: number, endTime: number) {
  const diff = endTime - startTime;
  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function formatTimeDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (hours > 0) parts.push(String(hours).padStart(2, "0"));
  parts.push(String(minutes).padStart(2, "0"));
  parts.push(String(seconds).padStart(2, "0"));

  return parts.join(":");
}

// utils/cropToSquare.ts
export async function cropImageToSquare(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      if (!e.target?.result) return reject("File load error");

      img.src = e.target.result as string;
      img.onload = () => {
        const size = Math.min(img.width, img.height); // square side
        const offsetX = (img.width - size) / 2;
        const offsetY = (img.height - size) / 2;

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("Canvas error");

        canvas.width = size;
        canvas.height = size;

        // draw center-cropped square
        ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size);

        canvas.toBlob((blob) => {
          if (!blob) return reject("Blob conversion failed");
          resolve(new File([blob], file.name, { type: file.type }));
        }, file.type);
      };
    };

    reader.readAsDataURL(file);
  });
}

export function timeAgo(dateInput: string | Date): string {
  try {
    const inputDate = new Date(dateInput);
    if (isNaN(inputDate.getTime())) throw new Error("Invalid date");

    const now = new Date();
    const diffMs = now.getTime() - inputDate.getTime();

    if (diffMs < 0) return "in the future";

    const secondsAgo = Math.floor(diffMs / 1000);
    const minutesAgo = Math.floor(secondsAgo / 60);
    const hoursAgo = Math.floor(minutesAgo / 60);
    const daysAgo = Math.floor(hoursAgo / 24);

    if (secondsAgo < 5) return "just now";
    if (secondsAgo < 60) return `${secondsAgo} seconds ago`;
    if (minutesAgo < 60) return `${minutesAgo} minutes ago`;
    if (hoursAgo < 24) {
      if (hoursAgo == 1) return "1 hour ago";
      else return `${hoursAgo} hours ago`;
    }
    if (daysAgo < 30) return `${daysAgo} days ago`;

    const monthsAgo = Math.floor(daysAgo / 30);
    if (monthsAgo < 12) return `${monthsAgo} months ago`;

    const yearsAgo = Math.floor(monthsAgo / 12);
    return `${yearsAgo} years ago`;
  } catch (err) {
    console.error("timeAgo error:", err);
    return "invalid date";
  }
}

export function formatDate(isoString?: string | Date): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDateShort(dateString?: string | Date): string {
  if (!dateString) return "";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "N/A";
  }
}

export function formatDateLong(dateString?: string | Date): string {
  if (!dateString) return "";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "N/A";
  }
}

export const formatStrokeName = (stroke: string) => {
  const parts = stroke.split("_");
  if (parts.length === 2) {
    const side = parts[0] === "forehand" ? "FH" : parts[0] === "backhand" ? "BH" : parts[0];
    const type = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
    return `${side} ${type}`;
  }
  return stroke
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/**
 * Escape special regex characters to prevent ReDoS and injection attacks
 * Use this before passing user input to MongoDB $regex queries
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Get initials from a name (first character, uppercase)
 */
export function getInitial(name?: string): string {
  return name?.charAt(0)?.toUpperCase() || "?";
}

/**
 * Get initials from a name (first letter of each word, max 2 chars)
 * e.g., "John Doe" -> "JD", "John" -> "JO"
 */
export function getInitials(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0]?.[0] + parts[1]?.[0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

/**
 * Get display name (fullName or username fallback)
 */
export function getDisplayName(item: { fullName?: string; username?: string; name?: string }): string {
  return item.fullName || item.username || item.name || "Unknown";
}

/**
 * Professional pastel color palette for avatar backgrounds
 * Carefully selected for accessibility and visual harmony
 */
const AVATAR_COLORS = [
  '#E8B4B8', '#F4C7AB', '#F5D5A8', '#F0E3C4',  // Warm tones
  '#B8D8E8', '#B8E0D8', '#C4E3D6', '#D8E8F0',  // Cool tones
  '#D4C4B0', '#C8D4BC', '#E0D4C8', '#D8D0C8',  // Earthy tones
  '#D8C8E0', '#E8D4E0', '#F0D8E8',             // Purple/Pink tones
  '#F0E8C8', '#D8E8C8', '#E8E0D0'              // Yellow/Green tones
] as const;

/**
 * Simple hash function to convert a string to a number
 * Uses djb2 algorithm - fast and good distribution
 */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  return Math.abs(hash);
}

/**
 * Get a deterministic avatar background color based on user ID or name
 * Always returns the same color for the same input
 *
 * @param identifier - User ID, username, or any unique identifier
 * @returns Hex color code from the palette
 */
export function getAvatarColor(identifier?: string): string {
  if (!identifier) return '#ccbcbc'; // Fallback to current default

  const hash = hashString(identifier);
  const index = hash % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

/**
 * Get avatar fallback styles (background + text color)
 * Combines color generation and text color logic
 *
 * @param identifier - User ID, username, or any unique identifier
 * @returns Object with backgroundColor and color properties
 */
export function getAvatarFallbackStyle(identifier?: string) {
  const backgroundColor = getAvatarColor(identifier);
  const color = '#ffffff'; // White text works well with all our pastels

  return { backgroundColor, color };
}
