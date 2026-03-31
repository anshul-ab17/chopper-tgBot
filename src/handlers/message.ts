import { bot } from "../lib/bot";
import { getSession, clearSession } from "../lib/session";
import { showMainMenu, showQualityMenu } from "../lib/menus";
import { sendFile, tempPath } from "../lib/downloader";
import { downloadVideo, getInfo } from "../lib/ytdlp";
import { parseTime } from "../lib/utils";

bot.on("message:text", async (ctx) => {
  const text = ctx.message.text.trim();
  const userId = ctx.from.id;
  const session = getSession(userId);

  // Clip start time
  if (session.step === "awaiting_clip_start") {
    const sec = parseTime(text);
    if (sec === null) {
      await ctx.reply("⚠️ Invalid format. Use MM:SS or seconds (e.g. `1:30`).");
      return;
    }
    session.clipStart = sec;
    session.step = "awaiting_clip_end";
    await ctx.reply("⏱ Now send the <b>end time</b>:", { parse_mode: "HTML" });
    return;
  }

  // Clip end time
  if (session.step === "awaiting_clip_end") {
    const endSec = parseTime(text);
    if (endSec === null) {
      await ctx.reply("⚠️ Invalid format. Use MM:SS or seconds.");
      return;
    }
    const startSec = session.clipStart!;
    if (endSec <= startSec) {
      await ctx.reply("⚠️ End time must be after start time.");
      return;
    }
    session.step = undefined;

    const filePath = tempPath("mp4");
    try {
      await ctx.reply("⏬ Downloading clip...");
      await downloadVideo(session.url!, session.selectedFormat!.itag, filePath, startSec, endSec - startSec);
      await sendFile(userId, filePath, "video");
    } catch (err: unknown) {
      await ctx.reply(`❌ Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
    return;
  }

  // URL input
  if (!text.startsWith("http")) {
    await ctx.reply("⚠️ Please send a video URL.");
    return;
  }

  session.url = text;

  try {
    const statusMsg = await ctx.reply("🔍 Fetching video info...");
    const info = await getInfo(text);
    session.formats = info.formats;

    const mm = Math.floor(info.duration / 60);
    const ss = (info.duration % 60).toString().padStart(2, "0");

    await bot.api.editMessageText(
      ctx.chat.id,
      statusMsg.message_id,
      `📹 <b>${info.title}</b>\n👤 ${info.uploader}\n⏱ ${mm}:${ss}`,
      { parse_mode: "HTML" }
    );

    await showMainMenu(ctx.chat.id);
  } catch (err: unknown) {
    await ctx.reply(`❌ Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    clearSession(userId);
  }
});
