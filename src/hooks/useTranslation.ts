import { useSettings } from "@/provider/settingsProvider";
import { translations } from "@/lib/translations";

export function useTranslation() {
  const { settings } = useSettings();
  const lang = (settings?.language || "it") as "it" | "en";

  const t = (
    key: string,
    paramsOrDefault?: Record<string, string | number> | string,
    fallback?: string
  ): string => {
    const keys = key.split(".");
    let current: any = translations[lang];

    for (const k of keys) {
      if (current && typeof current === "object" && k in current) {
        current = current[k];
      } else {
        current = undefined;
        break;
      }
    }

    // Fallback to Italian if English key is missing
    if (current === undefined && lang !== "it") {
      let itCurrent: any = translations["it"];
      for (const itK of keys) {
        if (itCurrent && typeof itCurrent === "object" && itK in itCurrent) {
          itCurrent = itCurrent[itK];
        } else {
          itCurrent = undefined;
          break;
        }
      }
      current = itCurrent;
    }

    let result = "";
    if (typeof current === "string") {
      result = current;
    } else if (typeof paramsOrDefault === "string") {
      result = paramsOrDefault;
    } else if (fallback !== undefined) {
      result = fallback;
    } else {
      result = key;
    }

    // Param interpolation (e.g. {count}, {year})
    if (typeof paramsOrDefault === "object" && paramsOrDefault !== null) {
      Object.entries(paramsOrDefault).forEach(([pKey, pVal]) => {
        result = result.replace(new RegExp(`\\{${pKey}\\}`, "g"), String(pVal));
      });
    }

    return result;
  };

  return { t, lang };
}

export type UseTranslationReturn = ReturnType<typeof useTranslation>;
