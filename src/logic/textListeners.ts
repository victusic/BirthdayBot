import { setConversationState } from "..";
import { addPeopleName } from "../actions/addPeople";
import {
  editPeopleName,
  reqDeletePeople,
  setConfiguratePeople,
  setDeletePeople,
} from "../actions/peoplesList";
import {
  configurateSettings,
  dateSettings,
  mainSettings,
  setConfigurateSettings,
  setDateSettings,
  setTimeZoneSettings,
  timeSettings,
} from "../actions/settings";

const { Telegraf, ContextMessageUpdate } = require("telegraf");

export async function handleListenLogic(bot: typeof Telegraf) {
  //блок настроек
  bot.action("Настройки", (ctx: typeof ContextMessageUpdate) => {
    setConversationState(ctx, "settingsMain");
    mainSettings(ctx);
  });

  //конфигурация рассылки
  bot.action("Конфигурация рассылки", (ctx: typeof ContextMessageUpdate) => {
    setConversationState(ctx, "settingsConfigurate");
    configurateSettings(ctx);
  });

  bot.action(
    /setСonfiguration:(\d+)/,
    async (ctx: typeof ContextMessageUpdate) => {
      const [, configurateValueId] = ctx.callbackQuery.data.split(":");
      setConversationState(ctx, "settingsMain");
      setConfigurateSettings(ctx, configurateValueId);
    },
  );

  //дата рассылки
  bot.action("Дата рассылки", (ctx: typeof ContextMessageUpdate) => {
    setConversationState(ctx, "settingsDate");
    dateSettings(ctx);
  });

  bot.action(/setDate:(\d+)/, async (ctx: typeof ContextMessageUpdate) => {
    const [, dateValueId] = ctx.callbackQuery.data.split(":");
    setConversationState(ctx, "settingsMain");
    setDateSettings(ctx, dateValueId);
  });

  //время рассылки
  bot.action("Время рассылки", (ctx: typeof ContextMessageUpdate) => {
    setConversationState(ctx, "settingsTime");
    timeSettings(ctx);
  });

  bot.action(/setTime:(\d+)/, async (ctx: typeof ContextMessageUpdate) => {
    const [, timeValueId] = ctx.callbackQuery.data.split(":");
    setConversationState(ctx, "settingsTimeZone");
    setTimeZoneSettings(ctx, timeValueId);
  });

  //добавление людей
  bot.action("Добавить человека", (ctx: typeof ContextMessageUpdate) => {
    setConversationState(ctx, "addPeopleName");
    addPeopleName(ctx);
  });

  //выбор человека для редактирования
  bot.action(/setPeople:(\d+)/, async (ctx: typeof ContextMessageUpdate) => {
    const [, personId] = ctx.callbackQuery.data.split(":");
    setConversationState(ctx, "setConfiguratePeople");
    setConfiguratePeople(ctx, personId);
  });

  //редактирования человека
  bot.action(
    /editPeopleName:(\d+)/,
    async (ctx: typeof ContextMessageUpdate) => {
      const [, personId] = ctx.callbackQuery.data.split(":");
      setConversationState(ctx, "editPeopleName");
      editPeopleName(ctx, personId);
    },
  );

  //удаление человека
  bot.action(/deletePeople:(\d+)/, async (ctx: typeof ContextMessageUpdate) => {
    const [, personId] = ctx.callbackQuery.data.split(":");
    setConversationState(ctx, "setDeletePeople");
    setDeletePeople(ctx, personId);
  });

  //запрос на удаление человека (после подтверждения)
  bot.action(
    /reqDeletePeople:(\d+)/,
    async (ctx: typeof ContextMessageUpdate) => {
      const [, personId] = ctx.callbackQuery.data.split(":");
      reqDeletePeople(ctx, personId);
    },
  );
}
