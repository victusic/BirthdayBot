import { setConversationState } from "..";
import {
  addPeopleDate,
  addPeopleName,
  addPeopleSticker,
  setAddPeople,
  setRecordPeople,
} from "../actions/addPeople";
import { holidaysList } from "../actions/holidaysList";
import { mainLayout } from "../actions/main";
import { nowMonthList } from "../actions/newsletters";
import {
  editPeopleDate,
  editPeopleSticker,
  peoplesList,
  peoplesListSetPeople,
  setEditPeople,
  setRecordEditPeople,
} from "../actions/peoplesList";
import {
  mainSettings,
  nowConfigurationSettings,
  setTimeSettings,
  setTimeZoneSettings,
} from "../actions/settings";

const { ContextMessageUpdate } = require("telegraf");

export function handleSwitchLogic(
  ctx: typeof ContextMessageUpdate,
  userId: number,
  userText: string,
  conversationState: { [key: number]: string },
) {
  switch (conversationState[userId]) {
    case "mainLayout":
      if (userText === "Настройки") {
        mainSettings(ctx);
        setConversationState(ctx, "settingsMain");
      }
      if (userText === "Добавить человека") {
        addPeopleName(ctx);
        setConversationState(ctx, "addPeopleName");
      }
      if (userText === "Список дней рождений") {
        peoplesList(ctx);
        setConversationState(ctx, "peoplesList");
      }
      if (userText === "Список праздников") holidaysList(ctx);
      if (userText === "События (за месяц)") nowMonthList(ctx);
      if (userText === "Назад" || userText === "Отмена") mainLayout(ctx);
      break;
    case "settingsMain":
      if (userText === "Назад") {
        userText === "Назад" && mainLayout(ctx);
        setConversationState(ctx, "mainLayout");
        break;
      }
      {
        userText === "Текущие настройки" && nowConfigurationSettings(ctx);
      }
      break;
    case "settingsConfigurate":
      {
        userText === "Назад" && mainSettings(ctx);
        setConversationState(ctx, "settingsMain");
      }
      break;
    case "settingsDate":
      {
        userText === "Назад" && mainSettings(ctx);
        setConversationState(ctx, "settingsMain");
      }
      break;
    case "settingsTime": {
      if (userText === "Пропустить") {
        setTimeZoneSettings(ctx, 999);
        setConversationState(ctx, "settingsTimeZone");
        break;
      }
      userText === "Назад" && mainSettings(ctx);
      setConversationState(ctx, "settingsMain");
      break;
    }
    case "settingsTimeZone":
      if (userText === "Назад") {
        mainSettings(ctx);
        setConversationState(ctx, "settingsMain");
        break;
      }
      {
        userText && setTimeSettings(ctx, userText);
        setConversationState(ctx, "settingsTimeZone");
      }
      break;
    case "addPeopleName":
      if (userText === "Отмена") {
        mainLayout(ctx);
        setConversationState(ctx, "mainLayout");
        break;
      }
      {
        userText && addPeopleDate(ctx, userText);
      }
      break;
    case "addPeopleDate":
      if (userText === "Отмена") {
        mainLayout(ctx);
        setConversationState(ctx, "mainLayout");
        break;
      }
      {
        userText && addPeopleSticker(ctx, userText);
      }
      break;
    case "addPeopleSticker":
      if (userText === "Отмена") {
        mainLayout(ctx);
        setConversationState(ctx, "mainLayout");
        break;
      }
      {
        userText && setAddPeople(ctx, userText);
      }
      break;
    case "setAddPeople":
      if (userText === "Отмена") {
        mainLayout(ctx);
        setConversationState(ctx, "mainLayout");
        break;
      }
      if (userText === "Сохранить") {
        setRecordPeople(ctx);
        setConversationState(ctx, "mainLayout");
        break;
      }
      break;
    case "peoplesList":
      if (userText === "Назад") {
        mainLayout(ctx);
        setConversationState(ctx, "mainLayout");
        break;
      }
      if (userText === "Редактировать") {
        peoplesListSetPeople(ctx);
        setConversationState(ctx, "peoplesListSetPeople");
        break;
      }
      break;
    case "peoplesListSetPeople":
      if (userText === "Назад") {
        peoplesList(ctx);
        setConversationState(ctx, "peoplesList");
        break;
      }
      break;
    case "setConfiguratePeople":
      if (userText === "Назад") {
        peoplesListSetPeople(ctx);
        setConversationState(ctx, "peoplesListSetPeople");
        break;
      }
      break;
    case "setDeletePeople":
      if (userText === "Назад") {
        peoplesListSetPeople(ctx);
        setConversationState(ctx, "peoplesListSetPeople");
        break;
      }
      break;
    case "editPeopleName":
      if (userText === "Отмена") {
        peoplesListSetPeople(ctx);
        setConversationState(ctx, "peoplesListSetPeople");
        break;
      }
      {
        userText && editPeopleDate(ctx, userText);
      }
      break;
    case "editPeopleDate":
      if (userText === "Отмена") {
        peoplesListSetPeople(ctx);
        setConversationState(ctx, "peoplesListSetPeople");
        break;
      }
      {
        userText && editPeopleSticker(ctx, userText);
      }
      break;
    case "editPeopleSticker":
      if (userText === "Отмена") {
        editPeopleDate(ctx, userText);
        setConversationState(ctx, "editPeopleDate");
        break;
      }
      {
        userText && setEditPeople(ctx, userText);
      }
      break;
    case "setEditPeople":
      if (userText === "Отмена") {
        peoplesListSetPeople(ctx);
        setConversationState(ctx, "peoplesListSetPeople");
        break;
      }
      if (userText === "Сохранить") {
        setRecordEditPeople(ctx);
        setConversationState(ctx, "mainLayout");
        break;
      }
      break;
    default:
      // Обработка других состояний, если необходимо
      break;
  }
}
