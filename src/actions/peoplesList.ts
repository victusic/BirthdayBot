/* eslint-disable operator-linebreak */
import emojiRegex from "emoji-regex";
import { setConversationState } from "..";
import { mainLayout } from "./main";
import moment from "moment";

const GraphemeSplitter = require("grapheme-splitter");
const { ContextMessageUpdate } = require("telegraf");
const db = require("../../configurate/db");

interface Person {
  id: number;
  name: string;
  sticker: string;
  birthday: string;
}

const editPeople: {
  [key: number]: { id: number; name: string; date: string; sticker: string };
} = {};

async function getPeopleList(userId: number) {
  const userForChatId = await db.query(
    `SELECT id FROM "User" WHERE chatid = $1`,
    [userId],
  );

  const peopleListData = await db.query(
    `SELECT id, name, sticker, birthday FROM "BirthdayPeople" WHERE userid = $1`,
    [userForChatId.rows[0].id],
  );

  return peopleListData.rows;
}

//сообщение со списком др
export const peoplesList = async (ctx: typeof ContextMessageUpdate) => {
  const userId = ctx.from?.id;
  const keyboardButtons = [
    [{ text: "Редактировать", callback_data: "Редактировать" }],
    [{ text: "Назад", callback_data: "Назад" }],
  ];

  const peopleList: Person[] = await getPeopleList(userId);

  const groupedData: { [key: string]: Person[] } = peopleList.reduce(
    (acc, item) => {
      const key = moment(item.birthday).month().toString();
      acc[key] = acc[key] || [];
      acc[key].push(item);
      return acc;
    },
    {} as { [key: string]: Person[] },
  );

  const sortedData = Object.keys(groupedData)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .map((month) => ({
      month: new Date(2020, parseInt(month), 1).toLocaleString("ru", {
        month: "long",
      }),
      data: groupedData[month].sort((a, b) => {
        const dateA = new Date(a.birthday).getDate();
        const dateB = new Date(b.birthday).getDate();
        return dateA - dateB;
      }),
    }));

  function formatTelegramMessage(data: { month: string; data: Person[] }[]) {
    return data
      .map(({ month, data }) => {
        const monthHeader: string = `${month
          .charAt(0)
          .toUpperCase()}${month.slice(1)}:`;
        const monthBody: string = data
          .map(({ sticker, name, birthday }) => {
            const birthDate = new Date(birthday);
            const formattedDate = birthDate.toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "numeric",
              year: "numeric",
            });
            const currentDate = new Date();

            const hasBirthdayOccurredThisYear =
              currentDate.getMonth() > birthDate.getMonth() ||
              (currentDate.getMonth() === birthDate.getMonth() &&
                currentDate.getDate() >= birthDate.getDate());

            const age = hasBirthdayOccurredThisYear
              ? currentDate.getFullYear() - birthDate.getFullYear()
              : currentDate.getFullYear() - birthDate.getFullYear() - 1;

            // Проверка на кол-во лет
            let ageText = "";
            if (age % 10 === 1 && age !== 11) {
              ageText = `${age} год`;
            } else if (
              // eslint-disable-next-line operator-linebreak
              (age % 10 === 2 || age % 10 === 3 || age % 10 === 4) &&
              (age < 10 || age > 20)
            ) {
              ageText = `${age} года`;
            } else {
              ageText = `${age} лет`;
            }

            return `${sticker} ${name} - ${formattedDate} - ${ageText}`;
          })
          .join("\n");

        return `${monthHeader}\n\n${monthBody}\n`;
      })
      .join("\n");
  }

  const telegramMessage = formatTelegramMessage(sortedData);

  await ctx.reply("Список всех дней рождений:", {
    reply_markup: {
      keyboard: keyboardButtons,
      resize_keyboard: true,
      one_time_keyboard: false,
    },
    parse_mode: "Markdown",
  });
  await ctx.reply(telegramMessage);
};

//сообщение со списком др
export const peoplesListSetPeople = async (
  ctx: typeof ContextMessageUpdate,
) => {
  const userId = ctx.from?.id;
  const keyboardButtons = [[{ text: "Назад", callback_data: "Назад" }]];

  const peopleList: Person[] = await getPeopleList(userId);

  function compareBirthdays(a: Person, b: Person): number {
    const dateA = new Date(a.birthday);
    const dateB = new Date(b.birthday);
    const monthDiff = dateA.getMonth() - dateB.getMonth();
    if (monthDiff !== 0) {
      return monthDiff;
    }
    const dayDiff = dateA.getDate() - dateB.getDate();
    return dayDiff;
  }
  peopleList.sort(compareBirthdays);

  const inlineButtons = peopleList.map((person: Person) => [
    {
      text: `${person.sticker} ${person.name}`,
      callback_data: `setPeople:${person.id}`,
    },
  ]);

  await ctx.reply("Хорошо, вот список всех ваших существующих людей", {
    reply_markup: {
      keyboard: keyboardButtons,
      resize_keyboard: true,
      one_time_keyboard: false,
    },
    parse_mode: "Markdown",
  });

  await ctx.reply(
    "Выберите человека:",
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

//выбор действия с пользователем
export const setConfiguratePeople = async (
  ctx: typeof ContextMessageUpdate,
  personId: number,
) => {
  const inlineButtons = [
    [{ text: "Изменить данные", callback_data: `editPeopleName:${personId}` }],
    [{ text: "Удалить", callback_data: `deletePeople:${personId}` }],
  ];

  const peopleData = await db.query(
    `SELECT * FROM "BirthdayPeople" WHERE id = $1`,
    [personId],
  );

  const onePeople = peopleData.rows[0];

  await ctx.reply(
    `Что сделать с человеком: ${onePeople.sticker} ${onePeople.name}`,
    {
      reply_markup: {
        inline_keyboard: inlineButtons,
      },
    },
  );
};

//подтверждение удаления
export const setDeletePeople = async (
  ctx: typeof ContextMessageUpdate,
  personId: number,
) => {
  const inlineButtons = [
    [{ text: "Да, удалить", callback_data: `reqDeletePeople:${personId}` }],
  ];

  const peopleData = await db.query(
    `SELECT * FROM "BirthdayPeople" WHERE id = $1`,
    [personId],
  );

  const onePeople = peopleData.rows[0];

  await ctx.reply(
    `Вы уверены, что хотите удалить пользователя: ${onePeople.sticker} ${onePeople.name}`,
    {
      reply_markup: {
        inline_keyboard: inlineButtons,
      },
    },
  );
};

//удаление
export const reqDeletePeople = async (
  ctx: typeof ContextMessageUpdate,
  personId: number,
) => {
  const req = await db.query(`DELETE FROM "BirthdayPeople" WHERE id = $1`, [
    personId,
  ]);

  {
    req.rowCount > 0
      ? await ctx.reply("Человек успешно удалён")
      : await ctx.reply(
          "Произошла ошибка при удалении пользователя, попробуйте ещё раз",
        );
  }
  setConversationState(ctx, "mainLayout");
  mainLayout(ctx);
};

//изменение имени пользователя
export const editPeopleName = async (
  ctx: typeof ContextMessageUpdate,
  personId: number,
) => {
  const userId = ctx.from?.id;
  const keyboardButtons = [
    [{ text: "Пропустить", callback_data: "Пропустить" }],
    [{ text: "Отмена", callback_data: "Отмена" }],
  ];

  const peopleData = await db.query(
    `SELECT * FROM "BirthdayPeople" WHERE id = $1`,
    [personId],
  );

  function convertDateFormat(inputDate: string): string {
    const originalDate = new Date(inputDate);

    const day = originalDate.getUTCDate() + 1; // Используем +1, чтобы получить следующий день
    const month = originalDate.getUTCMonth() + 1;
    const year = originalDate.getFullYear();

    // Форматирование даты
    const formattedDate = `${day < 10 ? "0" : ""}${day}.${
      month < 10 ? "0" : ""
    }${month}.${year}`;

    return formattedDate;
  }

  const onePeople = peopleData.rows[0];

  const formattedDate = convertDateFormat(onePeople.birthday);

  await ctx.reply("Отлично! Давайте измениме данные человека", {
    reply_markup: {
      keyboard: keyboardButtons,
      resize_keyboard: true,
      one_time_keyboard: false,
    },
    parse_mode: "Markdown",
  });
  editPeople[userId] = {
    id: onePeople.id,
    name: onePeople.name,
    date: formattedDate,
    sticker: onePeople.sticker,
  };
  await ctx.reply("Введите его новое имя или пропустите этот шаг:");
};

export const editPeopleDate = async (
  ctx: typeof ContextMessageUpdate,
  userText: string,
) => {
  const userId = ctx.from?.id;
  const keyboardButtons = [
    [{ text: "Пропустить", callback_data: "Пропустить" }],
    [{ text: "Отмена", callback_data: "Отмена" }],
  ];

  const nameRegex = /^[a-zA-Zа-яА-Я0-9\s-]{2,64}$/;
  const ValidateName = () => nameRegex.test(userText);
  const isValidName = ValidateName();

  if (userText !== "Пропустить") {
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
      editPeople[userId].name = userText;
      setConversationState(ctx, "editPeopleDate");
    } else {
      await ctx.reply("Некорретно указанно имя, попробуйте ещё раз");
    }
  } else {
    await ctx.reply(
      "Теперь укажите его новую дату рождения (в формате ДД.ММ.ГГГГ, пример: 24.09.2002), или пропустите этот шаг:",
      {
        reply_markup: {
          keyboard: keyboardButtons,
          resize_keyboard: true,
          one_time_keyboard: false,
        },
        parse_mode: "Markdown",
      },
    );
    setConversationState(ctx, "editPeopleDate");
  }
};

export const editPeopleSticker = async (
  ctx: typeof ContextMessageUpdate,
  userText: string,
) => {
  const userId = ctx.from?.id;
  const keyboardButtons = [
    [{ text: "Пропустить", callback_data: "Пропустить" }],
    [{ text: "Отмена", callback_data: "Отмена" }],
  ];

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

  if (userText !== "Пропустить") {
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
      editPeople[userId].date = userText;
      setConversationState(ctx, "editPeopleSticker");
    } else {
      await ctx.reply("Дата указанна некорректно, попробуйте ещё раз:");
    }
  } else {
    await ctx.reply(
      "Замечательно, и укажите смайл для идентификации пользователя (пример: 🎊), или пропустите этот шаг:",
      {
        reply_markup: {
          keyboard: keyboardButtons,
          resize_keyboard: true,
          one_time_keyboard: false,
        },
        parse_mode: "Markdown",
      },
    );
    setConversationState(ctx, "editPeopleSticker");
  }
};

export const setEditPeople = async (
  ctx: typeof ContextMessageUpdate,
  userText: string,
) => {
  const userId = ctx.from?.id;
  const keyboardButtons = [
    [{ text: "Сохранить", callback_data: "Сохранить" }],
    [{ text: "Отмена", callback_data: "Отмена" }],
  ];
  const ValidateSticker = () => {
    if (userText !== "Пропустить") {
      const splitter = new GraphemeSplitter();
      const numberOfCharacters = splitter.splitGraphemes(userText);
      if (numberOfCharacters.length > 1) return false;
      if (userText.length > 32) return false;
      const regex = emojiRegex();
      return regex.test(userText);
    }
  };

  const isValidSticker = ValidateSticker();

  if (userText !== "Пропустить") {
    if (isValidSticker) {
      editPeople[userId].sticker = userText;

      const [day, month, year] = editPeople[userId].date.split(".").map(Number);

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
        `Ваш обновлённый человек ${
          editPeople[userId].name
        }:\nРодился ${formattedDate.slice(0, -1)}, и вы ему дали стикер ${
          editPeople[userId].sticker
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
      setConversationState(ctx, "setEditPeople");
    } else {
      await ctx.reply("Укажите именно стикер, и только 1:");
    }
  } else {
    const [day, month, year] = editPeople[userId].date.split(".").map(Number);

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
      `Ваш обновлённый человек ${
        editPeople[userId].name
      }:\nРодился ${formattedDate.slice(0, -1)}, и вы ему дали стикер ${
        editPeople[userId].sticker
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
    setConversationState(ctx, "setEditPeople");
  }
};

export const setRecordEditPeople = async (ctx: typeof ContextMessageUpdate) => {
  const userId = ctx.from?.id;

  //для хостинга
  const dateParts = editPeople[userId].date.split(".");
  const formattedDate = dateParts[1] + "." + dateParts[0] + "." + dateParts[2];

  const req = await db.query(
    `UPDATE "BirthdayPeople" SET "name" = $1, sticker = $3, birthday = $2 WHERE id = $4`,
    [
      editPeople[userId].name,
      //editPeople[userId].date,
      formattedDate,
      editPeople[userId].sticker,
      editPeople[userId].id,
    ],
  );
  {
    req.rowCount > 0
      ? await ctx.reply("Человек успешно обновлён")
      : await ctx.reply(
          "Произошла ошибка при изменении пользователя, попробуйте ещё раз",
        );
  }
  setConversationState(ctx, "mainLayout");
  mainLayout(ctx);
};
