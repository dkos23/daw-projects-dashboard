const fsPromises = require("fs/promises");
const fs = require('fs');
const path = require("path");
const unzipper = require('unzipper');
const xml2js = require("xml2js");
const stream = require('stream');
// const Transform = require('stream');
const { gunzip } = require("zlib");
const { promisify } = require("util");
const { exec } = require("child_process");
const { parseStringPromise } = require('xml2js');
const { Parser } = require("json2csv");

const config = require('../public/app_config.js');

const { extractAbletonMetadata } = require('./daw_processors/abletonProcessor');
const { extractBitwigMetadata } = require('./daw_processors/bitwigProcessor');
const { extractStudioOneMetadata } = require('./daw_processors/studioOneProcessor');
const { extractAkaiMpcMetadata } = require('./daw_processors/akaiMpcProcessor');
const { extractCubaseMetadata } = require('./daw_processors/cubaseProcessor');

// Function to get the last modified date of a file
async function getFileDate(filePath) {
  try {
    const stats = await fsPromises.stat(filePath);
    return stats.mtime;
  } catch (error) {
    console.error(`Error fetching date for ${filePath}: ${error.message}`);
    return "N/A";
  }
}

/**
 * Bitwig can be used only if .dawproject exists -> Bitwig "Export Project" !!
 */

// NOTE no metadate for cubase cpr -> HeX binary
// Function to extract tempo from Cubase's compressed file


// Search files and call appropriate DAW processor based on file extension
async function searchFiles(dir, ext) {
  let results = [];
  try {
    const list = await fsPromises.readdir(dir, { withFileTypes: true });
    for (const file of list) {
      const filePath = path.join(dir, file.name);

      // Skip directories based on config
      if (file.isDirectory() && (config.directoriesToExclude.includes(file.name) || config.winDirectoriesToExclude.includes(file.name))) {
        continue;
      }

      if (file.isDirectory()) {
        results = results.concat(await searchFiles(filePath, ext));
      } else if (file.name.endsWith(ext)) {
        let metadata;
        switch (ext) {
          case '.als':
            metadata = await extractAbletonMetadata(filePath);
            break;
          case '.bwproject':
            metadata = await extractBitwigMetadata(filePath);
            break;
          case '.song':
            metadata = await extractStudioOneMetadata(filePath);
            break;
          case '.xpj':
            metadata = await extractAkaiMpcMetadata(filePath);
            break;
          case '.cpr':
            metadata = await extractCubaseMetadata(filePath);
            break;
          default:
            metadata = null;
        }

        const date = await getFileDate(filePath);
        results.push({ path: filePath, ...metadata, date });
      }
    }
  } catch (error) {
    console.error(`Error searching files: ${error.message}`);
  }
  return results;
}

/**
 * @param {*} filePath 
 */
function openExplorer(filePath) {
//   const directoryPath = path.dirname(filePath);
  exec(`explorer.exe /select,"${filePath}"`, (err) => {
    if (err) {
      console.error(`Error opening File Explorer: ${err.message}`);
    //   throw new Error("Failed to open File Explorer!");
    }
  });
}

/**
 * @param {*} startPath 
 * @param {*} files 
 * @returns csvPath
 */
async function exportToCsv(startPath, files) {
  try {
    const csvData = files.map((file) => ({
      projectName: file.path.split(/[/\\]/).pop().replace(".als", ""),
      tempo: file.tempo || "N/A",
      date: file.date || "N/A",
      path: file.path,
    }));

    // const fields = ["projectName", "tempo", "date", "path"];
    const fields = config.csvExportFields;
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(csvData);

    // If startPath is not provided, use the OS temp directory
    const csvPath = startPath
      ? path.join(startPath, config.csvExportFileName)
      : path.join(os.tmpdir(), config.csvExportFileName);

      fs.writeFileSync(csvPath, csv);

    console.log(`CSV saved at: ${csvPath}`);

    return csvPath;
  } catch (error) {
    console.error("Error exporting to CSV:", error);
    throw new Error("Failed to export CSV");
  }
}

// Export functions for use in Electron's main process
module.exports = {
  getFileDate,
  // extractTempoFromAbleton,
  // extractTempoFromStudioOne,
  searchFiles,
  openExplorer,
  exportToCsv,
};
