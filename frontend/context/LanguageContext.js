import React, { createContext, useState, useEffect, useContext } from "react";
import defaultStrings from "../../public/locales/strings.json";

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState("en");
  const [strings, setStrings] = useState(defaultStrings);

  // useEffect(() => {
  //   const savedLang = localStorage.getItem("language") || "en";
  //   setLanguage(savedLang);

  //   fetch("/locales/strings.json")
  //     .then((res) => res.json())
  //     .then((data) => {
  //       setStrings(data);
  //       // console.log("🟢 [LANG] Strings Loaded:", data);
  //     })
  //     .catch((error) => console.error("🔴 Error loading translations:", error));
  // }, []);

  useEffect(() => {
    const savedLang = typeof window !== "undefined" ? localStorage.getItem("language") : "en";
    setLanguage(savedLang);

    const fetchTranslations = async () => {
      const savedLang = typeof window !== "undefined" ? localStorage.getItem("language") || "en" : "en";
      setLanguage(savedLang);
  
      if (typeof window !== "undefined" && window.electronAPI) {
        try {
          const stringsPath = await window.electronAPI.getPath("strings.json");
          console.log("🟢 [LANG] Electron detected - Loading from:", stringsPath);
  
          // ✅ Fix: Use IPC handler for `isPackaged`
          const isPackaged = await window.electronAPI.isPackaged();
  
          if (isPackaged) {
            // 🏭 **Production Mode** → Use `fetch()`
            const response = await fetch(`file://${stringsPath}`);
            const data = await response.json();
            setStrings(data);
          } else {
            // 🛠️ **Development Mode** → Use `fs.readFileSync()`
            const fileContent = await window.electronAPI.readFile(stringsPath);
            setStrings(JSON.parse(fileContent));
            console.log("🟢 [LANG] Loaded translations via IPC in dev mode");
          }
        } catch (error) {
          console.error("🔴 [LANG] Failed to load translations in Electron:", error);
        }
      } else {
        console.log("🟢 [LANG] Fetching translations in browser from /locales/strings.json");
        fetch("/locales/strings.json")
          .then((res) => res.json())
          .then((data) => setStrings(data))
          .catch((error) =>
            console.error("🔴 Error loading translations in Browser:", error)
          );
      }
    };
  
    fetchTranslations();
  }, []);

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, strings }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
