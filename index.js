const { addonBuilder, serveHTTP, getRouter } = require("stremio-addon-sdk");
const express = require("express");

// -- Configuration --
const GITHUB_RAW_BASE =
  "https://raw.githubusercontent.com/RodriguezMoraGG/subs/main/Subs";

const SHOWS = {
  tt1882240: {
    folder: "Beelzebub",
    prefix: "Beelzebub",
    episodes: 60,
    season: 1,
    lang: "spa",
  },
};

// -- Manifest --
const manifest = {
  id: "community.gr.mex.subs",
  version: "1.0.0",
  name: "GR Mexican Subs",
  description:
    "Mexican Spanish subtitles translated from European Spanish fansubs",
  resources: ["subtitles"],
  types: ["series"],
  catalogs: [],
  idPrefixes: ["tt"],
};

const builder = new addonBuilder(manifest);

// -- Subtitle handler --
builder.defineSubtitlesHandler(({ type, id }) => {
  const [imdbId, seasonStr, episodeStr] = id.split(":");
  const season = parseInt(seasonStr, 10);
  const episode = parseInt(episodeStr, 10);

  const show = SHOWS[imdbId];
  if (!show) return Promise.resolve({ subtitles: [] });
  if (show.season !== season || episode < 1 || episode > show.episodes)
    return Promise.resolve({ subtitles: [] });

  const epPad = String(episode).padStart(2, "0");
  const filename = show.prefix + " - " + epPad + "_GR_mex.srt";
  const url =
    GITHUB_RAW_BASE +
    "/" +
    encodeURIComponent(show.folder) +
    "/" +
    encodeURIComponent(filename);

  return Promise.resolve({
    subtitles: [
      {
        id: "gr-mex-" + imdbId + "-s" + season + "e" + episode,
        url: url,
        lang: show.lang,
      },
    ],
  });
});

// -- Server --
const addonInterface = builder.getInterface();

if (require.main === module) {
  const PORT = process.env.PORT || 7000;
  serveHTTP(addonInterface, { port: PORT }).then(function (server) {
    console.log("Addon running at: " + server.url);
    console.log("Install in Stremio: " + server.url + "/manifest.json");
  });
}

// Export Express app for Vercel
const app = express();
app.use(getRouter(addonInterface));
module.exports = app;
