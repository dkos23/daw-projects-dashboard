import React, { useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, useMediaQuery } from '@mui/material';
import TreeView from './TreeView';  // Assuming TreeView is in the same folder
import { createTheme, ThemeProvider } from '@mui/material/styles';
import styles from '../styles/TreeViewModal.module.css';
import strings from '../../public/locales/strings';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const TreeViewModal = ({ open, onClose, data, language }) => {
  const fullScreen = useMediaQuery('(max-width:800px)');  // Responsive handling for small screens

  const langStrings = strings[language] || strings['en'];

  return (
    <ThemeProvider theme={darkTheme}>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="xl"
        fullWidth
        fullScreen={fullScreen}  // Adapt modal to small screens
        PaperProps={{
          style: {
            // backgroundColor: '#121212',
            backgroundColor: '#000000',  // Dark background
            // color: '#ffffff',
            color: '#9e9e9e',
            maxHeight: '100vh',  // Increase the maximum height of the modal to 90% of the viewport height
            height: '90vh', 
          },
        }}
        className={styles['modal-dialog']}
      >
        <DialogTitle>{langStrings.treeViewHeader}</DialogTitle>
        <DialogContent className={styles['dialog-content']}>
          {/* TreeView component inside the dialog */}
          <TreeView data={data} />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="primary">
            {langStrings.close}
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
};

export default TreeViewModal;
