import { useDispatch, useSelector } from "react-redux";
import { setLanguage } from "@/redux/slices/languageSlice";
import { RootState } from "@/redux/store";
import { useEffect } from "react";

const LanguageSwitcher = () => {
  const dispatch = useDispatch();
  const language = useSelector((state: RootState) => state.language.language);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setLanguage(e.target.value as "en" | "gu"));
  };
  
  useEffect(() => {
    const localLanguage = localStorage.getItem("language");
    if (localLanguage) {
      dispatch(setLanguage(localLanguage as "en" | "gu"));
    }
  }, [dispatch]);

  return (
    <select value={language} onChange={handleChange} className="p-2 border rounded">
      <option value="en">English</option>
      <option value="gu">Gujarati</option>
    </select>
  );
};

export default LanguageSwitcher;
