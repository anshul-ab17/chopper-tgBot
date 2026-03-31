import { bot } from "./lib/bot";
import "./handlers/commands";
import "./handlers/message";
import "./handlers/callbacks";

bot.start({ onStart: () => console.log(" Bot is running!") });
