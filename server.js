import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

const MANIFEST = {
  id: "podnapisinet-fast-sl",
  version: "1.0.0",
  name: "Podnapisi.NET FAST (SL)",
  description: "Hitri slovenski podnapisi iz Podnapisi.NET",
  catalogs: [],
  resources: ["subtitles"],
  types: ["movie", "series"],
  idPrefixes: ["tt"],
};

// manifest
app.get("/manifest.json", (req, res) => {
  res.json(MANIFEST);
});

// subtitles route
app.get("/subtitles/:type/:id.json", async (req, res) => {
  const imdbId = req.params.id.replace(".json", "");

  const URL =
    "https://podnapisi.net/subtitles/search/?tbsl=1&sXML=1&movie=" + imdbId;

  try {
    const xml = await fetch(URL).then(r => r.text());

    // SL podnapisi filter
    const items = [...xml.matchAll(/<subtitle>([\s\S]*?)<\/subtitle>/g)]
      .map(m => m[1])
      .filter(s => s.includes("<languageId>2</languageId>")); // slovenski

    const subtitles = items.map(s => {
      const url = s.match(/<download>(.*?)<\/download>/)?.[1];
      const name = s.match(/<release>(.*?)<\/release>/)?.[1];
      return {
        id: "sl",
        type: "subtitles",
        url,
        lang: "Slovenian",
        title: name || "Slovenski podnapisi",
      };
    });

    res.json({ subtitles });
  } catch (e) {
    res.json({ subtitles: [] });
  }
});

// root
app.get("/", (req, res) => {
  res.send("✔ Podnapisi.NET FAST addon running!");
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("FAST Podnapisi running on", PORT));
