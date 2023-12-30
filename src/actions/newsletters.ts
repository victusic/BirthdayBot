/* eslint-disable operator-linebreak */
/* eslint-disable prettier/prettier */
const db = require("../../configurate/db");
const { DateTime } = require("luxon");

const { Telegraf, ContextMessageUpdate } = require("telegraf");
const { telegramToken } = require("../../configurate/telegram");
const bot = new Telegraf(telegramToken);

interface Holiday {
  id: number;
  name: string;
  sticker: string;
  date: string;
  link: string;
}

interface Person {
  id: number;
  name: string;
  sticker: string;
  birthday: string;
}

export const nowMonthList = async (ctx: typeof ContextMessageUpdate) => {
  const userId = ctx.from?.id;
  const findUser = await db.query(
    `SELECT id, mailingconfigurationid FROM "User" WHERE chatId = $1`,
    [userId],
  );

  const userData = findUser.rows[0];

  const holidaysList = await db.query(
    `SELECT * FROM "Holidays" WHERE EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)`,
  );

  const peoplesList = await db.query(
    `SELECT * FROM "BirthdayPeople" WHERE EXTRACT(MONTH FROM birthday) = EXTRACT(MONTH FROM CURRENT_DATE) AND userid = $1`,
    [userData.id],
  );

  function formatHolidaysList(holidays: Holiday[]) {
    return holidays.sort((a, b) => {
      const dateA = new Date(a.date).getDate();
      const dateB = new Date(b.date).getDate();
      return dateA - dateB;
    });
  }
  function formatPeoplesList(holidays: Person[]) {
    return holidays.sort((a, b) => {
      const dateA = new Date(a.birthday).getDate();
      const dateB = new Date(b.birthday).getDate();
      return dateA - dateB;
    });
  }

  const finalHolidays = formatHolidaysList(holidaysList.rows);
  const finalPeoples = formatPeoplesList(peoplesList.rows);

  let messageText = "В этом месяце:";
  if (userData.mailingconfigurationid !== 2 && peoplesList.rows.length > 0) {
    const peoplesBody: string = finalPeoples
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
    messageText += `\n\nСписок дней рождений:\n\n` + peoplesBody;
  }

  if (userData.mailingconfigurationid !== 3)
    messageText += "\n\nСписок праздников:\n\n";

  if (userData.mailingconfigurationid !== 3) {
    const holidaysBody: string = finalHolidays
      .map(({ sticker, name, date, link }) => {
        const birthDate = new Date(date);
        const formattedDate = birthDate.toLocaleDateString("ru-RU", {
          day: "numeric",
          month: "numeric",
        });

        return `${sticker} [${name}](${link}) - ${formattedDate}`;
      })
      .join("\n");
    messageText += holidaysBody;
  }

  {userData.mailingconfigurationid === 3 && peoplesList.rows.length < 1 ? await ctx.replyWithMarkdown("Дней рождений в этом месяце в вашем списке нет(", {
    disable_web_page_preview: true,
  }) : await ctx.replyWithMarkdown(messageText, {
    disable_web_page_preview: true,
  })}
};

export const mainNewsletterPeople = async (
  chatId: string,
) => {
  const findUser = await db.query(
    `SELECT id, mailingdateid, (SELECT "name" FROM "Timezone" WHERE "Timezone".id = timezoneid) AS userTimezone FROM "User" WHERE chatId = $1`,
    [chatId],
  );

  const userData = findUser.rows[0];
  
  const peoplesList = await db.query(
    `SELECT * FROM "BirthdayPeople"
      WHERE (EXTRACT(MONTH FROM birthday) = EXTRACT(MONTH FROM CURRENT_DATE)
      OR EXTRACT(MONTH FROM birthday) = EXTRACT(MONTH FROM CURRENT_DATE) + 1) AND userid = $1`,
    [userData.id],
  );

  const startPhrase = await db.query(
    `SELECT text FROM "BirthdayPhrases" ORDER BY RANDOM() LIMIT 1;`,
  );

  const getPeoples = (day: number, month: number) => {
    return peoplesList.rows.filter((person: Person) => {
      const personDay = new Date(person.birthday).getDate();
      const personMonth = new Date(person.birthday).getMonth();
      return (
        personDay === day && personMonth === month
      );
    });
  }

  const addMessagePeoples = (peoples: Person[], addAge: boolean, startText: string) => {
    messageText += startText + "\n";
    const peoplesBody: string = peoples
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

        let age = hasBirthdayOccurredThisYear
          ? currentDate.getFullYear() - birthDate.getFullYear()
          : currentDate.getFullYear() - birthDate.getFullYear() - 1;

        //если др будет с завтрашнего дня, добавляем год
        age = addAge ? age + 1 : age 

        // Проверка на кол-во лет
        let ageText = "";
        if (age % 10 === 1 && age !== 11) {
          ageText = `исп ${age} год`;
        } else if (
          // eslint-disable-next-line operator-linebreak
          (age % 10 === 2 || age % 10 === 3 || age % 10 === 4) &&
          (age < 10 || age > 20)
        ) {
          ageText = `исп ${age} года`;
        } else {
          ageText = `исп ${age} лет`;
        }

        return `${sticker} ${name} - ${formattedDate} - ${ageText}`;
      })
      .join("\n");
      messageText += `\n` + peoplesBody + `\n\n`;
  }

  const textDayWeek = (futureDate: typeof DateTime) => {
    const daysOfWeekInRussian = [
      "в воскресенье",
      "в понедельник",
      "во вторник",
      "в среду",
      "в четверг",
      "в пятницу",
      "в субботу"
    ];
    const currentDayOfWeek = futureDate.weekday;
    return daysOfWeekInRussian[currentDayOfWeek];
  }

  let messageText = startPhrase.rows[0].text + "\n\n";
  let countPeoples = 0;

  const today = DateTime.now().setZone(userData.usertimezone);
  
  const nowDay = new Date(today).getDate();
  const nowMonth = new Date(today).getMonth();

  const todayData = getPeoples(nowDay, nowMonth);
  if(todayData.length > 0) addMessagePeoples(todayData, false, "Cегодня:");
  countPeoples += todayData.length;

  if(userData.mailingdateid !== 4){
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDay = tomorrow.getDate();
    const tomorrowMonth = tomorrow.getMonth();

    const tomorrowData = getPeoples(tomorrowDay, tomorrowMonth);
    if(tomorrowData.length > 0) addMessagePeoples(tomorrowData, true, "Завтра:");
    countPeoples += tomorrowData.length;
  }

  if(userData.mailingdateid === 1 || userData.mailingdateid === 2){
    //определение дня недели текст
    const futureDate = today.plus({ days: 3 });
    const currentDayOfWeekInRussian = textDayWeek(futureDate);
    
    const after3Days = new Date(today);
    after3Days.setDate(after3Days.getDate() + 3);
    const after3DaysDay = after3Days.getDate();
    const after3DaysMonth = after3Days.getMonth();

    const after3DaysData = getPeoples(after3DaysDay, after3DaysMonth);
    if(after3DaysData.length > 0) addMessagePeoples(after3DaysData, true, `Через 3 дня (${currentDayOfWeekInRussian}):`);
    countPeoples += after3DaysData.length;
  }

  if(userData.mailingdateid === 1){
    const afterWeek = new Date(today);
    afterWeek.setDate(afterWeek.getDate() + 7);
    const afterWeekDay = afterWeek.getDate();
    const afterWeekMonth = afterWeek.getMonth();

    const afterWeekData = getPeoples(afterWeekDay, afterWeekMonth);
    if(afterWeekData.length > 0) addMessagePeoples(afterWeekData, true, "Через неделю:");
    countPeoples += afterWeekData.length;
  }
  {countPeoples > 0 ? await bot.telegram.sendMessage(chatId, messageText, {
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
  }) : false}

};

export const mainNewsletterHolidays = async (
  chatId: string,
) => {
  const findUser = await db.query(
    `SELECT mailingdateid, mailingconfigurationid, (SELECT "name" FROM "Timezone" WHERE "Timezone".id = timezoneid) AS userTimezone FROM "User" WHERE chatId = $1`,
    [chatId],
  );

  const userData = findUser.rows[0];

  const holidaysList = await db.query(
    `SELECT * FROM "Holidays"
      WHERE EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)
      OR EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE) + 1`,
  );

  const startPhrase = await db.query(
    `SELECT text FROM "HolidaysPhrases" WHERE "isFirst" = $1 ORDER BY RANDOM() LIMIT 1 `, [userData.mailingconfigurationid === 3 ? true : false],
  );

  const getHolidays = (day: number, month: number) => {
    return holidaysList.rows.filter((holiday: Holiday) => {
      const holidayDay = new Date(holiday.date).getDate();
      const holidayMonth = new Date(holiday.date).getMonth();
      return (
        holidayDay === day && holidayMonth === month
      );
    });
  }

  const addMessagePeoples = (holidays: Holiday[], startText: string) => {
    messageText += startText + "\n";
    const holidaysBody: string = holidays
      .map(({ sticker, name, link }) => {
        return `${sticker} [${name}](${link})`;
      })
      .join("\n");
      messageText += `\n` + holidaysBody + `\n\n`;
  }

  const textDayWeek = (futureDate: typeof DateTime) => {
    const daysOfWeekInRussian = [
      "в воскресенье",
      "в понедельник",
      "во вторник",
      "в среду",
      "в четверг",
      "в пятницу",
      "в субботу"
    ];
    const currentDayOfWeek = futureDate.weekday;
    return daysOfWeekInRussian[currentDayOfWeek];
  }

  let messageText = startPhrase.rows[0].text + "\n\n";
  let countHolidays = 0;

  const today = DateTime.now().setZone(userData.usertimezone);
  
  const nowDay = new Date(today).getDate();
  const nowMonth = new Date(today).getMonth();

  const todayData = getHolidays(nowDay, nowMonth);
  if(todayData.length > 0) addMessagePeoples(todayData, "Cегодня:");
  countHolidays += todayData.length;

  if(userData.mailingdateid !== 4){
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDay = tomorrow.getDate();
    const tomorrowMonth = tomorrow.getMonth();

    const tomorrowData = getHolidays(tomorrowDay, tomorrowMonth);
    if(tomorrowData.length > 0) addMessagePeoples(tomorrowData, "Завтра:");
    countHolidays += tomorrowData.length;
  }

  if(userData.mailingdateid === 1 || userData.mailingdateid === 2){
    //определение дня недели текст
    const futureDate = today.plus({ days: 3 });
    const currentDayOfWeekInRussian = textDayWeek(futureDate);
    
    const after3Days = new Date(today);
    after3Days.setDate(after3Days.getDate() + 3);
    const after3DaysDay = after3Days.getDate();
    const after3DaysMonth = after3Days.getMonth();

    const after3DaysData = getHolidays(after3DaysDay, after3DaysMonth);
    if(after3DaysData.length > 0) addMessagePeoples(after3DaysData, `Через 3 дня (${currentDayOfWeekInRussian}):`);
    countHolidays += after3DaysData.length;
  }

  if(userData.mailingdateid === 1){
    const afterWeek = new Date(today);
    afterWeek.setDate(afterWeek.getDate() + 7);
    const afterWeekDay = afterWeek.getDate();
    const afterWeekMonth = afterWeek.getMonth();

    const afterWeekData = getHolidays(afterWeekDay, afterWeekMonth);
    if(afterWeekData.length > 0) addMessagePeoples(afterWeekData, "Через неделю:");
    countHolidays += afterWeekData.length;
  }
  {countHolidays > 0 ? await bot.telegram.sendMessage(chatId, messageText, {
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
  }) : false}

};

export const nowMonthListbyChatId = async (chatId: string) => {
  const findUser = await db.query(
    `SELECT id, mailingconfigurationid FROM "User" WHERE chatId = $1`,
    [chatId],
  );

  const userData = findUser.rows[0];

  const holidaysList = await db.query(
    `SELECT * FROM "Holidays" WHERE EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)`,
  );

  const peoplesList = await db.query(
    `SELECT * FROM "BirthdayPeople" WHERE EXTRACT(MONTH FROM birthday) = EXTRACT(MONTH FROM CURRENT_DATE) AND userid = $1`,
    [userData.id],
  );

  function formatHolidaysList(holidays: Holiday[]) {
    return holidays.sort((a, b) => {
      const dateA = new Date(a.date).getDate();
      const dateB = new Date(b.date).getDate();
      return dateA - dateB;
    });
  }
  function formatPeoplesList(holidays: Person[]) {
    return holidays.sort((a, b) => {
      const dateA = new Date(a.birthday).getDate();
      const dateB = new Date(b.birthday).getDate();
      return dateA - dateB;
    });
  }

  const finalHolidays = formatHolidaysList(holidaysList.rows);
  const finalPeoples = formatPeoplesList(peoplesList.rows);

  let messageText = "В этом месяце:";
  if (userData.mailingconfigurationid !== 2 && peoplesList.rows.length > 0) {
    const peoplesBody: string = finalPeoples
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
    messageText += `\n\nСписок дней рождений:\n\n` + peoplesBody;
  }

  if (userData.mailingconfigurationid !== 3)
    messageText += "\n\nСписок праздников:\n\n";

  if (userData.mailingconfigurationid !== 3) {
    const holidaysBody: string = finalHolidays
      .map(({ sticker, name, date, link }) => {
        const birthDate = new Date(date);
        const formattedDate = birthDate.toLocaleDateString("ru-RU", {
          day: "numeric",
          month: "numeric",
        });

        return `${sticker} [${name}](${link}) - ${formattedDate}`;
      })
      .join("\n");
    messageText += holidaysBody;
  }

  {userData.mailingconfigurationid === 3 && peoplesList.rows.length < 1 ? await bot.telegram.sendMessage(chatId, "Дней рождений в этом месяце в вашем списке нет(", {
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
  }) : await bot.telegram.sendMessage(chatId, messageText, {
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
  })}
};

export const updateRealese = async (chatId: string, messageText: string) => {
  messageText = messageText.replace(/\\n/g, '  \n');
  await bot.telegram.sendMessage(chatId, messageText, {
    parse_mode: 'Markdown',
  });
};