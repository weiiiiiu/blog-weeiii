import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { dateToYMDHM, getDateParts } from "lib/date";
import { siteInfo } from "site.config";
import { useHydrated } from "./use-hydrated";

const shortMonths = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * Hook for internationalized date formatting
 * Uses useTranslation internally to subscribe to language changes
 */
export function useDateI18n() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage;
  const hydrated = useHydrated();
  const timeZone = hydrated
    ? undefined
    : (siteInfo.timeZone ?? "Asia/Shanghai");

  /**
   * Get English ordinal suffix (1st, 2nd, 3rd, 4th...)
   */
  const getEngOrdinalSuffix = useCallback((day: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = day % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  }, []);

  /**
   * Format date with i18n
   * @param d Date object
   * @param mode 'dateNatural' = "Jan 6th, 2026", 'dateYMD' = "2026-01-06"
   */
  const dateI18n = useCallback(
    (d: Date, mode: "dateYMD" | "dateNatural" = "dateNatural"): string => {
      const parts = getDateParts(d, timeZone);
      const year = Number(parts.year);
      const month = Number(parts.month);
      const day = Number(parts.day);
      const hour = Number(parts.hour);
      const minute = Number(parts.minute);
      if (mode !== "dateNatural" || lang !== "en") {
        return t(`ui.${mode}`, {
          year,
          month,
          day,
          hour,
          minute,
        });
      } else {
        return t(`ui.${mode}`, {
          year,
          month: shortMonths[month - 1],
          day,
          daySuffix: getEngOrdinalSuffix(day),
          hour,
          minute,
        });
      }
    },
    [t, lang, getEngOrdinalSuffix, timeZone],
  );

  /**
   * Format relative time (x minutes ago)
   */
  const dateRelative = useCallback(
    (d: Date): string => {
      // Relative time changes between build and visit. Start with a fixed timestamp.
      if (!hydrated) return dateToYMDHM(d, timeZone);
      const now = new Date();
      const diff = now.getTime() - d.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return t("ui.timeJustNow");
      if (minutes < 60) return t("ui.timeMinutesAgo", { count: minutes });
      if (hours < 24) return t("ui.timeHoursAgo", { count: hours });
      if (days < 7) return t("ui.timeDaysAgo", { count: days });

      // Over 7 days, show actual date
      return dateToYMDHM(d);
    },
    [t, hydrated, timeZone],
  );

  /**
   * Parse Memo ID and return display string
   * If parsing fails, returns the ID itself
   */
  const parseMemoIdDisplay = useCallback(
    (id: string, parseDate: (str: string) => Date): string => {
      const parsed = parseDate(id);
      if (parsed.getTime() === -1) {
        return id;
      }
      return dateRelative(parsed);
    },
    [dateRelative],
  );

  return { dateI18n, dateRelative, parseMemoIdDisplay };
}

export default useDateI18n;
