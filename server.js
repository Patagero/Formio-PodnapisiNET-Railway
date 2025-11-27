import express from "express";

const app = express();
const PORT = process.env.PORT || 8080;

// ====== STREMIO MANIFEST ======
const manifest = {
  id: "podnapisinet-fast-sl",
  version: "1.0.0",
  name: "Podnapisi.NET FAST (SL ONLY)",
  description: "Ultra-fast Slovene subtitles from Podnapisi.NET",
  types: ["movie", "series"],
  catalogs: [],
  resources: ["subtitles"],
  idPrefixes: ["tt"]
};

// Serve manifest.json
app.get("/manifest.json", (req, res) => {
  res.json(manifest);
});

// ====== MAIN SUBTITLES ROUTE ======
app.get("/subtitles/:type/:imdb_id.json", async (req, res) => {
  const imdb = req.params.imdb_id.replace("tt", "");
  const apiUrl = `https://podnapisi.net/subtitles/search/advanced?imdbId=${imdb}&language=sl`;

  try {
    const response = await fetch(apiUrl, {
      headers: { "Accept": "application/json" }
    });

    const data = await response.json();

    if (!data || !data.data || data.data.length === 0) {
      return res.json({ subtitles: [] });
    }

    const subtitles = data.data.map((s) => ({
      id: String(s.id),
      lang: "sl",
      url: `https://podnapisi.net/subtitles/${s.id}/download`,
      filename: s.attributes.release || "Slovene subtitles"
    }));

    res.json({ subtitles });

  } catch (err) {
    console.error(err);
    res.json({ subtitles: [] });
  }
});

// Root route
app.get("/", (req, res) => {
  res.send("✓ Podnapisi.NET FAST addon running!");
});

app.listen(PORT, () => console.log("FAST ADDON RUNNING on port " + PORT));
