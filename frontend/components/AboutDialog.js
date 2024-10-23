import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, Typography, Button, CssBaseline } from '@mui/material';
import Image from 'next/image';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import styles from '../styles/AboutDialog.module.css';
import strings from '../../locales/strings';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
  },
  typography: {
    body1: {
      color: '#ffffff',
    },
    body2: {
      color: '#b0bec5',
    },
    h6: {
      color: '#ffffff',
    },
  },
});

const AboutDialog = ({ open, onClose, language = 'en' }) => {
    const [iconPath, setIconPath] = useState('');
    const langStrings = strings[language] || strings['en'];
    // Fetch the icon path when the component is mounted
    useEffect(() => {
      const isDevelopment = process.env.NODE_ENV === 'development';
  
      if (isDevelopment) {
        setIconPath('/icons/daw_app_icon_no_bg_256.png');
      } else if (window.electronAPI) {
        window.electronAPI.getIconPath().then((path) => {
          setIconPath(path);
        });
      }
    }, []);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Dialog open={open} onClose={onClose} PaperProps={{ className: styles.dialogPaper }}>
        {/* Icon added */}
        <div className={styles.iconContainer}>
          <Image
              // src="/icons/daw_app_icon_no_bg_256.png"
              src={iconPath}
              alt="About Icon"
              width={80}
              height={80}
              className={styles.icon}
            />
        </div>
        {/* <DialogTitle>{langStrings.aboutMyDawProjects}</DialogTitle> */}
        <DialogContent>
          {/* <Typography variant="body1" gutterBottom>
            My DAW Projects Dashboard v1.0
          </Typography> */}
          <Typography variant="body2" className={styles.typography} gutterBottom>
            {langStrings.aboutApp}
          </Typography>
          <Typography variant="body2" className={styles.typography} gutterBottom>
            {langStrings.aboutFeatures.title}
          </Typography>
          <div>
            <ul className={styles.featureList}>
              {langStrings.aboutFeatures.list.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </div>
          <Typography variant="body2" className={styles.typography} gutterBottom>
            Developed by @CoreSignal <br />
            Credits to: nukearts <br />
            Copyright © 2024
          </Typography>
        </DialogContent>
        <div className={styles.buttonContainer}>
          <Button variant="contained" color="primary" onClick={onClose}>
            {langStrings.close}
          </Button>
        </div>
      </Dialog>
    </ThemeProvider>
  );
};

export default AboutDialog;
