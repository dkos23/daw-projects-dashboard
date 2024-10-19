import React from 'react';
import { Dialog, DialogTitle, DialogContent, Typography, Button, Box, CssBaseline } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
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
    const langStrings = strings[language] || strings['en'];
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Dialog open={open} onClose={onClose} PaperProps={{ style: { backgroundColor: '#121212', color: '#ffffff' } }}>
        <DialogTitle>{langStrings.aboutMyDawProjects}</DialogTitle>
        <DialogContent>
          {/* <Typography variant="body1" gutterBottom>
            My DAW Projects Dashboard v1.0
          </Typography> */}
          <Typography variant="body2" gutterBottom>
            {langStrings.aboutApp}
          </Typography>
          <Typography variant="body2" gutterBottom>
          {langStrings.aboutFeatures.title}
            <ul>
              {langStrings.aboutFeatures.list.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </Typography>
          <Typography variant="body2" gutterBottom>
            Developed by @CoreSignal <br />
            Credits to: nukearts <br />
            Copyright © 2024
          </Typography>
        </DialogContent>
        <Box display="flex" justifyContent="center" p={2}>
          <Button variant="contained" color="primary" onClick={onClose}>
            {langStrings.close}
          </Button>
        </Box>
      </Dialog>
    </ThemeProvider>
  );
};

export default AboutDialog;
