import { setConversationState } from "..";

const { ContextMessageUpdate } = require("telegraf");
const db = require("../../configurate/db");

//главные настройки
export const mainSettings = async (ctx: typeof ContextMessageUpdate) => {
  const keyboardButtons = [
    [{ text: "Текущие настройки", callback_data: "Текущие настройки" }],
    [{ text: "Назад", callback_data: "Назад" }],
  ];

  const inlineButtons = [
    [
      { text: "Время рассылки", callback_data: "Время рассылки" },
      { text: "Дата рассылки", callback_data: "Дата рассылки" },
    ],
    [{ text: "Конфигурация рассылки", callback_data: "Конфигурация рассылки" }],
  ];

  await ctx.reply("Что вам хотелось бы изменить?", {
    reply_markup: {
      keyboard: keyboardButtons,
      resize_keyboard: true,
      one_time_keyboard: false,
    },
    parse_mode: "Markdown",
  });
  await ctx.reply(
    "Выберите вариант:",
    {
      reply_markup: {
        inline_keyboard: inlineButtons,
      },
    },
    {
      parse_mode: "Markdown",
    },
  );
};

//конфигурация рассылки
export const configurateSettings = async (ctx: typeof ContextMessageUpdate) => {
  const keyboardButtons = [[{ text: "Назад", callback_data: "Назад" }]];
  const configurateValues = await db.query(
    `SELECT * FROM "MailingСonfiguration"`,
  );

  const inlineButtons = configurateValues.rows.map(
    (value: { id: number; name: string }) => [
      {
        text: value.name,
        callback_data: `setСonfiguration:${value.id}`,
      },
    ],
  );

  await ctx.reply("Отлично, что именно вам присылать?", {
    reply_markup: {
      keyboard: keyboardButtons,
      resize_keyboard: true,
      one_time_keyboard: false,
    },
    parse_mode: "Markdown",
  });
  await ctx.reply(
    "Выберите вариант:",
    {
      reply_markup: {
        inline_keyboard: inlineButtons,
      },
    },
    {
      parse_mode: "Markdown",
    },
  );
};

export const setConfigurateSettings = async (
  ctx: typeof ContextMessageUpdate,
  configurateValueId: number,
) => {
  const userId = ctx.from?.id;
  const configurateValues = await db.query(
    `UPDATE "User" SET "mailingconfigurationid" = $1 WHERE "chatid" = $2`,
    [configurateValueId, userId],
  );
  if (configurateValues.rowCount > 0) {
    await ctx.reply("Настройки успешно сохранены");
    mainSettings(ctx);
  } else {
    await ctx.reply(
      "Произошла ошибка при изменении настроек, попробуйте ещё раз",
    );
  }
};

//дата рассылки
export const dateSettings = async (ctx: typeof ContextMessageUpdate) => {
  const keyboardButtons = [[{ text: "Назад", callback_data: "Назад" }]];
  const configurateDate = await db.query(`SELECT * FROM "MailingDate"`);

  const inlineButtons = configurateDate.rows.map(
    (value: { id: number; name: string }) => [
      {
        text: value.name,
        callback_data: `setDate:${value.id}`,
      },
    ],
  );

  await ctx.reply("Ок, выберите, когда вам присылать сообщения?", {
    reply_markup: {
      keyboard: keyboardButtons,
      resize_keyboard: true,
      one_time_keyboard: false,
    },
    parse_mode: "Markdown",
  });
  await ctx.reply(
    "Выберите вариант:",
    {
      reply_markup: {
        inline_keyboard: inlineButtons,
      },
    },
    {
      parse_mode: "Markdown",
    },
  );
};

export const setDateSettings = async (
  ctx: typeof ContextMessageUpdate,
  dateValueId: number,
) => {
  const userId = ctx.from?.id;
  const configurateValues = await db.query(
    `UPDATE "User" SET "mailingdateid" = $1 WHERE "chatid" = $2`,
    [dateValueId, userId],
  );
  if (configurateValues.rowCount > 0) {
    await ctx.reply("Настройки успешно сохранены");
    mainSettings(ctx);
  } else {
    await ctx.reply(
      "Произошла ошибка при изменении настроек, попробуйте ещё раз",
    );
  }
};

interface TimezoneValue {
  id: number;
  name: string;
  value: number;
}

//время рассылки
export const timeSettings = async (ctx: typeof ContextMessageUpdate) => {
  const keyboardButtons = [
    [{ text: "Пропустить", callback_data: "Пропустить" }],
    [{ text: "Отмена", callback_data: "Отмена" }],
  ];
  const configurateTime = await db.query(
    'SELECT * FROM "Timezone" ORDER BY id ASC',
  );

  //формирование матрицы поясов
  const inlineButtons: { text: string; callback_data: string }[][] = [];
  configurateTime.rows.map((value: TimezoneValue, index: number) => {
    const button = {
      text: value.name,
      callback_data: `setTime:${value.id}`,
    };
    //3 столбца
    const rowIndex = Math.floor(index / 3);
    if (!inlineButtons[rowIndex]) {
      inlineButtons[rowIndex] = [button];
    } else {
      inlineButtons[rowIndex].push(button);
    }
  });
  // Если количество кнопок не делится на 3, то пустые кнопки
  const remainder = inlineButtons.length % 3;
  if (remainder !== 0) {
    const emptyButtonsCount = 3 - remainder;
    inlineButtons.push(
      Array.from({ length: emptyButtonsCount }, () => ({
        text: " ",
        callback_data: "empty",
      })),
    );
  }

  await ctx.reply("Хорошо, укажите ваш часовой пояс", {
    reply_markup: {
      keyboard: keyboardButtons,
      resize_keyboard: true,
      one_time_keyboard: false,
    },
    parse_mode: "Markdown",
  });
  await ctx.reply(
    "Выберите вариант:",
    {
      reply_markup: {
        inline_keyboard: inlineButtons,
      },
    },
    {
      parse_mode: "Markdown",
    },
  );
};

export const setTimeZoneSettings = async (
  ctx: typeof ContextMessageUpdate,
  timeValueId: number,
) => {
  const userId = ctx.from?.id;
  if (timeValueId !== 999) {
    const timezoneIdValues = await db.query(
      `UPDATE "User" SET "timezoneid" = $1 WHERE "chatid" = $2`,
      [timeValueId, userId],
    );
    if (timezoneIdValues.rowCount > 0) {
      await ctx.reply(
        "Замечательно, теперь укажите время, в которое я вам буду присылать сообщения (только в часах), пример: 11:00",
      );
    } else {
      await ctx.reply(
        "Произошла ошибка при изменении настроек, попробуйте ещё раз",
      );
    }
  } else {
    await ctx.reply(
      "Замечательно, теперь укажите время, в которое я вам буду присылать сообщения (только в часах), пример: 11:00",
    );
  }
};

export const setTimeSettings = async (
  ctx: typeof ContextMessageUpdate,
  timeValue: string,
) => {
  const timeRegex = /^([01]\d|2[0-3]):00$/;
  if (!timeRegex.test(timeValue)) {
    await ctx.reply(
      "Время указанно некорректно, минуты должны быть всегда равны нулю, пример: 11:00. попробуйте ещё раз:",
    );
  } else {
    const userId = ctx.from?.id;
    const timeValues = await db.query(
      `UPDATE "User" SET "mailingtime" = $1 WHERE "chatid" = $2`,
      [timeValue, userId],
    );
    if (timeValues.rowCount > 0) {
      await ctx.reply("Настройки успешно сохранены");
      setConversationState(ctx, "mainLayout");
      mainSettings(ctx);
    } else {
      await ctx.reply(
        "Произошла ошибка при изменении настроек, попробуйте ещё раз",
      );
    }
  }
};

export const nowConfigurationSettings = async (
  ctx: typeof ContextMessageUpdate,
) => {
  const userId = ctx.from?.id;
  const configurateValues = await db.query(
    `SELECT 
      (SELECT "name" FROM "MailingDate" WHERE "MailingDate"."id" = "User"."mailingdateid") AS "mailingdate",
	    (SELECT "name" FROM "MailingСonfiguration" WHERE "MailingСonfiguration"."id" = "User"."mailingconfigurationid") AS "mailingconfiguration",
	    (SELECT "name" FROM "Timezone" WHERE "Timezone"."id" = "User"."timezoneid") AS "timezone",
      "mailingtime"
    FROM  "User" WHERE  "chatid" = $1`,
    [userId],
  );
  const reValue = configurateValues.rows[0];
  await ctx.reply(
    `Ваши текущие настройки:
		\nЧасовой пояс: ${
      reValue.timezone
    }\nВремя рассылки: ${reValue.mailingtime.slice(0, -3)}\nДата рассылки: ${
      reValue.mailingdate
    }\nКонфигуарция рассылки: ${reValue.mailingconfiguration}`,
  );
  mainSettings(ctx);
};
