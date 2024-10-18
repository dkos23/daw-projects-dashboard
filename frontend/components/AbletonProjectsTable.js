import React, { Component } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, TextField, TableSortLabel, Box, CircularProgress, Button } from '@mui/material';
// import axios from 'axios';
import styles from '../styles/AbletonProjectsTable.module.css';
import strings from '../../locales/strings';

class AbletonProjectsTable extends Component {
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
    };
    // Bind the exportToCsv function to this class component
    this.exportToCsv = this.exportToCsv.bind(this);
  }

  // Fetch the ALS project files and tempo from the server on component mount
  componentDidMount() {
    this.fetchProjectFiles();
  }

  // Handle opening file explorer
  handleOpenExplorer = async (filePath) => {
    try {
      // Send a request to Electron backend via IPC to open File Explorer
      const response = await window.fileOperations.openExplorer(filePath);
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
      const response = await window.fileOperations.exportToCsv(startPath, this.state.projects);

      // console.log(response.message);

      console.log('CSV saved at: ', response.path);
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

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

      console.log('Using START_PATH:', startPath);

      // Send the START_PATH to the Electron backend via IPC
      const results = await window.fileOperations.searchFiles(startPath, '.als');
      const files = results.map((file) => {
        const projectName = file.path.split(/[/\\]/).pop().replace('.als', '');
        const fileDate = new Date(file.date);
        const formattedDate = `${fileDate.getFullYear()}.${String(fileDate.getMonth() + 1).padStart(2, '0')}.${String(
          fileDate.getDate()
        ).padStart(2, '0')}`;
        return {
          projectName: projectName || 'N/A',
          tempo: file.tempo || 'N/A',
          date: formattedDate || 'N/A',
          path: file.path,
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

      if (Array.isArray(aValue)) aValue = aValue[0] || '';
      if (Array.isArray(bValue)) bValue = bValue[0] || '';

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
    const { projects, searchTerm, sortConfig, loading, fileCount } = this.state;

    // Apply both filtering and sorting to projects
    const filteredProjects = this.getFilteredProjects(projects);
    const sortedProjects = this.getSortedProjects(filteredProjects);

    return (
      <div>
        {/* Conditionally show description text only when loading */}
        {loading && (
          <Typography variant="body1" className={styles['dashboard-description']}>
            {strings.en.dashboardText}
          </Typography>
        )}

        {/* Search Input and Total Projects Found side by side */}
        {!loading && (
          <Box display="flex" alignItems="center" justifyContent="space-between" className={styles['search-container']}>
            <TextField
              label={strings.en.searchProjects}
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
              {strings.en.totalProjectsFound} {fileCount}
            </Typography>

            <Button
              className={styles['export-button']}
              onClick={this.exportToCsv}
            >
              {strings.en.exportCsv}
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
                        {strings.en.noProjectsFound}
                      </TableSortLabel>
                    </TableCell>

                    <TableCell className={styles['table-header-cell']}>
                      <TableSortLabel
                        active={sortConfig.key === 'date'}
                        direction={sortConfig.direction === 'asc' ? 'asc' : 'desc'}
                        onClick={() => this.handleSort('date')}
                      >
                        {strings.en.date}
                      </TableSortLabel>
                    </TableCell>

                    <TableCell className={styles['table-header-cell']}>
                      <TableSortLabel
                        active={sortConfig.key === 'tempo'}
                        direction={sortConfig.direction === 'asc' ? 'asc' : 'desc'}
                        onClick={() => this.handleSort('tempo')}
                      >
                        {strings.en.tempo}
                      </TableSortLabel>
                    </TableCell>

                    <TableCell className={styles['table-header-cell']}>Path to Project</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedProjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        {strings.en.noProjectsFound}
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedProjects.map((project, index) => (
                      <TableRow key={index}>
                        <TableCell className={styles['table-cell']}>{project.projectName}</TableCell>
                        <TableCell className={styles['table-cell']}>{project.date}</TableCell>
                        <TableCell className={styles['table-cell']}>{project.tempo}</TableCell>
                        <TableCell className={styles['table-cell']}>
                          <button
                            className={styles['project-link']}
                            onClick={() => this.handleOpenExplorer(project.path)}
                          >
                            {project.path}
                          </button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        )}
      </div>
    );
  }
}

export default AbletonProjectsTable;
