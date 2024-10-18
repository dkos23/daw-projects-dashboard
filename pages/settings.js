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
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import styles from "../frontend/styles/Settings.module.css";
import strings from '../locales/strings'; 

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
  const [startPath, setStartPath] = useState("");
  const [donationAmount, setDonationAmount] = useState("");
  const [startPathError, setStartPathError] = useState('');
  const router = useRouter();

  // Load START_PATH from local storage on component mount
  useEffect(() => {
    const savedStartPath = localStorage.getItem('startPath');
    if (savedStartPath) {
      setStartPath(savedStartPath); // Load saved START_PATH if exists
    }

    // Set document title based on the current language
    document.title = strings.en.settingsPageTitle;
  }, []);

  // Validation function for the START_PATH field
  const validateStartPath = (path) => {
    if (!path) {
      return strings.en.startPathEmpty; // Error if empty
    }
    // You can add more complex validation logic for file paths if necessary
    if (!/^[A-Za-z]:[\\/]/.test(path)) {
      return strings.en.invalidPath;
    }
    return ''; // No error
  };

  const handleSave = () => {
    const validationError = validateStartPath(startPath);
    if (validationError) {
      setStartPathError(validationError); // Display error if validation fails
    } else {
      // Save the START_PATH to local storage
      localStorage.setItem('startPath', startPath);
      localStorage.setItem('donationAmount', donationAmount);
      console.log('Settings saved:', startPath, donationAmount);
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
              Home
            </Typography>
          </Toolbar>
        </AppBar>

        <Box className={styles["settings-content"]}>
          <Typography variant="h1" className={styles["settings-header"]}>
            Settings
          </Typography>

          {/* Input field for START_PATH */}
          <TextField
            label={strings.en.enterStartPath}
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

          <TextField
            label={strings.en.enterDonationAmount}
            variant="outlined"
            type="number"
            fullWidth
            margin="normal"
            value={donationAmount}
            onChange={(e) => setDonationAmount(e.target.value)}
            InputProps={{
              inputProps: { min: 0 },
              style: { color: "white" },
            }}
            className={styles["settings-input"]}
          />

          {/* Save button */}
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            className={styles["save-button"]}
          >
            {strings.en.saveButton}
          </Button>
        </Box>

        {/* Footer Section */}
        <Box component="footer" className={styles["footer"]}>
          <Typography variant="body2" align="center">
            My DAW Projects Dashboard v1.0
            <br />
            Developed by @CoreSignal <br/>Credits to: nukearts{" "}
            <br />© 2024
          </Typography>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default Settings;
