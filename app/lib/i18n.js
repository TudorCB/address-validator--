import en from "./locales/en.json" assert { type: "json" };

let currentLocale = "en";
const bundles = { en };
export const availableLocales = ["en"]; // extend as more locales are added

export function setLocale(locale) {
  if (bundles[locale]) {
    currentLocale = locale;
    try {
      if (typeof window !== "undefined" && window?.localStorage) {
        window.localStorage.setItem("locale", locale);
        // Notify listeners for simple reactive patterns
        window.dispatchEvent(new CustomEvent("i18n:locale", { detail: { locale } }));
      }
    } catch {}
  }
}

export function getLocale() {
  return currentLocale;
}

export function initI18n() {
  try {
    if (typeof window !== "undefined" && window?.localStorage) {
      const stored = window.localStorage.getItem("locale");
      if (stored && bundles[stored]) currentLocale = stored;
    }
  } catch {}
  return currentLocale;
}

function format(str, vars = {}) {
  return String(str).replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

export function t(key, vars = {}) {
  try {
    const dict = bundles[currentLocale] || en || {};
    const val = dict[key];
    if (val == null) {
      // Fallback: if key not found, treat key as literal string
      return format(key, vars);
    }
    return format(val, vars);
  } catch {
    return key;
  }
}
