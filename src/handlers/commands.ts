import { bot } from "../lib/bot";
import { clearSession } from "../lib/session";

bot.command("start", async (ctx) => {
  await ctx.reply(
    "👋 <b>Video Downloader Bot</b>\n\n" +
    "Send me a YouTube URL to:\n" +
    "• 🎬 Download video (1080p, 720p, 480p…)\n" +
    "• 🎵 Extract audio as MP3\n" +
    "• ✂️ Clip a specific time range",
    { parse_mode: "HTML" }
  );
});

bot.command("cancel", async (ctx) => {
  clearSession(ctx.from!.id);
  await ctx.reply("❌ Cancelled.");
});
