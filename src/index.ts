const { Telegraf, ContextMessageUpdate } = require("telegraf");

const { telegramToken } = require("../configurate/telegram");
const db = require("../configurate/db");

const bot = new Telegraf(telegramToken);

//const conversationState: { [key: number]: string } = {};

bot.start(async (ctx: typeof ContextMessageUpdate) => {
  const userId = ctx.from?.id;
  const username = ctx.from?.first_name;
  if (userId) {
    const findUser = await db.query(`SELECT id FROM "User" WHERE chatId = $1`, [
      userId,
    ]);
    if (findUser.rowCount === 0) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const req = await db.query(
        `INSERT INTO "User" (chatId, "name", mailingDateId, mailingConfigurationId, timeZoneId, mailingTime) values ($1, $2, 1, 1, 1, '07:00') RETURNING *`,
        [userId, username],
      );
    }
    // Отправляем стикер вместо обычного текста на клавиатуре
    ctx.replyWithSticker(
      "https://tlgrm.ru/_/stickers/2a9/a9c/2a9a9cf4-f16c-3250-b204-8a125cbe725a/1.webp",
      {
        reply_markup: {
          keyboard: [["Добавить человека"], ["Настройки"]],
          resize_keyboard: true,
          one_time_keyboard: false,
        },
      },
    );

    ctx.reply(
      "приветственное сообщение",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Добавить человека", callback_data: "Добавить человека" }],
            [{ text: "Настройки", callback_data: "Настройки" }],
          ],
        },
      },
      {
        parse_mode: "Markdown",
      },
    );
  }
});

bot.action("Настройки", (ctx: typeof ContextMessageUpdate) => {
  ctx.reply("Кнопки:", {
    reply_markup: {
      keyboard: [
        [{ text: "Текущие настройки", callback_data: "/Настройки" }],
        [{ text: "Назад", callback_data: "/Настройки" }],
      ],
      resize_keyboard: true,
      one_time_keyboard: false,
    },
    parse_mode: "Markdown",
  });
});

//шаблоны

bot.command("Настройки", (ctx: typeof ContextMessageUpdate) => {
  ctx.reply("Кнопки:", {
    reply_markup: {
      keyboard: [
        [{ text: "Кнопка 4", callback_data: "button4" }],
        ["Кнопка 2", "Кнопка 3"],
      ],
      resize_keyboard: true,
      one_time_keyboard: false,
    },
    parse_mode: "Markdown",
  });
});

bot.command("hd", (ctx: typeof ContextMessageUpdate) => {
  ctx.reply("Клавиатура скрыта.", {
    reply_markup: {
      remove_keyboard: true,
    },
  });
});

bot.command("del", async (ctx: typeof ContextMessageUpdate) => {
  const chatId = ctx.chat.id;
  const messageId = ctx.message.message_id;

  try {
    await ctx.telegram.deleteMessage(chatId, messageId);
    ctx.reply("Сообщение удалено.");
  } catch (error) {
    console.error(error);
    ctx.reply("Не удалось удалить сообщение.");
  }
});

bot.command("tk", (ctx: typeof ContextMessageUpdate) => {
  ctx.reply("Выберите действие:", {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "Кнопка 1", callback_data: "button1" },
          { text: "Кнопка 2", callback_data: "button2" },
        ],
        [{ text: "Кнопка 3", callback_data: "button3" }],
      ],
    },
  });
});

bot.action("button2", (ctx: typeof ContextMessageUpdate) => {
  ctx.reply("Вы нажали на кнопку 2");
});

bot.action("button3", (ctx: typeof ContextMessageUpdate) => {
  ctx.reply("Вы нажали на кнопку 3");
});

/*bot.on("text", async (ctx: typeof ContextMessageUpdate) => {
  const userId = ctx.from?.id;
  const userText = ctx.message?.text;

  if (userId && userText) {
    // Обработка ответов в зависимости от текущего состояния разговора
    switch (conversationState[userId]) {
      case "":
        // Ожидание имени
        conversationState[userId] = "waiting_for_name";
        await ctx.reply(`Спасибо, ${userText}! Теперь укажите дату рождения.`);
        break;

      case "waiting_for_name":
        // Ожидание даты рождения
        conversationState[userId] = "waiting_for_birthday";
        await ctx.reply(
          `Отлично, ${userText}! Теперь укажите город проживания.`,
        );
        break;

      case "waiting_for_birthday":
        // Ожидание города проживания и завершение разговора
        delete conversationState[userId];
        await ctx.reply(
          `Спасибо за информацию, ${userText}! Разговор завершен.`,
        );
        break;

      default:
        // Обработка других состояний, если необходимо
        break;
    }
  }
});*/

bot.launch();
