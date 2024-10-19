import { useState, useEffect } from 'react';
// styles
import '../frontend/styles/globals.css';
import '../frontend/styles/DawDashboard.module.css';
import '../frontend/styles/DawProjectsTable.module.css';
import '../frontend/styles/Settings.module.css';
// components
import AboutDialog from '../frontend/components/AboutDialog';

function MyApp({ Component, pageProps }) {
  const [openAboutDialog, setOpenAboutDialog] = useState(false);
  const [language, setLanguage] = useState('de');

  // Listen for the 'open-about-dialog' event from the Electron main process
  useEffect(() => {
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

  // Log the language whenever it changes
  useEffect(() => {
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



// import '../frontend/styles/globals.css';
// import '../frontend/styles/DawDashboard.module.css';
// import '../frontend/styles/DawProjectsTable.module.css';
// import '../frontend/styles/Settings.module.css';

// function MyApp({ Component, pageProps }) {
//   return <Component {...pageProps} />;
// }

// export default MyApp;
