const { ContextMessageUpdate } = require("telegraf");
const db = require("../../configurate/db");

const { adminId } = require("../../configurate/telegram");

export const startPreview = async (ctx: typeof ContextMessageUpdate) => {
  const userId = ctx.from?.id;
  const username = ctx.from?.first_name;
  if (userId) {
    const findUser = await db.query(`SELECT id FROM "User" WHERE chatId = $1`, [
      userId,
    ]);
    if (findUser.rowCount === 0) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const req = await db.query(
        `INSERT INTO "User" (chatId, "name", mailingDateId, mailingConfigurationId, timeZoneId, mailingTime) VALUES ($1, $2, 1, 1, 1, '07:00') RETURNING *`,
        [userId, username],
      );
      await ctx.telegram.sendMessage(
        adminId,
        `Новый пользователь: ${ctx.from?.first_name} ${ctx.from?.last_name} - ${ctx.from?.username}`,
      );
    }
    const keyboardButtons = [
      [{ text: "Добавить человека", callback_data: "Добавить человека" }],
      [{ text: "Настройки", callback_data: "Настройки" }],
    ];

    // Отправляем стикер вместо обычного текста на клавиатуре
    await ctx.replyWithSticker(
      "https://tlgrm.ru/_/stickers/2a9/a9c/2a9a9cf4-f16c-3250-b204-8a125cbe725a/1.webp",
      {
        reply_markup: {
          keyboard: keyboardButtons,
          resize_keyboard: true,
          one_time_keyboard: false,
        },
      },
    );

    await ctx.reply(
      `👋Привет, рад тебя видеть. Я твой новый помощник, который будет тебя уведомлять о праздниках и днях рождения, которые ты сам добавишь!🎉\n\nТак же ты можешь настроить, что, как и когда тебе присылать в настройках⚙️\n\n😸Нажми на кнопку "Добавить человека", чтобы добавить свою первую запись...😸`,
      {
        reply_markup: {
          inline_keyboard: keyboardButtons,
        },
      },
      {
        parse_mode: "Markdown",
      },
    );
  }
};
