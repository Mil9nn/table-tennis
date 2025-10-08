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
