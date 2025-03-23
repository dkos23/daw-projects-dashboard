import { useState, useEffect } from 'react';
import '../frontend/styles/globals.css';
import '../frontend/styles/DawDashboard.module.css';
import '../frontend/styles/DawProjectsTable.module.css';
import '../frontend/styles/Settings.module.css';
import AboutDialog from '../frontend/components/AboutDialog';
import { LanguageProvider } from "../frontend/context/LanguageContext";

function MyApp({ Component, pageProps }) {
  const [openAboutDialog, setOpenAboutDialog] = useState(false);
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    const savedLang = typeof window !== "undefined" ? localStorage.getItem("language") : "en";
    setLanguage(savedLang);

    if (typeof window !== "undefined" && window.electronAPI) {
      window.electronAPI.onSetLocale((locale) => {
        const langCode = locale.split('-')[0];
        // console.log("🟢 [APP] Electron set locale:", langCode);
        setLanguage(langCode);
        localStorage.setItem("language", langCode);
      });

      window.electronAPI.onOpenAboutDialog(() => {
        setOpenAboutDialog(true);
      });
    }
  }, []);

  // useEffect(() => {
  //   console.log("🟢 [APP] Current language state:", language);
  // }, [language]);

  return (
    <LanguageProvider>
      <Component key={language} {...pageProps} />
      {/* <Component {...pageProps} /> */}
      <AboutDialog open={openAboutDialog} onClose={() => setOpenAboutDialog(false)} />
    </LanguageProvider>
  );
}

export default MyApp;
