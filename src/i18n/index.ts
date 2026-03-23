import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import hi from './locales/hi.json'
import mr from './locales/mr.json'

const stored =
  typeof localStorage !== 'undefined' ? localStorage.getItem('i18nextLng') : null

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    mr: { translation: mr },
  },
  lng: stored && ['en', 'hi', 'mr'].includes(stored) ? stored : 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
