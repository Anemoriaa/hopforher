const DEFAULT_LOCALE = "en-US";
const RTL_LANGUAGE_CODES = new Set(["ar", "dv", "fa", "he", "ku", "ps", "sd", "ug", "ur", "yi"]);

function normalizeLocaleEntries(values) {
  const entries = values
    .flat()
    .map((value) => String(value || "").trim().replace(/_/g, "-"))
    .filter(Boolean);

  if (!entries.length) {
    return [DEFAULT_LOCALE];
  }

  if (typeof Intl !== "undefined" && typeof Intl.getCanonicalLocales === "function") {
    const canonicalEntries = [];

    for (const entry of entries) {
      try {
        canonicalEntries.push(...Intl.getCanonicalLocales(entry));
      } catch (error) {
        // Ignore malformed locale tokens so valid entries still survive.
      }
    }

    return canonicalEntries.length ? [...new Set(canonicalEntries)] : [DEFAULT_LOCALE];
  }

  return [...new Set(entries)];
}

function getDisplayName(value, type, locales) {
  if (!value || typeof Intl === "undefined" || typeof Intl.DisplayNames !== "function") {
    return "";
  }

  try {
    return new Intl.DisplayNames(normalizeLocaleEntries([locales, DEFAULT_LOCALE]), { type }).of(value) || "";
  } catch (error) {
    return "";
  }
}

function getLocaleDetails(localeTag) {
  let locale = null;
  let maximized = null;

  if (typeof Intl !== "undefined" && typeof Intl.Locale === "function") {
    try {
      locale = new Intl.Locale(localeTag);
      maximized = typeof locale.maximize === "function" ? locale.maximize() : locale;
    } catch (error) {
      locale = null;
      maximized = null;
    }
  }

  const parts = String(localeTag || DEFAULT_LOCALE).split("-");
  const languageCode = locale?.language || maximized?.language || parts[0]?.toLowerCase() || "en";
  const regionCode = (
    locale?.region ||
    maximized?.region ||
    parts.slice(1).find((part) => /^[A-Za-z]{2}$/.test(part)) ||
    ""
  ).toUpperCase();
  const scriptCode = locale?.script || maximized?.script || "";
  const direction =
    locale?.textInfo?.direction ||
    maximized?.textInfo?.direction ||
    (RTL_LANGUAGE_CODES.has(languageCode) ? "rtl" : "ltr");

  return {
    languageCode,
    regionCode,
    scriptCode,
    direction,
  };
}

function getDateInstance(value) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getPreferredLocales(preferredLocales) {
  if (Array.isArray(preferredLocales) && preferredLocales.length) {
    return normalizeLocaleEntries(preferredLocales);
  }

  if (typeof preferredLocales === "string" && preferredLocales.trim()) {
    return normalizeLocaleEntries([preferredLocales]);
  }

  if (typeof navigator !== "undefined") {
    const browserLocales =
      Array.isArray(navigator.languages) && navigator.languages.length ? navigator.languages : [navigator.language];

    return normalizeLocaleEntries(browserLocales);
  }

  if (typeof Intl !== "undefined") {
    try {
      return normalizeLocaleEntries([Intl.DateTimeFormat().resolvedOptions().locale || DEFAULT_LOCALE]);
    } catch (error) {
      return [DEFAULT_LOCALE];
    }
  }

  return [DEFAULT_LOCALE];
}

export function getRegionFlagEmoji(regionCode) {
  if (!/^[A-Z]{2}$/.test(regionCode)) {
    return "🌐";
  }

  return String.fromCodePoint(...regionCode.split("").map((char) => 127397 + char.charCodeAt(0)));
}

export function getLocaleProfile(preferredLocales) {
  const locales = getPreferredLocales(preferredLocales);
  let resolvedLocale = locales[0] || DEFAULT_LOCALE;

  if (typeof Intl !== "undefined") {
    try {
      resolvedLocale = new Intl.DateTimeFormat(locales).resolvedOptions().locale || resolvedLocale;
    } catch (error) {
      resolvedLocale = locales[0] || DEFAULT_LOCALE;
    }
  }

  const { languageCode, regionCode, scriptCode, direction } = getLocaleDetails(resolvedLocale);
  const languageLabel = getDisplayName(languageCode, "language", locales) || languageCode.toUpperCase();
  const regionLabel = getDisplayName(regionCode, "region", locales) || regionCode;
  const badgeLabel = [languageLabel, regionLabel].filter(Boolean).join(" · ");

  return {
    locales,
    primaryLocale: locales[0] || DEFAULT_LOCALE,
    resolvedLocale,
    languageCode,
    regionCode,
    scriptCode,
    direction,
    languageLabel,
    regionLabel,
    emoji: regionCode ? getRegionFlagEmoji(regionCode) : "🌐",
    badgeLabel: badgeLabel || "Global",
  };
}

export function buildLocaleBadge(profile) {
  const badgeLabel = profile?.badgeLabel || "Global";

  return {
    emoji: profile?.emoji || "🌐",
    title: badgeLabel,
    screenReaderLabel: badgeLabel,
  };
}

export function applyDocumentLocale(profile) {
  if (!profile || typeof document === "undefined") {
    return;
  }

  document.documentElement.lang = profile.resolvedLocale || DEFAULT_LOCALE;
  document.documentElement.dir = profile.direction || "ltr";
}

export function formatDateForLocales(value, locales, options) {
  const parsed = getDateInstance(value);

  if (!parsed) {
    return typeof value === "string" ? value : "";
  }

  try {
    return new Intl.DateTimeFormat(getPreferredLocales(locales), options).format(parsed);
  } catch (error) {
    return new Intl.DateTimeFormat(DEFAULT_LOCALE, options).format(parsed);
  }
}
