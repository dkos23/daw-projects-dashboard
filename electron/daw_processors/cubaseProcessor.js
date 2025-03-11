const fs = require("fs");
const path = require("path");
const xml2js = require("xml2js");
const fsPromises = require("fs/promises");
const unzipper = require("unzipper");
const { parseStringPromise } = require("xml2js");

const config = require("../../public/app_config.js");

// Function to extract metadata from Cubase .xml files
async function extractCubaseMetadata(filePath) {
  let tempo = null;
  let scaleInfo = {
    rootNote: null,
    name: null,
  };
  let trackCounts = {
    midiTracks: 0,
    audioTracks: 0,
    returnTracks: 0,
  };

  try {
    // Get the directory of the file
    const directoryPath = path.dirname(filePath);

    // Get all files in the directory
    const files = fs.readdirSync(directoryPath);

    // Filter XML files
    const xmlFiles = files.filter((file) => file.endsWith(".xml"));

    if (xmlFiles.length === 0) {
      // console.error("No XML files found in the directory.");
      return null;
    }

    let parsedXml = null;
    let found = false;

    // Search for the XML file containing the "tracklist" node
    for (const xmlFile of xmlFiles) {
      const fullPath = path.join(directoryPath, xmlFile);

      try {
        // Read the XML file
        const xmlContent = fs.readFileSync(fullPath, "utf8");

        // Parse the XML
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(xmlContent);

        // Check if the "tracklist" node exists
        if (result?.tracklist) {
          parsedXml = result;
          found = true;
          console.log(`extractCubaseMetadata: Found 'tracklist' in: ${xmlFile}`);
          break;
        }
      } catch (err) {
        console.error(`extractCubaseMetadata: Error parsing ${xmlFile}: ${err.message}`);
      }
    }

    if (!found) {
      console.error("extractCubaseMetadata: No valid XML file with 'tracklist' found.");
      return null;
    }

    // Extract track counts using the helper function
    trackCounts = findCubaseTrackCounts(parsedXml);

    return {
      tempo,
      scaleInfo,
      trackCounts,
      projectName: null,
      author: null,
    };
  } catch (error) {
    console.error(`extractCubaseMetadata: Error extracting metadata from Cubase project: ${error.message}`);
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

/**
 * 
 * @param {*} xmlStructure 
 * @returns {Object using shorthand property names}
 */
function findCubaseTrackCounts(xmlStructure) {
  if (!xmlStructure || typeof xmlStructure !== "object") {
    return { midiTracks: 0, audioTracks: 0, returnTracks: 0 };
  }

  // Navigate to the <tracklist> and extract the <list name="track">
  const tracklist = xmlStructure?.tracklist;
  if (!tracklist) {
    console.error("findCubaseTrackCounts: Tracklist node not found");
    return { midiTracks: 0, audioTracks: 0, returnTracks: 0 };
  }

  const trackNodes = tracklist?.list?.filter((node) => node.$?.name === "track") || [];
  if (trackNodes.length === 0) {
    console.warn("findCubaseTrackCounts: No tracks found in the tracklist");
    return { midiTracks: 0, audioTracks: 0, returnTracks: 0 };
  }

  // Extract and count MIDI, Audio, and Return tracks
  let midiTracks = 0;
  let audioTracks = 0;
  let returnTracks = 0;

  trackNodes.forEach((trackNode) => {
    const trackObjects = trackNode?.obj || [];
    trackObjects.forEach((track) => {
      const trackClass = track.$?.class;

      if (trackClass === "MMidiTrackEvent") {
        midiTracks++;
      } else if (trackClass === "MAudioTrackEvent") {
        audioTracks++;
      } else if (trackClass === "MReturnTrackEvent") {
        returnTracks++;
      }
    });
  });

  return { midiTracks, audioTracks, returnTracks };
}

module.exports = { extractCubaseMetadata };
