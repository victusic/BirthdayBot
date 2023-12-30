import { newsletersPattern } from "./actions/newsletersPattern";
import { startPreview } from "./actions/start";
import { handleListenLogic } from "./logic/textListeners";
import { handleSwitchLogic } from "./logic/textLogic";

const { Telegraf, ContextMessageUpdate } = require("telegraf");
const { telegramToken, adminId } = require("../configurate/telegram");
const schedule = require("node-schedule");

const bot = new Telegraf(telegramToken);

const conversationState: { [key: number]: string } = {};

export function setConversationState(
  ctx: typeof ContextMessageUpdate,
  state: string,
) {
  conversationState[ctx.from?.id] = state;
}

const rebootMessage = async () => {
  await bot.telegram.sendMessage(adminId, `Перезапуск`);
};

rebootMessage();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
//const job = schedule.scheduleJob("0 * * * *", newsletersPattern);
//для тестов
const job = schedule.scheduleJob("* * * * *", newsletersPattern);

//старт
bot.start(async (ctx: typeof ContextMessageUpdate) => {
  setConversationState(ctx, "mainLayout");
  startPreview(ctx);
});

handleListenLogic(bot);

bot.on("text", async (ctx: typeof ContextMessageUpdate) => {
  const userId = ctx.from?.id;
  const userText = ctx.message?.text;

  if (userId && userText) {
    {
      // eslint-disable-next-line operator-linebreak
      conversationState[userId] === undefined &&
        setConversationState(ctx, "mainLayout");
      //обработка сообщений
      handleSwitchLogic(ctx, userId, userText, conversationState);
    }
  }
});

bot.launch();
