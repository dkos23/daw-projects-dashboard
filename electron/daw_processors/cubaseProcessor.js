const fs = require("fs");
const fsPromises = require("fs/promises");
const unzipper = require("unzipper");
const { parseStringPromise } = require("xml2js");

const config = require("../../public/app_config.js");

// Function to extract metadata from Cubase .cpr files
async function extractCubaseMetadata(filePath) {
  let tempo = null;
  let scaleInfo = {
    rootNote: null,
    name: null,
  };

  try {
    // parseRIFF(filePath);

    const buffer = fs.readFileSync(filePath);

    // Convert binary buffer to a string to find readable sections
    const fileString = buffer.toString("utf8");

    // Attempt to locate XML-like sections or keywords
    const xmlStart = fileString.indexOf("<");
    if (xmlStart !== -1) {
      const xmlData = fileString.slice(xmlStart);

      // Use an XML parser if applicable
      const xml2js = require("xml2js");
      const parser = new xml2js.Parser();

      parser
        .parseStringPromise(xmlData)
        .then((result) => {
          console.log(
            "Extracted XML Metadata:",
            JSON.stringify(result, null, 2)
          );
        })
        .catch((err) => {
          console.error("Error parsing XML:", err.message);
        });
    } else {
      console.error("No XML-like metadata found in the file.");
    }

    return {
      tempo,
      scaleInfo,
    };
  } catch (error) {
    console.error(
      `Error extracting metadata from Cubase project: ${error.message}`
    );
    return null;
  }
}

function parseRIFF(filePath) {
  const buffer = fs.readFileSync(filePath);

  let offset = 0;

  // Helper function to read bytes
  function readChunkHeader() {
    const id = buffer.toString("ascii", offset, offset + 4); // Chunk ID
    const size = buffer.readUInt32LE(offset + 4); // Chunk size
    offset += 8; // Move to the chunk's data section
    return { id, size };
  }

  // Start parsing
  const riffHeader = readChunkHeader();
  if (riffHeader.id !== "RIFF") {
    throw new Error("Not a valid RIFF file");
  }

  console.log(`File Size: ${riffHeader.size}`);

  // Main loop to read chunks
  while (offset < buffer.length) {
    const chunk = readChunkHeader();
    console.log(`Found chunk: ${chunk.id}, Size: ${chunk.size}`);

    // Extract specific metadata if needed
    if (chunk.id === "XXXX") {
      // Replace XXXX with the specific chunk ID you're looking for (e.g., tempo).
      const data = buffer.slice(offset, offset + chunk.size);
      console.log(`Chunk Data: ${data}`);
    }

    // Move offset to the next chunk
    offset += chunk.size;
  }
}

// Recursive function to find tempo in Cubase XML structure
function findTempoInCubaseXml(xmlStructure) {
  if (!xmlStructure || typeof xmlStructure !== "object") return null;

  for (const key in xmlStructure) {
    if (
      key.toLowerCase().includes("tempo") &&
      xmlStructure[key]?.[0]?.$?.value
    ) {
      return parseFloat(xmlStructure[key][0].$.value);
    }
    if (typeof xmlStructure[key] === "object") {
      const result = findTempoInCubaseXml(xmlStructure[key]);
      if (result) return result;
    }
  }
  return null;
}

module.exports = { extractCubaseMetadata };
