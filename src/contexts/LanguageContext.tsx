"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Fallback empty dictionaries if fetch fails or is incomplete
const defaultDictionaries: Record<string, any> = {
    tr: { common: { save: "Kaydet", cancel: "İptal", welcome: "Hoş geldiniz" } },
    en: { common: { save: "Save", cancel: "Cancel", welcome: "Welcome" } },
    de: { common: { save: "Speichern", cancel: "Abbrechen", welcome: "Willkommen" } }
};

type Language = "tr" | "en" | "de";

interface LanguageContextProps {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string, variables?: Record<string, any>) => string;
}

const LanguageContext = createContext<LanguageContextProps>({
    language: "tr",
    setLanguage: () => {},
    t: (key) => key,
});

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguageState] = useState<Language>("tr");
    const [dictionaries, setDictionaries] = useState<Record<string, any>>(defaultDictionaries);

    useEffect(() => {
        // Load user's preferred language from local storage
        const savedLang = localStorage.getItem("periodya_lang") as Language;
        if (savedLang && ["tr", "en", "de"].includes(savedLang)) {
            setLanguageState(savedLang);
        }

        // Future: Fetch extended dictionaries from a server or dynamic imports here
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem("periodya_lang", lang);
        // Optionally reload or sync state to server
    };

    const t = (key: string, variables?: Record<string, any>): string => {
        const keys = key.split(".");
        let value = dictionaries[language];

        for (const k of keys) {
            if (value && typeof value === 'object') {
                value = value[k];
            } else {
                value = undefined;
                break;
            }
        }

        // If string not found in target language, fallback to TR or just return the key
        if (value === undefined) {
             let trValue = dictionaries["tr"];
             for (const k of keys) {
                if (trValue && typeof trValue === 'object') trValue = trValue[k];
                else { trValue = undefined; break; }
             }
             value = trValue !== undefined ? trValue : key;
        }

        if (typeof value !== 'string') return key;

        // Replace variables e.g. {name} -> variables.name
        if (variables) {
            return value.replace(/\{(\w+)\}/g, (_, vKey) => {
                return variables[vKey] !== undefined ? variables[vKey] : `{${vKey}}`;
            });
        }

        return value;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
