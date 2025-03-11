const unzipper = require("unzipper");
const xml2js = require("xml2js");
const fsPromises = require("fs/promises");
const config = require('../../public/app_config.js');

async function extractBitwigMetadata(filePath) {
  let tempo = null;
  try {
    const dawProjectPath = filePath.replace('.bwproject', '.dawproject');
    const exists = await fsPromises.access(dawProjectPath).then(() => true).catch(() => false);
    if (!exists) return null;

    const directory = await unzipper.Open.file(dawProjectPath);
    const projectFile = directory.files.find(file => file.path === 'project.xml');
    const projectContent = await projectFile.buffer();
    const xmlString = projectContent.toString('utf8');
    const parsedData = await xml2js.parseStringPromise(xmlString);
    // Navigate to the <Transport> tag and extract the <Tempo> tag's value attribute
    const tempoTag = parsedData?.Project?.Transport?.[0]?.Tempo?.[0];
    if (tempoTag && tempoTag.$?.value) {
      tempo = parseFloat(tempoTag.$.value); // Extract the tempo value as a float
    } else {
      // throw new Error('Tempo not found in project.xml');
      console.warn(`extractBitwigMetadata: Tempo not found in project.xml`);
    }

    // Extract <Track> nodes and count their contentType
    let midiTracks = null;
    let audioTracks = null;
    let returnTracks = null;
    if (parsedData?.Project) {
      const structureNode = parsedData?.Project?.Structure?.[0];
      if (!structureNode || !structureNode.Track) {
        // throw new Error('Tracks not found in project.xml');
        console.warn(`extractBitwigMetadata: Tracks not found in project.xml`);
      }
      const tracks = structureNode.Track;
      midiTracks = tracks.filter(track => track.$?.contentType === "notes").length;
      audioTracks = tracks.filter(track => track.$?.contentType === "audio").length;
      returnTracks = tracks.filter(track => track.$?.contentType === "return").length;
    }

    const trackCounts = { midiTracks, audioTracks, returnTracks }
    return {
      tempo: tempo,
      trackCounts,
      projectName: parsedData?.Project?.Application?.[0]?.$.name || null,
      author: null,
    };
  } catch (error) {
    console.error(`extractBitwigMetadata: Error extracting Bitwig metadata: ${error.message}`);
    return null;
  }
}

module.exports = { extractBitwigMetadata };
