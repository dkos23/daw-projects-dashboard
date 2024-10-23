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
import strings from '../locales/strings';
// import config from '../public/app_config.js';

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

const Settings = ({ language }) => {
  const [startPath, setStartPath] = useState("");
  const [startPathError, setStartPathError] = useState('');
  const [donationAmount, setDonationAmount] = useState("");
  const [daw, setDaw] = useState("");
  const router = useRouter();
  const langStrings = strings[language] || strings['en'];

  // hook to load and save stuff
  useEffect(() => {
    const savedStartPath = localStorage.getItem('startPath');
    const savedDaw = localStorage.getItem('selectedDAW');

    if (savedStartPath) {
      setStartPath(savedStartPath); // Load saved START_PATH if exists
    }

    if (savedDaw) {
      setDaw(savedDaw);
    }

    // Set document title based on the current language
    document.title = langStrings.settingsPageTitle;
  }, []);

  const validateStartPath = (path) => {
    if (!path) {
      return langStrings.startPathEmpty; // Error if empty
    }
    // You can add more complex validation logic for file paths if necessary
    if (!/^[A-Za-z]:[\\/]/.test(path)) {
      return langStrings.invalidPath;
    }
    return ''; // No error
  };

  const validateDonationAmount = (amount) => {
    // if (!amount) {
    //   return "Thank you for entering amount > 5 :)";
    // }

    if (amount <= 5) {
      return "For negative amount YOU do not get payed :)";
    }
    return '';
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
              {langStrings.home}
            </Typography>
          </Toolbar>
        </AppBar>

        <Box className={styles["settings-content"]}>
          <Typography variant="h1" className={styles["settings-header"]}>
            {langStrings.settings}
          </Typography>

          {/* Input field for START_PATH */}
          <TextField
            label={langStrings.enterStartPath}
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
            <InputLabel>{langStrings.selectDaw}</InputLabel>
            <Select
              value={daw}
              label={langStrings.selectDaw}
              onChange={(e) => setDaw(e.target.value)}  // Set the selected DAW
              style={{ color: 'white' }}  // White text for dark mode
            >
              <MenuItem value="Ableton">Ableton</MenuItem>
              <MenuItem value="Bitwig">Bitwig</MenuItem>
              <MenuItem value="StudioOne">Studio One</MenuItem>
              <MenuItem value="Cubase">Cubase</MenuItem>
              <MenuItem value="AkaiMPC">Akai MPC</MenuItem>
            </Select>
          </FormControl>

          <TextField
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
          />

          {/* Save button */}
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            className={styles["save-button"]}
          >
            {langStrings.saveButton}
          </Button>
        </Box>

        {/* Footer Section */}
        <Box component="footer" className={styles["footer"]}>
          <Typography variant="body2" align="center">
            DAW Projects Dashboard v1.0
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
