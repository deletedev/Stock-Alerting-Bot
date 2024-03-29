import { ContextMessageUpdate, Markup as m, Extra } from 'telegraf'
import { readdirSync, readFileSync } from 'fs'
import { safeLoad } from 'js-yaml'
import { TelegramLanguage } from '../models'
import { sendTimzone } from './timezone'
import { defaultKeyboard } from './help'

export function sendLanguage(ctx: ContextMessageUpdate) {
  return ctx.reply(
    ctx.i18n && ctx.dbuser.telegramLanguage
      ? ctx.i18n.t('language')
      : `Please, select language.
Пожалуйста, выберите язык.`,
    {
      reply_markup: languageKeyboard(),
    },
  )
}

export async function handleLanguage(ctx: ContextMessageUpdate) {
  if (!ctx.dbuser.telegramLanguage) {
    ctx.dbuser.session.stage = 'languageSelected'
    await ctx.saveSession()
  }
  ctx.dbuser.telegramLanguage = ctx.callbackQuery.data as TelegramLanguage

  ctx.dbuser = await ctx.dbuser.save()
  const message = ctx.callbackQuery.message
  const anyI18N = ctx.i18n as any
  anyI18N.locale(ctx.callbackQuery.data)
  await ctx.telegram.editMessageText(
    message.chat.id,
    message.message_id,
    undefined,
    ctx.i18n.t('language_selected'),
    { parse_mode: 'HTML' },
  )
  await ctx.reply('ok', defaultKeyboard(ctx))
  if (ctx.dbuser.session?.stage === 'languageSelected') {
    return sendTimzone(ctx)
  }
  return
}

function languageKeyboard() {
  const locales = localesFiles()
  const result = []
  locales.forEach((locale, index) => {
    const localeCode = locale.split('.')[0]
    const localeName = safeLoad(
      readFileSync(`${__dirname}/../../locales/${locale}`, 'utf8'),
    ).name

    if (index % 2 == 0) {
      if (index === 0) {
        result.push([m.callbackButton(localeName, localeCode)])
      } else {
        result[result.length - 1].push(m.callbackButton(localeName, localeCode))
      }
    } else {
      result[result.length - 1].push(m.callbackButton(localeName, localeCode))
      if (index < locales.length - 1) {
        result.push([])
      }
    }
  })

  return m.inlineKeyboard(result)
}

export function localesFiles() {
  return readdirSync(`${__dirname}/../../locales`)
}
