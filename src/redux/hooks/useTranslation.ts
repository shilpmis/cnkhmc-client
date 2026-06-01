import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import en from "../../locales/en.json";
import gu from "../../locales/guj.json";

const translations: Record<string, any> = {
  en,
  gu,
};

export const useTranslation = () => {
  const language = useSelector((state: RootState) => state.language.language);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return { t };
};
