import { Message } from "node-telegram-bot-api";

const TelegramApi = require("node-telegram-bot-api");
const { telegramToken } = require("../configurate/telegram");

const bot = new TelegramApi(telegramToken, { polling: true });

bot.on("message", (msg: Message) => {
  const text: string | undefined = msg.text;
  const chatId: number | undefined = msg.chat.id;
  bot.sendMessage(chatId, text);
});
