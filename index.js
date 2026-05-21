const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");

// ── Configuration ──────────────────────────────────────────────
const GITHUB_RAW_BASE =
  "https://raw.githubusercontent.com/RodriguezMoraGG/subs/main/Subs";

// Registry of supported shows
// Key: IMDB ID, Value: { folder, episodes, lang, label }
const SHOWS = {
  tt1882240: {
    folder: "Beelzebub",
    prefix: "Beelzebub",
    episodes: 60,
    season: 1,
    lang: "spa",           // ISO 639-2 code for Spanish
    label: "Espanol (MX)", // shown in Stremio subtitle picker
  },
  // To add more shows later, just add another entry here
};

// ── Manifest ───────────────────────────────────────────────────
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

// ── Subtitle handler ───────────────────────────────────────────
builder.defineSubtitlesHandler(({ type, id }) => {
  // id format for series: "tt1882240:1:17" (imdb:season:episode)
  const [imdbId, seasonStr, episodeStr] = id.split(":");
  const season = parseInt(seasonStr, 10);
  const episode = parseInt(episodeStr, 10);

  const show = SHOWS[imdbId];

  if (!show) {
    return Promise.resolve({ subtitles: [] });
  }

  if (show.season !== season || episode < 1 || episode > show.episodes) {
    return Promise.resolve({ subtitles: [] });
  }

  // Zero-pad episode number to match filename (e.g., "01", "17", "60")
  const epPad = String(episode).padStart(2, "0");
  const filename = `${show.prefix} - ${epPad}_GR_mex.srt`;
  const url = `${GITHUB_RAW_BASE}/${encodeURIComponent(show.folder)}/${encodeURIComponent(filename)}`;

  const subtitles = [
    {
      id: `gr-mex-${imdbId}-s${season}e${episode}`,
      url: url,
      lang: show.lang,
      // Stremio shows this label if lang isn't a recognized ISO code
      // but "spa" is recognized, so we append to id for clarity
    },
  ];

  return Promise.resolve({ subtitles });
});

// ── Server ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 7000;

// When run directly (local dev / Render / Railway)
if (require.main === module) {
  serveHTTP(builder.getInterface(), { port: PORT }).then(({ url }) => {
    console.log(`Addon running at: ${url}`);
    console.log(`Install in Stremio: ${url}/manifest.json`);
  });
}

// Export for Vercel serverless
module.exports = builder.getInterface();
