import express from "express";
import fetch from "node-fetch";
import fs from "fs";

const app = express();

// Naložimo manifest.json
const manifest = JSON.parse(fs.readFileSync("./manifest.json", "utf8"));

app.get("/manifest.json", (req, res) => {
    res.json(manifest);
});

// Glavna API pot
app.get("/:imdbId/:season/:episode", async (req, res) => {
    try {
        const { imdbId, season, episode } = req.params;

        // Iščemo samo slovenske podnapise
        const url = `https://www.podnapisi.net/sl/subtitles/search/?keywords=${imdbId}&language=sl`;
        const html = await fetch(url).then(r => r.text());

        const results = [];

        // Zelo preprosto regex iskanje
        const regex = /href="(\/sl\/subtitles\/[^"]+)"[^>]*>([^<]+)<\/a>/g;
        let m;

        while ((m = regex.exec(html)) !== null) {
            const link = "https://www.podnapisi.net" + m[1];

            // Dodamo samo če vsebuje SxxEyy
            if (m[2].includes(`S${season}E${episode}`)) {
                results.push({
                    id: link,
                    title: m[2],
                    url: link
                });
            }
        }

        res.json({ subtitles: results });
    } catch (err) {
        console.error(err);
        res.json({ subtitles: [] });
    }
});

// Root -> manifest
app.get("/", (req, res) => res.redirect("/manifest.json"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
    console.log("=====================================");
    console.log(`🚀 FAST Podnapisi Addon running on ${PORT}`);
    console.log("=====================================");
});
