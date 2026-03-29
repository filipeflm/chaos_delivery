import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Language, Translations } from './translations';
import { TRANSLATIONS } from './translations';

interface LanguageContextValue {
  lang: Language;
  t: Translations;
  setLang: (l: Language) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  t: TRANSLATIONS.en,
  setLang: () => {},
});

function getInitialLang(): Language {
  const stored = localStorage.getItem('doc_lang');
  if (stored === 'en' || stored === 'pt') return stored;
  const browser = navigator.language.toLowerCase();
  return browser.startsWith('pt') ? 'pt' : 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(getInitialLang);

  function setLang(l: Language) {
    setLangState(l);
    localStorage.setItem('doc_lang', l);
  }

  return (
    <LanguageContext.Provider value={{ lang, t: TRANSLATIONS[lang], setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
