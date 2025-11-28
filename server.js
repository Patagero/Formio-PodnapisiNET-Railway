import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import { parseStringPromise } from "xml2js";

const app = express();
app.use(cors());

const BASE = "https://www.podnapisi.net/subtitles/search/old?sXML=1";

app.get("/", (req, res) => {
  res.send("✔ Podnapisi.NET FAST addon running!");
});

app.get("/manifest.json", (req, res) => {
  res.sendFile(process.cwd() + "/manifest.json");
});

// ---- MAIN SUBTITLE ENDPOINT ----
app.get("/subtitles/:type/:id", async (req, res) => {
  const { type, id } = req.params;

  try {
    const url = `${BASE}&keywords=${id}`;
    const xml = await fetch(url).then(r => r.text());

    const parsed = await parseStringPromise(xml);

    const items = parsed?.rss?.channel?.[0]?.item ?? [];

    const subtitles = items.map(item => ({
      id: item.guid?.[0] ?? "",
      lang: item["dc:language"]?.[0] ?? "unknown",
      filename: item.title?.[0] ?? "subtitle",
      url: item.link?.[0] ?? ""
    }));

    res.json({ subtitles });

  } catch (err) {
    console.error(err);
    res.json({ subtitles: [] });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("FAST ADDON running on " + PORT));
