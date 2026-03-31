import { bot } from "../lib/bot";
import { getSession, clearSession } from "../lib/session";
import { showQualityMenu } from "../lib/menus";
import { sendFile, tempPath } from "../lib/downloader";
import { downloadVideo, downloadAudio, getInfo } from "../lib/ytdlp";

bot.callbackQuery("menu_video", async (ctx) => {
  await ctx.answerCallbackQuery();
  const session = getSession(ctx.from.id);
  session.downloadType = "video";
  await showQualityMenu(ctx.chat!.id, session.formats ?? []);
});

bot.callbackQuery("menu_audio", async (ctx) => {
  await ctx.answerCallbackQuery();
  const session = getSession(ctx.from.id);
  if (!session.url) { await ctx.reply("❌ No URL found."); return; }

  const filePath = tempPath("mp3");
  try {
    await ctx.reply("⏬ Downloading audio...");
    const info = await getInfo(session.url);
    await downloadAudio(session.url, filePath);
    await sendFile(ctx.from.id, filePath, "audio", info.title);
  } catch (err: unknown) {
    await ctx.reply(`❌ Audio download failed: ${err instanceof Error ? err.message : "Unknown error"}`);
  }
});

bot.callbackQuery("menu_clip", async (ctx) => {
  await ctx.answerCallbackQuery();
  const session = getSession(ctx.from.id);
  session.downloadType = "clip";
  await showQualityMenu(ctx.chat!.id, session.formats ?? []);
});

bot.callbackQuery(/^quality_(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const session = getSession(ctx.from.id);
  const itag = ctx.match[1];
  const format = session.formats?.find((f) => f.itag === itag);

  if (!format) { await ctx.reply("❌ Format not found."); return; }
  session.selectedFormat = format;

  if (session.downloadType === "clip") {
    session.step = "awaiting_clip_start";
    await ctx.reply(
      `✂️ Quality: <b>${format.qualityLabel}</b>\n\nSend the <b>start time</b> (e.g. <code>1:30</code> or <code>90</code>):`,
      { parse_mode: "HTML" }
    );
  } else {
    const filePath = tempPath("mp4");
    try {
      await ctx.reply(`⏬ Downloading ${format.qualityLabel}...`);
      await downloadVideo(session.url!, format.itag, filePath);
      await sendFile(ctx.from.id, filePath, "video");
    } catch (err: unknown) {
      await ctx.reply(`❌ Download failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }
});

bot.callbackQuery("cancel", async (ctx) => {
  await ctx.answerCallbackQuery();
  clearSession(ctx.from.id);
  await ctx.reply("❌ Cancelled.");
});
