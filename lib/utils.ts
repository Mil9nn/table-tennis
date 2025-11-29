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
