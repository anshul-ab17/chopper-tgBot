import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { InputFile } from "grammy";
import { bot } from "./bot";

export function tempPath(ext: string): string {
  return path.join(os.tmpdir(), `chopper_${Date.now()}.${ext}`);
}

export async function sendFile(
  chatId: number,
  filePath: string,
  type: "video" | "audio",
  title?: string
): Promise<void> {
  try {
    const stat = fs.statSync(filePath);
    const file = new InputFile(filePath);

    if (type === "audio") {
      await bot.api.sendAudio(chatId, file, title ? { title } : {});
    } else if (stat.size > 50 * 1024 * 1024) {
      await bot.api.sendMessage(chatId, "⚠️ File exceeds 50MB. Sending as document.");
      await bot.api.sendDocument(chatId, file);
    } else {
      await bot.api.sendVideo(chatId, file);
    }
  } finally {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
}
