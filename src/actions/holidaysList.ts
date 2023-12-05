import moment from "moment";

const { ContextMessageUpdate } = require("telegraf");
const db = require("../../configurate/db");

interface Holiday {
  id: number;
  name: string;
  sticker: string;
  date: string;
  link: string;
}

//сообщение со списком праздников
export const holidaysList = async (ctx: typeof ContextMessageUpdate) => {
  const holidayList = await db.query(`SELECT * FROM "Holidays"`);
  const holidayListRows: Holiday[] = holidayList.rows;

  const groupedData: { [key: string]: Holiday[] } = holidayListRows.reduce(
    (acc, item) => {
      const key = moment(item.date).month().toString();
      acc[key] = acc[key] || [];
      acc[key].push(item);
      return acc;
    },
    {} as { [key: string]: Holiday[] },
  );

  const sortedData = Object.keys(groupedData)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .map((month) => ({
      month: new Date(2020, parseInt(month), 1).toLocaleString("ru", {
        month: "long",
      }),
      data: groupedData[month].sort((a, b) => {
        const dateA = new Date(a.date).getDate();
        const dateB = new Date(b.date).getDate();
        return dateA - dateB;
      }),
    }));

  function formatTelegramMessage(
    data: { month: string; data: Holiday[] }[],
    startMonth: number,
    endMonth: number,
  ) {
    return data
      .filter(({ month }) => {
        const monthIndex = new Date(
          2020,
          data.findIndex((d) => d.month === month),
          1,
        ).getMonth();
        return monthIndex >= startMonth && monthIndex <= endMonth;
      })
      .map(({ month, data }) => {
        const monthHeader: string = `${month
          .charAt(0)
          .toUpperCase()}${month.slice(1)}:`;
        const monthBody: string = data
          .map(({ sticker, name, date, link }) => {
            const birthDate = new Date(date);
            const formattedDate = birthDate.toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "numeric",
            });

            return `${sticker} [${name}](${link}) - ${formattedDate}`;
          })
          .join("\n");

        return `${monthHeader}\n\n${monthBody}\n`;
      })
      .join("\n");
  }

  const part1 = formatTelegramMessage(sortedData, 0, 2);
  const part2 = formatTelegramMessage(sortedData, 3, 5);
  const part3 = formatTelegramMessage(sortedData, 6, 8);
  const part4 = formatTelegramMessage(sortedData, 9, 11);

  await ctx.replyWithMarkdown("Список праздников (Январь-Март):\n\n" + part1, {
    disable_web_page_preview: true,
  });
  await ctx.replyWithMarkdown("Список праздников (Апрель-Июнь):\n\n" + part2, {
    disable_web_page_preview: true,
  });
  await ctx.replyWithMarkdown(
    "Список праздников (Июль-Сентябрь):\n\n" + part3,
    {
      disable_web_page_preview: true,
    },
  );
  await ctx.replyWithMarkdown(
    "Список праздников (Октябрь-Декабрь):\n\n" + part4,
    {
      disable_web_page_preview: true,
    },
  );
};
