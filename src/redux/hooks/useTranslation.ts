import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import en from "../../locales/en.json";
import gu from "../../locales/guj.json";

const translations: Record<string, any> = {
  en,
  gu,
};

const formatKeyToTitleCase = (key: string): string => {
  if (!key) return key;
  if (key.includes("_")) {
    return key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
  return key;
};

export const useTranslation = () => {
  const language = useSelector((state: RootState) => state.language.language);

  const t = (key: string, defaultValue?: string): string => {
    const activeDict = translations[language] || translations.en;
    if (activeDict && activeDict[key]) {
      return activeDict[key];
    }
    if (defaultValue) {
      return defaultValue;
    }
    return formatKeyToTitleCase(key);
  };

  return { t };
};
