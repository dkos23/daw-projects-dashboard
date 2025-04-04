import React, { Component } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, TextField, TableSortLabel, Box, CircularProgress, Button, Snackbar } from '@mui/material';
import TreeViewModal from './TreeViewModal';
import { useLanguage } from "../context/LanguageContext";
import styles from '../styles/DawProjectsTable.module.css';

// DEV use mocked data !!!!
// import mockProjects from '../../public/data/MockProjects';

class DawProjectsTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      projects: [], // Dynamically load project names from backend
      searchTerm: '',
      sortConfig: {
        key: null,
        direction: 'asc',
      },
      loading: true,
      fileCount: 0,
      fileExtension: '.als',
      showTreeViewModal: false,
      csvExportSuccess: false,
    };
    // Bind the functions to this class component
    this.openTreeViewModal = this.openTreeViewModal.bind(this);
    this.closeTreeViewModal = this.closeTreeViewModal.bind(this);
    this.exportToCsv = this.exportToCsv.bind(this);
    this.handleCloseSnackbar = this.handleCloseSnackbar.bind(this);
  }

  componentDidMount() {
    this.updateFileExtension();
  }

  componentDidUpdate(prevProps, prevState) {
    const savedDAW = typeof window !== "undefined" ? localStorage.getItem('selectedDAW') : null;
    const currentFileExtension = this.getFileExtension(savedDAW);
  
    // Only update if fileExtension has changed
    if (currentFileExtension !== prevState.fileExtension) {
      this.setState({ fileExtension: currentFileExtension }, this.fetchProjectFiles);
    }
  }

  updateFileExtension() {
    const selectedDAW = typeof window !== "undefined" ? localStorage.getItem('selectedDAW') : null;
    let fileExtension = '.als';

    switch (selectedDAW) {
      case 'StudioOne': fileExtension = '.song'; break;
      case 'Bitwig': fileExtension = '.bwproject'; break;
      case 'Cubase': fileExtension = '.cpr'; break;
      case 'AkaiMPC': fileExtension = '.xpj'; break;
      default: fileExtension = '.als';
    }
    this.setState({ fileExtension }, this.fetchProjectFiles);
  }

  getFileExtension(selectedDAW) {
    switch (selectedDAW) {
      case 'StudioOne': return '.song';
      case 'Bitwig': return '.bwproject';
      case 'Cubase': return '.cpr';
      case 'AkaiMPC': return '.xpj';
      default: return '.als';
    }
  }

  openTreeViewModal() {
    this.setState({ showTreeViewModal: true });
  }

  // Close Tree View Modal
  closeTreeViewModal() {
    this.setState({ showTreeViewModal: false });
  }

  // Handle opening file explorer
  handleOpenExplorer = async (filePath) => {
    try {
      // Send a request to Electron backend via IPC to open File Explorer
      const response = await window.electronAPI.openExplorer(filePath);
      console.log(response.message);
    } catch (error) {
      console.error('Error opening File Explorer:', error);
    }
  };

  // CSV Export functionality
  exportToCsv = async () => {
    try {
      const startPath = localStorage.getItem('startPath');
      if (!startPath) {
        console.error('START_PATH not found in local storage');
        return;
      }
      console.log('START_PATH for csv export: ' + startPath);

      // Call the Electron backend to export CSV
      const response = await window.electronAPI.exportToCsv(startPath, this.state.projects);
      // Show success message
      this.setState({ csvExportSuccess: true });

      // Automatically hide success message after 3 seconds
      setTimeout(() => {
        this.setState({ csvExportSuccess: false });
      }, 3000);

      console.log('CSV saved at: ', response.path);
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  // Close Snackbar
  handleCloseSnackbar() {
    this.setState({ csvExportSuccess: false });
  }

  /**
   * Fetch project files
   */
  fetchProjectFiles = async () => {
    this.setState({ loading: true }); // Set loading state to true before fetching
    try {
      const startPath = localStorage.getItem('startPath');
      if (!startPath) {
        console.error('START_PATH not found in local storage');
        return;
      }

      // const notAvailableEmoji = '❌';
      const notAvailableEmoji = '✖';

      // Fetch the file extension from state
      const { fileExtension } = this.state;

      console.log('Using START_PATH:', startPath + ' - File extension: ' + fileExtension);

      // Send the START_PATH to the Electron backend via IPC
      const results = await window.electronAPI.searchFiles(startPath, fileExtension);
      const files = results.map((file) => {
        const projectName = file.path.split(/[/\\]/).pop().replace(fileExtension, '');
        const fileDate = new Date(file.date);
        // const formattedDate = `${fileDate.getFullYear()}.${String(fileDate.getMonth() + 1).padStart(2, '0')}.${String(
        //   fileDate.getDate()
        // ).padStart(2, '0')}`;
        const formattedDate = new Intl.DateTimeFormat(this.props.language, {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(fileDate);

        // console.log('formattedDate:', formattedDate);

        // Concatenate root note and scale name for display in one column
        const scaleInfo = file.scaleInfo
          ? `${file.scaleInfo.rootNote || notAvailableEmoji} ${file.scaleInfo.name || notAvailableEmoji}`
          : notAvailableEmoji;

        let trackCounts = notAvailableEmoji;
        
        switch (fileExtension) {
          case ".als":
          case ".bwproject":
          case ".song":
            trackCounts = file.trackCounts
              ? `MIDI: ${file.trackCounts.midiTracks}\nAudio: ${file.trackCounts.audioTracks}\nReturn: ${file.trackCounts.returnTracks}`
              : notAvailableEmoji;
            break;
          case ".xpj":
            trackCounts = `${file.trackCounts || notAvailableEmoji}`;
            break;
          case ".cpr":
            trackCounts = file.trackCounts
              ? `MIDI: ${file.trackCounts.midiTracks}\nAudio: ${file.trackCounts.audioTracks}\nReturn: ${file.trackCounts.returnTracks}`
              : notAvailableEmoji;
            break;
          default:
            break;
        }
        // trackCounts = file.trackCounts
        //   ? `MIDI: ${file.trackCounts.midiTracks}\nAudio: ${file.trackCounts.audioTracks}\nReturn: ${file.trackCounts.returnTracks}`
        //   : notAvailableEmoji;

        // console.log("fetchProjectFiles" + JSON.stringify(file,null,2));
        

        return {
          projectName: projectName || notAvailableEmoji,
          tempo: file.tempo || notAvailableEmoji,
          author: file.author || notAvailableEmoji,
          scaleInfo: scaleInfo,
          date: formattedDate || notAvailableEmoji,
          path: file.path,
          trackCounts: trackCounts,
        };
      });

      this.setState({ projects: files, fileCount: files.length, loading: false });
    } catch (error) {
      console.error('Error fetching project files:', error);
      this.setState({ loading: false });
    }
  };

  // Handle search input changes
  handleSearchChange = (event) => {
    this.setState({ searchTerm: event.target.value });
  };

  // Handle sorting changes
  handleSort = (key) => {
    const { sortConfig } = this.state;
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;  // Reset sorting
    }
    this.setState({
      sortConfig: { key, direction },
    });
  };

  // Sort the projects based on the sortConfig
  getSortedProjects = (projects) => {
    const { sortConfig } = this.state;
    if (!sortConfig.key || !sortConfig.direction) return projects;

    const sortedProjects = [...projects];
    sortedProjects.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // if (Array.isArray(aValue)) aValue = aValue[0] || '';
      // if (Array.isArray(bValue)) bValue = bValue[0] || '';

      // Ensure that 'tempo' is sorted numerically, not alphabetically
      if (sortConfig.key === 'tempo') {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sortedProjects;
  };

  // Filter projects based on search term (case-insensitive)
  getFilteredProjects = (projects) => {
    const { searchTerm } = this.state;
    if (!searchTerm) return projects;
    return projects.filter((project) =>
      project.projectName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };


  render() {
    const { projects, searchTerm, sortConfig, loading, fileCount, showTreeViewModal, csvExportSuccess } = this.state;
    const { strings, language } = this.props; // Get strings from props (passed by wrapper)
    const langStrings = strings[language] || strings["en"];

    // Apply both filtering and sorting to projects
    const filteredProjects = this.getFilteredProjects(projects);
    const sortedProjects = this.getSortedProjects(filteredProjects);

    return (
      <div>
        {/* Conditionally show description text only when loading */}
        {loading && (
          <Typography variant="body1" className={styles['dashboard-description']}>
            {langStrings.dashboardText_1}
            <br></br>
            <br></br>
            {langStrings.dashboardText_2}
          </Typography>
        )}

        {/* Search Input and Total Projects Found side by side */}
        {!loading && (
          <Box display="flex" alignItems="center" justifyContent="space-between" className={styles['search-container']}>
            <TextField
              label={langStrings.searchProjects}
              variant="outlined"
              value={searchTerm}
              onChange={this.handleSearchChange}
              className={styles['search-input']}
              InputProps={{
                className: styles['search-input'],
              }}
            />

            {/* Total Projects Found  and Export CSV */}
            <Typography className={styles['total-projects']}>
              {langStrings.totalProjectsFound} {fileCount}
            </Typography>

            {/* Button to open Tree View Modal */}
            <Button
              className={styles['export-button']}
              onClick={this.openTreeViewModal}
              disabled={this.state.fileCount === 0}
            >
              {langStrings.showTreeView}
            </Button>

            <Button
              className={styles['export-button']}
              onClick={this.exportToCsv}
              disabled={this.state.fileCount === 0}
            >
              {langStrings.exportCsv}
            </Button>
          </Box>
        )}

        {/* Show loading spinner while data is being fetched */}
        {loading ? (
          <Box className={styles['loading-container']}>
            <CircularProgress color="secondary" />
          </Box>
        ) : (
          <div>
            {/* Projects Table */}
            <TableContainer component={Paper} className={styles['table-container']}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell className={styles['table-header-cell']}>
                      <TableSortLabel
                        active={sortConfig.key === 'projectName'}
                        direction={sortConfig.direction === 'asc' ? 'asc' : 'desc'}
                        onClick={() => this.handleSort('projectName')}
                      >
                        {langStrings.projectName}
                      </TableSortLabel>
                    </TableCell>

                    <TableCell className={styles['table-header-cell']}>
                      <TableSortLabel
                        active={sortConfig.key === 'date'}
                        direction={sortConfig.direction === 'asc' ? 'asc' : 'desc'}
                        onClick={() => this.handleSort('date')}
                      >
                        {langStrings.date}
                      </TableSortLabel>
                    </TableCell>

                    <TableCell className={styles['table-header-cell']}>
                      <TableSortLabel
                        active={sortConfig.key === 'tempo'}
                        direction={sortConfig.direction === 'asc' ? 'asc' : 'desc'}
                        onClick={() => this.handleSort('tempo')}
                      >
                        {langStrings.tempo}
                      </TableSortLabel>
                    </TableCell>

                    <TableCell className={styles['table-header-cell']}>
                      <TableSortLabel
                        active={sortConfig.key === 'scaleInfo'}
                        direction={sortConfig.direction === 'asc' ? 'asc' : 'desc'}
                        onClick={() => this.handleSort('scaleInfo')}
                      >
                        {langStrings.rootNoteScale}
                      </TableSortLabel>
                    </TableCell>

                    <TableCell className={styles['table-header-cell']}>{langStrings.pathToProject}</TableCell>

                    <TableCell className={styles['table-header-cell']}>{langStrings.tracks}</TableCell>


                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedProjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        {langStrings.noProjectsFound}
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedProjects.map((project, index) => (
                      <TableRow key={index}>
                        <TableCell className={styles['table-cell']}>{project.projectName}</TableCell>
                        <TableCell className={styles['table-cell']}>{project.date}</TableCell>
                        <TableCell className={styles['table-cell']}>{project.tempo}</TableCell>
                        <TableCell className={styles['table-cell']}>{project.scaleInfo}</TableCell>
                        <TableCell className={styles['table-cell']}>
                          <button
                            className={styles['project-link']}
                            onClick={() => this.handleOpenExplorer(project.path)}
                          >
                            {project.path}
                          </button>
                        </TableCell>
                        <TableCell className={styles['table-cell-custom']}
                          style={{ width: '100px', maxWidth: '150px' }}
                          >
                          {project.trackCounts}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        )}

        {/* Tree View Modal */}
        <TreeViewModal
          open={showTreeViewModal}
          onClose={this.closeTreeViewModal}
          // data={mockProjects}
          data={this.state.projects}
          language={language}
        />

        {/* Snackbar to show export success message */}
        <Snackbar
          open={csvExportSuccess}
          autoHideDuration={3000}
          onClose={this.handleCloseSnackbar}
          message={langStrings.exportCsvSuccess || 'CSV Exported Successfully!'}
        />

      </div>
    );
  }
}

// Wrap the class component in a functional component to use the language context
const DawProjectsTableWrapper = () => {
  const { language, strings } = useLanguage(); // Get global language state
  return <DawProjectsTable language={language} strings={strings} />;
};

export default DawProjectsTableWrapper;
