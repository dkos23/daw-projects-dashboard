import { useState, useEffect } from 'react';
import '../frontend/styles/globals.css';
import '../frontend/styles/DawDashboard.module.css';
import '../frontend/styles/DawProjectsTable.module.css';
import '../frontend/styles/Settings.module.css';
import AboutDialog from '../frontend/components/AboutDialog';
import strings from '../locales/strings';
import config from '../public/app_config.js';

function MyApp({ Component, pageProps }) {
  const [openAboutDialog, setOpenAboutDialog] = useState(false);
  const [language, setLanguage] = useState(config.defaultLanguage);
  const langStrings = strings[language] || strings['en'];

  // Listen for the 'open-about-dialog' event from the Electron main process
  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") || config.defaultLanguage;
    setLanguage(savedLanguage);

    if (window.electronAPI) {
      // Listen for the 'set-locale' event from Electron to get system language
      window.electronAPI.onSetLocale((locale) => {
        const langCode = locale.split('-')[0];  // Get the language part (e.g., 'en' from 'en-US')

        setLanguage(langCode);
        localStorage.setItem('language', langCode);
      });

      window.electronAPI.onOpenAboutDialog(() => {
        setOpenAboutDialog(true);
      });
    }
  }, []);

  // Update the document title based on the selected language
  useEffect(() => {
    document.title = langStrings.settings;
    console.log("Current language: ", language);
  }, [language]);

  // Handle closing the About dialog
  const handleClose = () => {
    setOpenAboutDialog(false);
  };

  return (
    <>
      <Component {...pageProps} language={language} />

      {/* About Dialog */}
      <AboutDialog open={openAboutDialog} onClose={handleClose} language={language} />
    </>
  );
}

export default MyApp;