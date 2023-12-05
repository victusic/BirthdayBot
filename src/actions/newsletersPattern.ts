import {
  mainNewsletterHolidays,
  mainNewsletterPeople,
  nowMonthListbyChatId,
} from "./newsletters";

const db = require("../../configurate/db");
const { DateTime } = require("luxon");

interface User {
  id: number;
  chatid: string;
  mailingconfigurationid: number;
  usertimezone: string;
  mailingtime: string;
}

export async function newsletersPattern() {
  const findUsersQ = await db.query(
    `SELECT id, chatid, mailingconfigurationid, (SELECT "name" FROM "Timezone" WHERE "Timezone".id = timezoneid) AS userTimezone, mailingtime FROM "User"`,
  );

  const findUsers = findUsersQ.rows;

  findUsers.map((user: User) => {
    //текущий час
    const now = DateTime.now().setZone(user.usertimezone);
    const currentHour = now.hour;

    //пользовательский час
    const timeComponents = user.mailingtime.split(":");
    const userhour = parseInt(timeComponents[0], 10);

    //текущий день
    const currentDay = now.day;

    //ежемесячная рассылка
    if (currentDay === 1) {
      nowMonthListbyChatId(user.chatid);
    }

    //основная рассылка
    if (currentHour === userhour) {
      if (user.mailingconfigurationid !== 2) mainNewsletterPeople(user.chatid);
      if (user.mailingconfigurationid !== 3)
        mainNewsletterHolidays(user.chatid);
    }
  });
}
