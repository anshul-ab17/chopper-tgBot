import { InlineKeyboard } from "grammy";
import { VideoFormat } from "./ytdlp";
import { bot } from "./bot";

function formatBytes(bytes: number): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return ` ~${(bytes / 1024).toFixed(0)}KB`;
  return ` ~${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export async function showMainMenu(chatId: number): Promise<void> {
  const keyboard = new InlineKeyboard()
    .text("🎬 Download Video", "menu_video")
    .text("🎵 Download Audio", "menu_audio")
    .row()
    .text("✂️ Download Clip (time range)", "menu_clip")
    .row()
    .text("❌ Cancel", "cancel");

  await bot.api.sendMessage(chatId, "What would you like to do?", {
    reply_markup: keyboard,
  });
}

export async function showQualityMenu(chatId: number, formats: VideoFormat[]): Promise<void> {
  if (formats.length === 0) {
    await bot.api.sendMessage(chatId, "❌ No video formats found.");
    return;
  }

  const keyboard = new InlineKeyboard();
  for (const fmt of formats) {
    const size = fmt.filesize ? formatBytes(fmt.filesize) : "";
    keyboard.text(`${fmt.qualityLabel}${size}`, `quality_${fmt.itag}`).row();
  }
  keyboard.text("❌ Cancel", "cancel");

  await bot.api.sendMessage(chatId, "📊 <b>Choose quality:</b>", {
    parse_mode: "HTML",
    reply_markup: keyboard,
  });
}
