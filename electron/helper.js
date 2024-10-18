const fs = require("fs/promises");
const fsNode = require('fs');
const path = require("path");
const { gunzip } = require("zlib");
const { promisify } = require("util");
const { exec } = require("child_process");
const xml2js = require("xml2js");
const { Parser } = require("json2csv");

// Function to get the last modified date of a file
async function getFileDate(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return stats.mtime;
  } catch (error) {
    console.error(`Error fetching date for ${filePath}: ${error.message}`);
    return "N/A";
  }
}

// Function to extract tempo from Ableton's .als file
async function extractTempoFromAls(filePath) {
  try {
    const fileBuffer = await fs.readFile(filePath);

    // Detect GZIP compression by looking at the file header
    if (fileBuffer.slice(0, 2).toString("hex") === "1f8b") {
      const uncompressedData = await promisify(gunzip)(fileBuffer);
      const xmlString = uncompressedData.toString("utf8");
      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(xmlString);
      return findManualTempoInStructure(result);
    } else {
      throw new Error(
        "File is not GZIP compressed or not in the expected format."
      );
    }
  } catch (error) {
    console.error(`Error extracting tempo from ${filePath}: ${error.message}`);
    return null;
  }
}

// Function to search for Ableton .als files
async function searchFiles(dir, ext) {
  let results = [];
  const list = await fs.readdir(dir, { withFileTypes: true });
  let alsFileFound = false;

  for (const file of list) {
    const filePath = path.join(dir, file.name);

    if (
      file.isDirectory() &&
      (file.name === "Backup" || file.name === "Samples")
    ) {
      continue;
    }

    if (file.isDirectory()) {
      if (!alsFileFound) {
        results = results.concat(await searchFiles(filePath, ext));
      }
    } else if (file.name.endsWith(ext)) {
      const tempo = await extractTempoFromAls(filePath);
      const date = await getFileDate(filePath);
      results.push({ path: filePath, tempo, date });
      alsFileFound = true;
    }
  }
  return results;
}

// Helper to find tempo in XML structure
function findManualTempoInStructure(xmlStructure) {
  if (!xmlStructure || typeof xmlStructure !== "object") {
    return null;
  }

  if (xmlStructure.Tempo) {
    for (const tempoElement of xmlStructure.Tempo) {
      if (
        tempoElement.Manual &&
        tempoElement.Manual[0] &&
        tempoElement.Manual[0].$.Value
      ) {
        return tempoElement.Manual[0].$.Value;
      }
    }
  }

  for (const key in xmlStructure) {
    if (
      xmlStructure.hasOwnProperty(key) &&
      typeof xmlStructure[key] === "object"
    ) {
      const foundTempo = findManualTempoInStructure(xmlStructure[key]);
      if (foundTempo) {
        return foundTempo;
      }
    }
  }

  return null;
}

// Helper function to open File Explorer at the specified file path
function openExplorer(filePath) {
//   const directoryPath = path.dirname(filePath);
  exec(`explorer.exe /select,"${filePath}"`, (err) => {
    if (err) {
      console.error(`Error opening File Explorer: ${err.message}`);
    //   throw new Error("Failed to open File Explorer!");
    }
  });
}

// Helper function to export files to CSV
async function exportToCsv(startPath, files) {
  try {
    const csvData = files.map((file) => ({
      projectName: file.path.split(/[/\\]/).pop().replace(".als", ""),
      tempo: file.tempo || "N/A",
      date: file.date || "N/A",
      path: file.path,
    }));

    const fields = ["projectName", "tempo", "date", "path"];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(csvData);

    // If startPath is not provided, use the OS temp directory
    const csvPath = startPath
      ? path.join(startPath, "My DAW Projects.csv")
      : path.join(os.tmpdir(), "My DAW Projects.csv");

      fsNode.writeFileSync(csvPath, csv);

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
  extractTempoFromAls,
  searchFiles,
  openExplorer,
  exportToCsv,
};
