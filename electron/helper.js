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

// Promisify fs.access
// const access = promisify(fs.access);
// Promisify stream for better async/await handling
const pipelineAsync = promisify(stream);

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

// Function to extract tempo from Ableton's compressed .als file
async function extractTempoFromAbleton(filePath) {
  try {
    const alsFilePath = filePath.replace('.als', '.als');
    const alsExists = await fsPromises.access(alsFilePath).then(() => true).catch(() => false);
    if (!alsExists) {
      return null;
    }
    const fileBuffer = await fsPromises.readFile(alsFilePath);

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

// Stream-based function to extract tempo from Ableton .als files
// async function extractTempoFromAbletonStream(filePath) {
//   try {
//     const alsFilePath = filePath.replace('.als', '.als');
//     await fs.promises.access(alsFilePath, fs.constants.F_OK); // Check if file exists

//     const fileStream = fs.createReadStream(alsFilePath);
//     let parser = new xml2js.Parser();
//     let xmlString = '';
//     let isGzip = false;

//     // Read the first few bytes to check if it's GZIP compressed
//     const header = await new Promise((resolve, reject) => {
//       const headerBuffer = Buffer.alloc(2);
//       fileStream.once('readable', () => {
//         const chunk = fileStream.read(2); // Read the first two bytes (header)
//         if (chunk) {
//           chunk.copy(headerBuffer);
//           resolve(headerBuffer);
//         } else {
//           reject(new Error('Could not read header'));
//         }
//       });
//     });

//     if (header.toString('hex') === '1f8b') {
//       // File is GZIP compressed, use gunzip stream
//       isGzip = true;
//       fileStream.unshift(header); // Put the header back so that gunzip works properly
//     }

//     const transformStream = isGzip ? zlib.createGunzip() : fileStream;

//     // Transform stream to accumulate chunks into XML string
//     const accumulator = new Transform({
//       transform(chunk, encoding, callback) {
//         xmlString += chunk.toString('utf8');
//         callback(null, chunk);
//       }
//     });

//     // Use pipeline to handle the flow of streams
//     await pipelineAsync(transformStream, accumulator);

//     // Parse the accumulated XML string
//     const parsedData = await parser.parseStringPromise(xmlString);

//     // Return the found tempo
//     return findManualTempoInStructure(parsedData);
//   } catch (error) {
//     console.error(`Error extracting tempo from ${filePath}: ${error.message}`);
//     return null;
//   }
// }

/**
 * !! Bitwig can be used only if .dawproject exists -> Bitwig "Export Project" !!
 * 
 * @param {string} xmlFilePath - Path to the project.bwproject file.
 * @returns {Promise<string>} - The extracted tempo value or null if not found.
 */
async function extractTempoFromBitwig(filePath) {
  const dawproject = "project.xml";
  // let tempo = "[no dawproject file]";
  let tempo = null;
  try {
    // Change the extension to .dawproject
    const dawprojectFilePath = filePath.replace('.bwproject', '.dawproject');
    
    // Check if the .dawproject file exists in the same directory
    const dawprojectExists = await fsPromises.access(dawprojectFilePath).then(() => true).catch(() => false);
    
    if (!dawprojectExists) {
      // console.warn('.dawproject file not found in the Bitwig project folder.');
      return tempo;
    }
    // Unzip the .bwproject file
    const directory = await unzipper.Open.file(dawprojectFilePath);
    // Find the project.bwproject file within the zip
    const projectFile = directory.files.find(file => file.path === dawproject);
    
    if (!projectFile) {
      throw new Error('project.xml not found in the Bitwig .dawproject archive.');
    }
    
    // Extract the project.xml content
    const projectContent = await projectFile.buffer();
    const xmlString = projectContent.toString('utf8');
    const parsedData = await parseStringPromise(xmlString);

    // Navigate to the <Transport> tag and extract the <Tempo> tag's value attribute
    const tempoTag = parsedData?.Project?.Transport?.[0]?.Tempo?.[0];
    if (tempoTag && tempoTag.$?.value) {
      tempo = parseFloat(tempoTag.$.value); // Extract the tempo value as a float
    } else {
      throw new Error('Tempo not found in project.xml');
    }
    return tempo;
  } catch (error) {
    console.error('Error extracting tempo from Bitwig project:', error);
    return null;
  }
}

/**
 * Function to extract tempo from Studio One's metainfo.xml
 * @param {string} xmlFilePath - Path to the metainfo.xml file.
 * @returns {Promise<string>} - The extracted tempo value or null if not found.
 */
async function extractTempoFromStudioOne(filePath) {
  try {
    // Read the .song file as a zip
    const zip = await fsPromises.readFile(filePath);
    const zipEntries = await unzipper.Open.buffer(zip);

    // Look for "metainfo.xml" in the .song file (Studio One project)
    const metaInfoFile = zipEntries.files.find(file => file.path === 'metainfo.xml');
    if (metaInfoFile) {
      const metaInfoContent = await metaInfoFile.buffer();
      const xml = metaInfoContent.toString();

      // Parse the XML using xml2js
      const parsedXml = await xml2js.parseStringPromise(xml);

      // Find the Media:Tempo attribute and return its value
      const tempoAttr = parsedXml.MetaInformation.Attribute.find(attr => attr.$.id === 'Media:Tempo');
      const tempo = tempoAttr?.$.value || 'N/A'; // Default to 'N/A' if tempo is not found

      return tempo;
    } else {
      throw new Error('metainfo.xml not found in the .song file.');
    }
  } catch (error) {
    console.error(`Error extracting tempo from Studio One project: ${error.message}`);
    return null;
  }
}

/**
 * Function to extract tempo from Akai MPC's .xpj
 * @param {string} xmlFilePath - Path to the xpj file.
 * @returns {Promise<string>} - The extracted tempo value or null if not found.
 */
async function extractTempoFromAkaiMPC(filePath) {
  try {
    // Read the file content
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Parse the XML content
    const parser = new xml2js.Parser();
    const parsedXml = await parser.parseStringPromise(fileContent);
    
    // Navigate through the parsed XML structure to find the tempo
    const project = parsedXml?.Project;
    const bpm = project?.BPM?.[0]; // Extract <BPM> value
    const masterTempo = project?.['MasterTempo.Value']?.[0]; // Extract <MasterTempo.Value> if needed

    // Choose which value to return, prioritize <BPM> over <MasterTempo.Value>
    const tempo = bpm;

    if (tempo) {
      return parseFloat(tempo);
    } else {
      throw new Error('Tempo not found in the .xpj file.');
    }
  } catch (error) {
    console.error('Error extracting tempo from .xpj file:', error);
    return null;
  }
}

// TODO ?????????????????????????????????????????????????????????????????
// Function to extract tempo from Cubase's compressed file
async function extractTempoFromCubase(filePath) {
  try {
    const xmlString = filePath.toString("utf8");

    console.log(xmlString);
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xmlString);
    return findManualTempoInStructure(result);
  } catch (error) {
    console.error(`Error extracting tempo from ${filePath}: ${error.message}`);
    return null;
  }
}

// Function to search for eg:Ableton .als files
async function searchFiles(dir, ext) {
  let results = [];

  try {
    const list = await fsPromises.readdir(dir, { withFileTypes: true });
    let fileFound = false;
    let date = "";
  
    for (const file of list) {
      const filePath = path.join(dir, file.name);
  
      // Use the config to check if a directory should be excluded
      if (
        file.isDirectory() && (
          config.directoriesToExclude.includes(file.name) ||
          config.winDirectoriesToExclude.includes(file.name)
        )
      ) {
        continue;
      }
  
      let tempo;
      if (file.isDirectory()) {
        if (!fileFound) {
          results = results.concat(await searchFiles(filePath, ext));
        }
      } else if (file.name.endsWith(ext)) {
        if (ext === '.als') {
          tempo = await extractTempoFromAbleton(filePath);
        } else if (ext === '.song') {
          tempo = await extractTempoFromStudioOne(filePath);
        } else if (ext === '.bwproject') {
          tempo = await extractTempoFromBitwig(filePath);
        } else if (ext === '.cpr') {
          tempo = await extractTempoFromCubase(filePath);
        } else if (ext === '.xpj') {
          tempo = await extractTempoFromAkaiMPC(filePath);
        }
  
        date = await getFileDate(filePath);
        results.push({ path: filePath, tempo, date });
        fileFound = true;
      }
    }
    // log for debugging :
    // results.forEach(result => {
    //   console.log("results: " + JSON.stringify(result,null,2));
    // });
    
  } catch (error) {
    if (error.code === 'EPERM' || error.code === 'EACCES') {
      return; // Skip directories without sufficient permissions
    } else {
      console.error(`Error searching files in directory`, error);
    }
  }
  return results;
}

function openExplorer(filePath) {
//   const directoryPath = path.dirname(filePath);
  exec(`explorer.exe /select,"${filePath}"`, (err) => {
    if (err) {
      console.error(`Error opening File Explorer: ${err.message}`);
    //   throw new Error("Failed to open File Explorer!");
    }
  });
}

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
  extractTempoFromAbleton,
  extractTempoFromStudioOne,
  searchFiles,
  openExplorer,
  exportToCsv,
};
