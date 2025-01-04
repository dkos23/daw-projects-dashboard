const fsPromises = require("fs/promises");
const unzipper = require("unzipper");
// const fs = require('fs');
// const path = require('path');
// const xml2js = require("xml2js");

const { parseStringPromise } = require('xml2js');

const config = require('../../public/app_config.js');

// Function to extract metadata from Studio One .song files
async function extractStudioOneMetadata(filePath) {
  const editorFilePath = 'Song/editor.xml';
  let tempo = null;
  let scaleInfo = {
    rootNote: null,
    name: null
  };
  try {
    // Read the .song file as a zip archive
    const zip = await fsPromises.readFile(filePath);
    const zipEntries = await unzipper.Open.buffer(zip);

    // -----------------------------------
    // Find and read the "metainfo.xml" file
    const metaInfoFile = zipEntries.files.find(file => file.path === 'metainfo.xml');
    if (metaInfoFile) {
      const metaInfoContent = await metaInfoFile.buffer();
      const xmlString = metaInfoContent.toString("utf8");

      // Parse the XML to extract metadata
      const parsedXml = await parseStringPromise(xmlString);

      // Retrieve tempo and other metadata fields if needed
      const tempoAttr = parsedXml.MetaInformation.Attribute.find(attr => attr.$.id === 'Media:Tempo');
      tempo = tempoAttr?.$.value ? parseFloat(tempoAttr.$.value) : null;
    } else {
      // throw new Error('metainfo.xml not found in the .song file.');
      console.warn("metainfo.xml not found in the .song file.");
    }

    // -----------------------------------
    // Find and read the "editor.xml" file
    const editorFile = zipEntries.files.find(file => file.path === editorFilePath);
    if (editorFile) {
      // Read and parse the XML content of editor.xml
      const editorContent = await editorFile.buffer();
      const xml = editorContent.toString();
      const parsedEditorXml = await parseStringPromise(xml);

      // LOG: DEBUG:
      // fs.writeFileSync("LOG-DEV_parsedEditorXml.json", JSON.stringify(parsedEditorXml, null, 2));

      // Using helper to find the 'MusicEditor' and 'MusicalScale' nodes
      const musicEditorNode = findAttributeById(parsedEditorXml, 'MusicEditor');
      const musicalScaleNode = findAttributeById(musicEditorNode, 'MusicalScale');

      // Navigate to the MusicalScale attributes
      if (musicalScaleNode && musicalScaleNode.$) {
        // scaleInfo.rootNote = rootNoteMapping[musicalScaleNode.$.rootNote] || 'Unknown';
        scaleInfo.rootNote = config.MIDI_NOTE_MAPPING[musicalScaleNode.$.rootNote] || 'N/A';
        scaleInfo.name = config.SCALE_MAPPING[musicalScaleNode.$.scale] || 'Unknown';
        // console.log(`Extracted MusicalScale: rootNote=${scaleInfo.rootNote}, scale=${scaleInfo.name}`);
      } else {
        console.warn('MusicalScale attributes not found in editor.xml');
      }

      // const trackCounts = findTrackCountsInStructure(result);

    } else {
      // throw new Error('metainfo.xml not found in the .song file.');
      console.warn("editor.xml not found in the .song file.");
    }

    return {
      tempo,
      scaleInfo,
    };
  } catch (error) {
    console.error(`Error extracting metadata from Studio One project: ${error.message}`);
    return null;
  }

  function findAttributeById(obj, id) {
    if (!obj || typeof obj !== 'object') return null;
  
    if (obj.$ && obj.$['x:id'] === id) {
      return obj;
    }
  
    for (const key in obj) {
      if (Array.isArray(obj[key])) {
        for (const item of obj[key]) {
          const found = findAttributeById(item, id);
          if (found) return found;
        }
      } else if (typeof obj[key] === 'object') {
        const found = findAttributeById(obj[key], id);
        if (found) return found;
      }
    }
    return null;
  }
}

module.exports = { extractStudioOneMetadata };
