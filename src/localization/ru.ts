import { PartialDictionary } from './types';

/** Russian translations — partial by design, see `es.ts`'s header note for the scoping rationale. */
export const ru: PartialDictionary = {
  common: {
    back: 'Назад',
    cancel: 'Отмена',
    close: 'Закрыть',
    confirm: 'Подтвердить',
    continue: 'Продолжить',
    done: 'Готово',
    save: 'Сохранить',
    saveChanges: 'Сохранить изменения',
    next: 'Далее',
    skip: 'Пропустить',
    retry: 'Повторить',
    delete: 'Удалить',
    edit: 'Изменить',
    add: 'Добавить',
    remove: 'Убрать',
    ok: 'ОК',
    yes: 'Да',
    no: 'Нет',
    loading: 'Загрузка…',
  },
  errors: {
    generic: 'Что-то пошло не так. Попробуйте ещё раз.',
    network: 'Не удалось подключиться к серверу. Проверьте соединение и попробуйте снова.',
    bad_request: 'Не удалось обработать запрос.',
    unauthorized: 'Сессия истекла. Войдите снова.',
    forbidden: 'У вас нет разрешения на это действие.',
    not_found: 'Мы не смогли найти то, что вы искали.',
    validation: 'Часть указанной информации недействительна.',
    server: 'Произошла ошибка на нашей стороне. Повторите попытку позже.',
    cancelled: 'Запрос отменён.',
    unknown: 'Произошла непредвиденная ошибка.',
  },
  validation: {
    required: 'Это поле обязательно.',
    fieldRequired: '{{field}} обязательно для заполнения.',
    invalidEmail: 'Введите действительный адрес электронной почты.',
    passwordTooShort: 'Пароль должен содержать не менее 8 символов.',
    passwordsDontMatch: 'Пароли не совпадают.',
  },
  language: {
    selectTitle: 'Выберите язык',
    selectSubtitle: 'Вы можете изменить его позже в настройках.',
    continueCta: 'Продолжить',
  },
  splash: {
    tagline: 'Голодание · Питание · Активность · Медитация',
  },
  onboarding: {
    stepProgress: 'Шаг {{step}} из {{total}}',
    welcome: {
      tagline: 'Ваше здоровье — в гармонии.',
      begin: 'Начать',
    },
  },
};
