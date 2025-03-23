import React, { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Button,
  CssBaseline,
} from "@mui/material";
import Image from "next/image";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import styles from "../styles/AboutDialog.module.css";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#90caf9",
    },
  },
  typography: {
    body1: {
      color: "#ffffff",
    },
    body2: {
      color: "#b0bec5",
    },
    h6: {
      color: "#ffffff",
    },
  },
});

const AboutDialog = ({ open, onClose }) => {
  const [iconPath, setIconPath] = useState("");
  const { language, strings } = useLanguage();

  // Fetch the icon path when the component is mounted
  useEffect(() => {
    const isDevelopment = process.env.NODE_ENV === "development";

    if (isDevelopment) {
      setIconPath("/icons/daw_app_icon_no_bg_256.png");
    } else if (window.electronAPI) {
      window.electronAPI.getIconPath().then((path) => {
        setIconPath(path);
      });
    }
  }, []);

  // Prevent UI crash
  // if (!strings || !strings[language]) {
  //   console.error(`⚠️ Missing language strings for: ${language}`);
  //   return null;
  // }

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Dialog
        open={open}
        onClose={onClose}
        PaperProps={{ className: styles.dialogPaper }}
      >
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
        {/* <DialogTitle>{strings[language]?.aboutMyDawProjects}</DialogTitle> */}
        <DialogContent>
          {/* <Typography variant="body1" gutterBottom>
            My DAW Projects Dashboard v1.0
          </Typography> */}
          <Typography
            variant="body2"
            className={styles.typography}
            gutterBottom
          >
            {strings[language]?.aboutApp}
          </Typography>
          <Typography
            variant="body2"
            className={styles.typography}
            gutterBottom
          >
            {strings[language]?.aboutFeatures.title}
          </Typography>
          <div>
            <ul className={styles.featureList}>
              {strings[language]?.aboutFeatures.list.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </div>
          <Typography
            variant="body2"
            className={styles.typography}
            gutterBottom
          >
            Developed by @CoreSignal <br />
            Copyright © 2025
          </Typography>
        </DialogContent>
        <div className={styles.buttonContainer}>
          <Button variant="contained" color="primary" onClick={onClose}>
            {strings[language]?.close}
          </Button>
        </div>
      </Dialog>
    </ThemeProvider>
  );
};

export default AboutDialog;
