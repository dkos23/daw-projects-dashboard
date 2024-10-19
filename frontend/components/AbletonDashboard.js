import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, AppBar, Toolbar, IconButton, Menu, MenuItem, CssBaseline } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useRouter } from 'next/router'; 
import AbletonTrackTable from './AbletonTrackTable';
import AbletonProjectsTable from './AbletonProjectsTable';
import styles from '../styles/AbletonDashboard.module.css';
import strings from '../../locales/strings'; 

// Create a dark theme using Material-UI
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
  typography: {
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      marginBottom: '20px',
    },
  },
});

const AbletonDashboard = ({ language }) => {
  // const [language, setLanguage] = useState('en');
  const [anchorEl, setAnchorEl] = useState(null);
  const router = useRouter(); // Initialize the Next.js router

  const langStrings = strings[language] || strings['en'];

  // useEffect(() => {
  //   // Ensure that this code only runs on the client-side
  //   if (typeof window !== 'undefined') {
  //   }
  // }, []);

  // Update the window title when the component mounts
  useEffect(() => {
    document.title = langStrings.appName;
  }, [langStrings]); // Adding langStrings as a dependency ensures it updates when language changes
  

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Handle navigation to Settings
  const handleSettingsClick = () => {
    router.push('/settings');
    handleMenuClose();
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box className={styles['dashboard-container']}>
        {/* Global AppBar for the menu */}
        <AppBar position="static" className={styles['app-bar']}>
          <Toolbar>
            {/* Menu Icon */}
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              className={styles['menu-button']}
              onClick={handleMenuOpen}
            >
              <MenuIcon />
            </IconButton>

            {/* Title */}
            <Typography variant="h6" className={styles['title']}>
              {langStrings.home}
            </Typography>

            {/* Additional Menu */}
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              MenuListProps={{ 'aria-labelledby': 'basic-button' }}
            >
              <MenuItem onClick={handleMenuClose}>Home</MenuItem>
              <MenuItem onClick={handleMenuClose}>Tracks</MenuItem>
              <MenuItem onClick={handleSettingsClick}>Settings</MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Container maxWidth="false" className={styles['dashboard-content']}>
          <Typography variant="h1" className={styles['dashboard-header']}>
            {langStrings.appName}
          </Typography>

          {/* AbletonProjectsTable class component */}
          <AbletonProjectsTable language={language} />

          {/* Pass the track data as props to the AbletonTrackTable class component */}
          {/* <AbletonTrackTable audioTracks={AudioTrack} midiTracks={MidiTrack} /> */}
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default AbletonDashboard;
