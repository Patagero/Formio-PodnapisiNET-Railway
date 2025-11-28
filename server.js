import express from "express";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// ---------- MANIFEST ----------
app.get("/manifest.json", (req, res) => {
    res.sendFile(path.join(__dirname, "manifest.json"));
});

// ---------- SEARCH ----------
app.get("/subtitles/:type/:imdbid", async (req, res) => {
    const imdb = req.params.imdbid.replace("tt", "");

    try {
        const url = `https://www.podnapisi.net/subtitles/search/imdbid-${imdb}/slo`;

        const html = await fetch(url).then(r => r.text());

        const results = [...html.matchAll(/href="(\/subtitles\/.*?)".*?class="release">([^<]+)/gs)]
            .map(m => ({
                id: m[1],
                filename: m[2],
                lang: "sl-SI"
            }));

        res.json({ subtitles: results });

    } catch (e) {
        res.json({ subtitles: [] });
    }
});

app.get("/", (req, res) => {
    res.send("✔ Podnapisi.NET FAST addon running!");
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("FAST addon running on port", PORT));
