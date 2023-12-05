const { ContextMessageUpdate } = require("telegraf");

export const mainLayout = async (ctx: typeof ContextMessageUpdate) => {
  const keyboardButtons = [
    [{ text: "События (за месяц)", callback_data: "События (за месяц)" }],
    [
      { text: "Список дней рождений", callback_data: "Список дней рождений" },
      { text: "Список праздников", callback_data: "Список праздников" },
    ],
    [
      { text: "Добавить человека", callback_data: "Добавить человека" },
      { text: "Настройки", callback_data: "Настройки" },
    ],
  ];

  await ctx.reply("Главная", {
    reply_markup: {
      keyboard: keyboardButtons,
      resize_keyboard: true,
      one_time_keyboard: false,
    },
    parse_mode: "Markdown",
  });
};
