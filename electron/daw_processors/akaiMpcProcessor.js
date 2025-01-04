const fs = require("fs");
const xml2js = require("xml2js");
const config = require('../../public/app_config.js');

// Function to extract metadata from Akai MPC .xpj files
async function extractAkaiMpcMetadata(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, "utf8");

    // Parse the XML content to extract metadata
    const parsedXml = await xml2js.parseStringPromise(fileContent);
    const project = parsedXml.Project;

    const bpm = project?.BPM?.[0];
    const masterTempo = project?.["MasterTempo.Value"]?.[0];

    const tempo = bpm ? parseFloat(bpm) : parseFloat(masterTempo) || null;

    let trackCounts = 0;
    // Navigate to the <Mixer> node
    const mixerNode = project.Mixer?.[0]; // <Mixer> might be an array
    if (!mixerNode) {
      console.warn("No <Mixer> node found in the project.");
    } else {
      // Extract <Mixer.Return> nodes
      const mixerReturns = mixerNode["Mixer.Return"] || [];
      trackCounts = mixerReturns.length;
    }

    // fs.writeFileSync("xmlStructureLog.json", JSON.stringify(project.Mixer, null, 2));
    // console.log("xmlStructure written to xmlStructureLog.json");
    // console.log("trackCounts: " + trackCounts);

    return {
      tempo,
      trackCounts,
      projectName: project?.Name?.[0] || null,
      author: project?.Creator?.[0] || null,
    };
  } catch (error) {
    console.error(`Error extracting metadata from Akai MPC project: ${error.message}`);
    return null;
  }
}

module.exports = { extractAkaiMpcMetadata };
