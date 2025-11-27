import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

const BASE = "https://www.podnapisi.net";

// ---- Helper: extract download link from HTML ----
function extractLink(html) {
    const match = html.match(/href="(\/subtitles\/serve\/[^"]+)/);
    if (!match) return null;
    return BASE + match[1];
}

// ---- Helper: extract subtitle title ----
function extractTitle(html) {
    const match = html.match(/<title>(.*?)<\/title>/i);
    return match ? match[1].replace(" - Podnapisi.NET", "") : "Slovenski podnapisi";
}

// ---- MAIN SUBTITLE ROUTE ----
app.get("/subtitles/:type/:imdb/:season?/:episode?", async (req, res) => {
    try {
        const { imdb, type, season, episode } = req.params;
        const imdbId = imdb.replace("tt", "");

        let url = `${BASE}/sl/subtitles/search/?keywords=${imdbId}&language=2`;

        if (type === "series" && season && episode) {
            url += `&s=${season}&e=${episode}`;
        }

        const html = await fetch(url).then(r => r.text());

        const link = extractLink(html);
        if (!link) return res.json({ subtitles: [] });

        const title = extractTitle(html);

        const result = {
            subtitles: [
                {
                    id: link,
                    url: link,
                    lang: "sl",
                    title: title,
                    format: "srt"
                }
            ]
        };

        res.json(result);
    } catch (err) {
        console.error("Subtitle error:", err);
        res.json({ subtitles: [] });
    }
});

// ---- ROOT -> MANIFEST ----
app.get("/manifest.json", (req, res) => {
    res.sendFile(process.cwd() + "/manifest.json");
});

// ---- START SERVER ----
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log("🚀 FAST PodnapisiNET SL running on port", PORT);
});
