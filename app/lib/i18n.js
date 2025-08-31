import en from "./locales/en.json" assert { type: "json" };

let currentLocale = "en";
const bundles = { en };

export function setLocale(locale) {
  if (bundles[locale]) currentLocale = locale;
}

export function getLocale() {
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

