import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Container,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Button,
  TextField,
  Box,
  MenuItem,
  Select,
  InputLabel,
  FormControl
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import styles from "../frontend/styles/Settings.module.css";
import { useLanguage } from "../frontend/context/LanguageContext";

// Create a dark theme using Material-UI
const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
  typography: {
    h1: {
      fontSize: "2.5rem",
      fontWeight: 600,
      marginBottom: "20px",
    },
  },
});

const Settings = () => {
  const { language, changeLanguage, strings } = useLanguage();
  const [startPath, setStartPath] = useState("");
  const [startPathError, setStartPathError] = useState('');
  const [donationAmount, setDonationAmount] = useState("");
  const [daw, setDaw] = useState("");
  const router = useRouter();

  // Log
  // useEffect(() => {
  //   console.log("🟢 [SETTINGS] daw:", daw);
  // }, [daw]);

  // hook to load and save stuff
  useEffect(() => {
    const savedStartPath = typeof window !== "undefined" ? localStorage.getItem("startPath") : null;
    const savedDaw = typeof window !== "undefined" ? localStorage.getItem("selectedDAW") : null;

    if (savedStartPath) setStartPath(savedStartPath);
    if (savedDaw) setDaw(savedDaw);

    // console.log("🟢 [SETTINGS] Loaded Language:", language);
  }, [language]);

  const validateStartPath = (path) => {
    if (!path) return strings[language]?.startPathEmpty || "Start path cannot be empty";
    if (!/^[A-Za-z]:[\\/]/.test(path)) return strings[language]?.invalidPath || "Invalid path format.";
    return "";
  };

  const validateDonationAmount = (amount) => {
    if (amount <= 5) {
      return "For negative amount YOU do not get payed :)";
    }
    return '';
  };

  const handleLanguageChange = (event) => {
    const newLanguage = event.target.value;
    changeLanguage(newLanguage); // Update language globally
  };

  const handleSave = () => {
    // const validationErrorAmount = validateDonationAmount(donationAmount);
    // if (validationErrorAmount) {
    //   console.info(validationErrorAmount);  // Show the error
    //   // return;  // Don't save if validation fails
    // } else {
    //   localStorage.setItem('donationAmount', donationAmount);
    // }

    const validationError = validateStartPath(startPath);
    if (validationError) {
      setStartPathError(validationError); // Display error if validation fails
    } else {
      // Save the START_PATH to local storage
      localStorage.setItem('startPath', startPath);
      localStorage.setItem('donationAmount', donationAmount);
      
      if (!daw) {
        setDaw("Ableton");
      }
      localStorage.setItem('selectedDAW', daw);
      
      console.log('Settings saved:', startPath, donationAmount, daw);
      // Go back to the main page after saving
      router.push('/');
    }
  };

  const handleSaveSettings = (e) => {
    setStartPath(e.target.value);
    setStartPathError(validateStartPath(e.target.value)); // Validate as the user types
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <Container maxWidth="false" className={styles["settings-container"]}>
        <AppBar position="static" className={styles["app-bar"]}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="go back"
              onClick={() => router.back()}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" className={styles["title"]}>
              {strings[language]?.home || "Home"}
            </Typography>
          </Toolbar>
        </AppBar>

        <Box className={styles["settings-content"]}>
          <Typography variant="h1" className={styles["settings-header"]}>
            {strings[language]?.settings || "Settings"}
          </Typography>

          {/* Input field for START_PATH */}
          <TextField
            label={strings[language]?.enterStartPath || "Enter your Start Folder"}
            variant="outlined"
            fullWidth
            margin="normal"
            value={startPath}
            onChange={handleSaveSettings}
            error={Boolean(startPathError)}
            helperText={startPathError}
            InputProps={{
              style: { color: 'white' }, // White text for dark mode
            }}
            className={styles["settings-input"]}
          />

          {/* DAW Dropdown Selection */}
          <FormControl fullWidth margin="normal" className={styles["settings-input"]}>
            <InputLabel>{strings[language]?.selectDaw || "Select your DAW"}</InputLabel>
            <Select
              value={daw}
              // label={langStrings.selectDaw}
              onChange={(e) => setDaw(e.target.value)}
              style={{ color: 'white' }}  // White text for dark mode
            >
              <MenuItem value="Ableton">Ableton</MenuItem>
              <MenuItem value="Bitwig">Bitwig</MenuItem>
              <MenuItem value="StudioOne">Studio One</MenuItem>
              <MenuItem value="Cubase">Cubase</MenuItem>
              <MenuItem value="AkaiMPC">Akai MPC</MenuItem>
            </Select>
          </FormControl>

          {/* Language Dropdown Selection */}
          <FormControl fullWidth margin="normal" className={styles["settings-input"]}>
            <InputLabel>{strings[language]?.selectLanguage || "Select your language"}</InputLabel>
            <Select value={language} onChange={handleLanguageChange} style={{ color: 'white' }}>
              <MenuItem value="en">{strings[language]?.english || "English"}</MenuItem>
              <MenuItem value="es">{strings[language]?.spanish || "Spanish"}</MenuItem>
              <MenuItem value="de">{strings[language]?.german || "German"}</MenuItem>
            </Select>
          </FormControl>

          {/* <TextField
            label={langStrings.enterDonationAmount}
            variant="outlined"
            type="number"
            fullWidth
            margin="normal"
            value={donationAmount}
            onChange={(e) => setDonationAmount(e.target.value)}
            disabled={true}
            InputProps={{
              inputProps: { min: 5 },
              style: { color: "white" },
            }}
            className={styles["settings-input"]}
          /> */}

          {/* Save button */}
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            className={styles["save-button"]}
          >
            {strings[language]?.saveButton || "Save Settings"}
          </Button>

          {/* <Button variant="contained" color="primary" onClick={() => router.push('/')} className={styles["save-button"]}>
            {strings[language]?.saveButton || "Save Settings"}
          </Button> */}
        </Box>

        {/* Footer Section */}
        <Box component="footer" className={styles["footer"]}>
          <Typography variant="body2" align="center">
            DAW Projects Dashboard v1.0.0
            <br />
            Developed by @CoreSignal
            <br />© 2025
          </Typography>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default Settings;
