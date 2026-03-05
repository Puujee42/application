import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from '../translations/en.json';
import mn from '../translations/mn.json';
import de from '../translations/de.json';

const resources = {
  en: { translation: en },
  mn: { translation: mn },
  de: { translation: de },
};

const LANGUAGE_KEY = 'user-language';

export const supportedLanguages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'mn', name: 'Mongolian', nativeName: 'Монгол' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
];

export const initI18n = async () => {
  let savedLanguage: string | null = null;

  try {
    savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
  } catch {
    console.log('Could not get saved language');
  }

  if (!savedLanguage) {
    const deviceLanguage = Localization.getLocales()[0]?.languageCode;
    savedLanguage = ['mn', 'de'].includes(deviceLanguage ?? '') ? deviceLanguage! : 'en';
  }

  await i18n.use(initReactI18next).init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: 'v4',
  });

  return i18n;
};

export const changeLanguage = async (lang: string) => {
  await i18n.changeLanguage(lang);
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  } catch {
    console.log('Could not save language');
  }
};

export default i18n;
