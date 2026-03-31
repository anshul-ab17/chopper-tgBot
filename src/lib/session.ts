import { VideoFormat } from "./ytdlp";

export interface UserSession {
  url?: string;
  formats?: VideoFormat[];
  step?: "awaiting_clip_start" | "awaiting_clip_end";
  downloadType?: "video" | "clip";
  selectedFormat?: VideoFormat;
  clipStart?: number;
}

const sessions = new Map<number, UserSession>();

export function getSession(userId: number): UserSession {
  if (!sessions.has(userId)) sessions.set(userId, {});
  return sessions.get(userId)!;
}

export function clearSession(userId: number): void {
  sessions.delete(userId);
}
