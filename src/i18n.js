/**
 * Vue I18n configuration.
 * Handles translations and locale persistence.
 */

import { createI18n } from 'vue-i18n';

import en from './locales/en.json';
import es from './locales/es.json';

const defaultLocale =
    localStorage.getItem('autoservice-locale') || 'es';

const i18n = createI18n({
    legacy: false,

    locale: defaultLocale,
    fallbackLocale: 'es',

    messages: {
        en,
        es
    },

    compilerOptions: {
        escapeHtml: false,
        strictMessage: false
    },

    warnHtmlMessage: false,
    missingWarn: false,
    fallbackWarn: false
});

export default i18n;