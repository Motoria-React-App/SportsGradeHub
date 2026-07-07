import { useSettings } from "@/provider/settingsProvider";
import { translations } from "@/lib/translations";

export function useTranslation() {
  const { settings } = useSettings();
  const lang = settings.language || "it";

  const t = (key: string, defaultValue?: string): string => {
    const keys = key.split(".");
    let current: any = translations[lang];

    for (const k of keys) {
      if (current && typeof current === "object" && k in current) {
        current = current[k];
      } else {
        // Fallback to Italian if English key is missing
        let itCurrent: any = translations["it"];
        for (const itK of keys) {
          if (itCurrent && typeof itCurrent === "object" && itK in itCurrent) {
            itCurrent = itCurrent[itK];
          } else {
            itCurrent = undefined;
            break;
          }
        }
        return itCurrent !== undefined && typeof itCurrent === "string" 
          ? itCurrent 
          : (defaultValue !== undefined ? defaultValue : key);
      }
    }

    return typeof current === "string" ? current : (defaultValue !== undefined ? defaultValue : key);
  };

  return { t, lang };
}
export type UseTranslationReturn = ReturnType<typeof useTranslation>;
