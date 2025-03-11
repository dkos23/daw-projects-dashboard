const fsPromises = require("fs/promises");
const { gunzip } = require("zlib");
const { promisify } = require("util");
const xml2js = require("xml2js");
const { log } = require("console");
const fs = require("fs");
const config = require("../../public/app_config.js");

// Function to extract Ableton metadata
// TODO: Grundton aus xml  "ScaleInformation" "RootNote"
async function extractAbletonMetadata(filePath) {
  if (!filePath) {
    console.error("extractAbletonMetadata: File path is null or undefined.");
    return null;
  }

  try {
    const alsExists = await fsPromises
      .access(filePath)
      .then(() => true)
      .catch(() => false);
    if (!alsExists) {
      console.error(`extractAbletonMetadata: File does not exist at path: ${filePath}`);
      return null;
    }

    const fileBuffer = await fsPromises.readFile(filePath);
    // console.log(`File read successfully from path: ${filePath}`);

    // Detect GZIP compression by looking at the file header
    if (fileBuffer.slice(0, 2).toString("hex") === "1f8b") {
      const uncompressedData = await promisify(gunzip)(fileBuffer);

      const xmlString = uncompressedData.toString("utf8");

      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(xmlString);

      // Attempt to find tempo in XML structure
      const { tempo, scaleInfo } = findMetadataInStructure(result);
      // console.log(`Extracted tempo: ${tempo}, Scale Info: ${JSON.stringify(scaleInfo)}`);

      const trackCounts = findTrackCountsInStructure(result);

      return {
        tempo,
        scaleInfo,
        trackCounts,
        projectName: null,
        author: null,
      };
    } else {
      throw new Error(
        "extractAbletonMetadata: File is not GZIP compressed or not in the expected format."
      );
    }
  } catch (error) {
    console.error(
      `extractAbletonMetadata: Error extracting metadata from ${filePath}: ${error.message}`
    );
    return null;
  }
}

/**
 * 
 * @param {*} xmlStructure 
 * @returns 
 */
function findMetadataInStructure(xmlStructure) {
  let tempo = null;
  let scaleInfo = {
    rootNote: null,
    name: null,
  };

  if (!xmlStructure || typeof xmlStructure !== "object") {
    return metadata;
  }

  // fs.writeFileSync("xmlStructureLog.json", JSON.stringify(xmlStructure, null, 2));
  // console.log("xmlStructure written to xmlStructureLog.json");
  // return null;

  // Access the Manual tempo value in the specified XML structure path
  try {
    // tempo = xmlStructure?.Ableton?.LiveSet?.[0]?.MainTrack?.[0]?.DeviceChain?.[0]?.Mixer?.[0]?.Tempo?.[0]?.Manual?.[0]?.$?.Value;
    // if (tempo) {
    //   console.log(tempo);
    //   tempo = parseFloat(tempo); // Convert to a number if needed
    // }

    // Recursive function to search for Tempo in the XML structure
    function findTempo(node) {
      if (node?.Tempo?.[0]?.Manual?.[0]?.$?.Value) {
        return parseFloat(node.Tempo[0].Manual[0].$.Value);
      }
      for (const key in node) {
        if (typeof node[key] === "object") {
          const result = findTempo(node[key]);
          if (result !== null) return result;
        }
      }
      return null;
    }
  } catch (error) {
    console.error("findMetadataInStructure: Error extracting tempo:", error);
  }

  // Check for ScaleInformation directly within LiveSet
  try {
    const scaleInfoNode =
      xmlStructure?.Ableton?.LiveSet?.[0]?.ScaleInformation?.[0];
    if (scaleInfoNode) {
      const rootNoteValue = scaleInfoNode?.RootNote?.[0]?.$?.Value;
      scaleInfo.name = scaleInfoNode?.Name?.[0]?.$?.Value;

      // Convert rootNote to a musical note using MIDI mapping
      scaleInfo.rootNote =
        rootNoteValue !== undefined
          ? config.MIDI_NOTE_MAPPING[rootNoteValue]
          : null;
    }

    // Recursive function to search for ScaleInformation in the XML structure
    // function findScaleInfo(node) {
    //   if (node?.ScaleInformation?.[0]) {
    //     const rootNoteValue = node.ScaleInformation[0].RootNote?.[0]?.$?.Value;
    //     const nameValue = node.ScaleInformation[0].Name?.[0]?.$?.Value;
    //     return {
    //       rootNote: convertMIDIRootNoteToName(rootNoteValue),
    //       name: nameValue
    //     };
    //   }
    //   for (const key in node) {
    //     if (typeof node[key] === 'object') {
    //       const result = findScaleInfo(node[key]);
    //       if (result.rootNote || result.name) return result;
    //     }
    //   }
    //   return { rootNote: null, name: null };
    // }
  } catch (error) {
    console.error("findMetadataInStructure: Error extracting scale information:", error);
  }

  // Recursive search if necessary
  // for (const key in xmlStructure) {
  //   if (xmlStructure.hasOwnProperty(key) && typeof xmlStructure[key] === "object") {
  //     const foundData = findMetadataInStructure(xmlStructure[key]);
  //     if (foundData.tempo) tempo = foundData.tempo;
  //     if (foundData.scaleInfo.rootNote || foundData.scaleInfo.name) scaleInfo = foundData.scaleInfo;
  //   }
  // }

  tempo = findTempo(xmlStructure);

  return { tempo, scaleInfo };
}


// Optional helper function to map MIDI root note values to note names
function convertMIDIRootNoteToName(rootNote) {
  if (rootNote === undefined || rootNote === null) return null;
  const midiNoteMapping = {
    0: "C",
    1: "C#",
    2: "D",
    3: "D#",
    4: "E",
    5: "F",
    6: "F#",
    7: "G",
    8: "G#",
    9: "A",
    10: "A#",
    11: "B",
  };

  const noteNumber = parseInt(rootNote, 10);
  if (isNaN(noteNumber)) return null;

  const octave = Math.floor(noteNumber / 12);
  const note = midiNoteMapping[noteNumber % 12];

  return note ? `${note}${octave}` : null;
}

function findValue(xmlStructure, key) {
  if (!xmlStructure) return null;
  if (xmlStructure[key]) {
    return xmlStructure[key][0]?.$?.Value || null;
  }
  for (const k in xmlStructure) {
    if (typeof xmlStructure[k] === "object") {
      const result = findValue(xmlStructure[k], key);
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
function findTrackCountsInStructure(xmlStructure) {
  if (!xmlStructure || typeof xmlStructure !== "object") {
    return { midiTracks: 0, audioTracks: 0, returnTracks: 0 };
  }

  const tracksNode = xmlStructure?.Ableton?.LiveSet?.[0]?.Tracks?.[0];
  if (!tracksNode) {
    // console.error("Tracks node not found");
    return { midiTracks: 0, audioTracks: 0, returnTracks: 0 };
  }

  const midiTracks = tracksNode?.MidiTrack ? tracksNode.MidiTrack.length : 0;
  const audioTracks = tracksNode?.AudioTrack ? tracksNode.AudioTrack.length : 0;
  const returnTracks = tracksNode?.ReturnTrack
    ? tracksNode.ReturnTrack.length
    : 0;

  return { midiTracks, audioTracks, returnTracks };
}

module.exports = { extractAbletonMetadata };
