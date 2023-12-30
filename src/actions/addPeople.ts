/* eslint-disable operator-linebreak */
import emojiRegex from "emoji-regex";
import { setConversationState } from "..";
import { mainLayout } from "./main";

const GraphemeSplitter = require("grapheme-splitter");
const { ContextMessageUpdate } = require("telegraf");
const db = require("../../configurate/db");

const newPeople: {
  [key: number]: { name: string; date: string; sticker: string };
} = {};

export const addPeopleName = async (ctx: typeof ContextMessageUpdate) => {
  const userId = ctx.from?.id;
  const keyboardButtons = [[{ text: "Отмена", callback_data: "Отмена" }]];

  await ctx.reply("Отлично! Давайте добавим нового человека.", {
    reply_markup: {
      keyboard: keyboardButtons,
      resize_keyboard: true,
      one_time_keyboard: false,
    },
    parse_mode: "Markdown",
  });
  newPeople[userId] = { name: "", date: "", sticker: "" };
  await ctx.reply("Укажите, как его будем звать:");
};

export const addPeopleDate = async (
  ctx: typeof ContextMessageUpdate,
  userText: string,
) => {
  const userId = ctx.from?.id;
  const keyboardButtons = [[{ text: "Отмена", callback_data: "Отмена" }]];

  // eslint-disable-next-line no-useless-escape
  const nameRegex = /^[a-zA-Zа-яА-ЯёЁ0-9\s,\-.\+:;'"`!#№;%?()]{2,64}$/;
  const ValidateName = () => nameRegex.test(userText);
  const isValidName = ValidateName();
  if (isValidName) {
    await ctx.reply(
      "Теперь укажите его дату рождения (в формате ДД.ММ.ГГГГ, пример: 24.09.2002):",
      {
        reply_markup: {
          keyboard: keyboardButtons,
          resize_keyboard: true,
          one_time_keyboard: false,
        },
        parse_mode: "Markdown",
      },
    );
    newPeople[userId].name = userText;
    setConversationState(ctx, "addPeopleDate");
  } else {
    await ctx.reply("Некорретно указанно имя, попробуйте ещё раз");
  }
};

export const addPeopleSticker = async (
  ctx: typeof ContextMessageUpdate,
  userText: string,
) => {
  const userId = ctx.from?.id;
  const keyboardButtons = [[{ text: "Отмена", callback_data: "Отмена" }]];

  function convertDateFormat() {
    const parts = userText.split(".");
    if (parts.length !== 3) return "";
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }

  const ValidateDate = () => {
    // Проверка формата даты
    const dateRegex = /^\d{2}.\d{2}.\d{4}$/;
    if (!dateRegex.test(userText)) return false;
    const [day, month, year] = userText.split(".").map(Number);
    const isValid = !isNaN(day) && !isNaN(month) && !isNaN(year);
    if (!isValid) return false;
    // Проверка корректности месяца и дня
    if (month < 1 || month > 12 || day < 1 || day > 31) return false;
    // Проверка корректности дня в месяце
    const lastDayInMonth = new Date(year, month, 0).getDate();
    if (day > lastDayInMonth) return false;
    const convertedDate = convertDateFormat();
    const date = new Date(convertedDate);
    if (isNaN(date.getTime())) return false;
    const currentDate = new Date();
    const userBirthdate = new Date(year, month - 1, day);
    const ageInYears = currentDate.getFullYear() - userBirthdate.getFullYear();

    return ageInYears <= 100 && userBirthdate <= currentDate;
  };
  const isValidDate = ValidateDate();

  if (isValidDate) {
    await ctx.reply(
      "Замечательно, и укажите смайл для идентификации пользователя (пример: 🎊):",
      {
        reply_markup: {
          keyboard: keyboardButtons,
          resize_keyboard: true,
          one_time_keyboard: false,
        },
        parse_mode: "Markdown",
      },
    );
    newPeople[userId].date = userText;
    setConversationState(ctx, "addPeopleSticker");
  } else {
    await ctx.reply("Дата указанна некорректно, попробуйте ещё раз:");
  }
};

export const setAddPeople = async (
  ctx: typeof ContextMessageUpdate,
  userText: string,
) => {
  const userId = ctx.from?.id;
  const keyboardButtons = [
    [{ text: "Сохранить", callback_data: "Сохранить" }],
    [{ text: "Отмена", callback_data: "Отмена" }],
  ];
  const ValidateSticker = () => {
    const splitter = new GraphemeSplitter();
    const numberOfCharacters = splitter.splitGraphemes(userText);
    if (numberOfCharacters.length > 1) return false;
    if (userText.length > 32) return false;
    const regex = emojiRegex();
    return regex.test(userText);
  };

  const isValidSticker = ValidateSticker();

  if (isValidSticker) {
    newPeople[userId].sticker = userText;

    const [day, month, year] = newPeople[userId].date.split(".").map(Number);

    const jsDate = new Date(year, month - 1, day);

    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "long",
      year: "numeric",
    };

    const formattedDate = new Intl.DateTimeFormat("ru-RU", options).format(
      jsDate,
    );

    await ctx.reply(
      `Ваш новый человек ${
        newPeople[userId].name
      }:\nРодился ${formattedDate.slice(0, -1)}, и вы ему дали стикер ${
        newPeople[userId].sticker
      }`,
      {
        reply_markup: {
          keyboard: keyboardButtons,
          resize_keyboard: true,
          one_time_keyboard: false,
        },
        parse_mode: "Markdown",
      },
    );
    setConversationState(ctx, "setAddPeople");
  } else {
    await ctx.reply("Укажите именно стикер, и только 1:");
  }
};

export const setRecordPeople = async (ctx: typeof ContextMessageUpdate) => {
  const userId = ctx.from?.id;
  const userForChatId = await db.query(
    `SELECT id FROM "User" WHERE chatid = $1`,
    [userId],
  );

  //для хостинга
  const dateParts = newPeople[userId].date.split(".");
  const formattedDate = dateParts[1] + "." + dateParts[0] + "." + dateParts[2];

  const req = await db.query(
    `INSERT INTO "BirthdayPeople" ("name", sticker, birthday, userid) VALUES ($1, $3, $2, $4) RETURNING *`,
    [
      newPeople[userId].name,
      //newPeople[userId].date,
      formattedDate,
      newPeople[userId].sticker,
      userForChatId.rows[0].id,
    ],
  );
  {
    req.rowCount > 0
      ? await ctx.reply("Человек успешно добавлен")
      : await ctx.reply(
          "Произошла ошибка при добавлении пользователя, попробуйте ещё раз",
        );
  }
  setConversationState(ctx, "mainLayout");
  mainLayout(ctx);
};
