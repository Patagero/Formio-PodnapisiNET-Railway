import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());

// LOAD MANIFEST
const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf8"));

// Root check
app.get("/", (req, res) => {
    res.send("✔ Podnapisi.NET FAST addon running!");
});

// Serve manifest.json
app.get("/manifest.json", (req, res) => {
    res.json(manifest);
});

// FAST subtitles endpoint
app.get("/subtitles/:type/:id.json", async (req, res) => {
    try {
        const imdbId = req.params.id.replace("tt", "");

        const url = `https://podnapisi.net/subtitles/search/advanced?imdbId=${imdbId}&language=sl`;

        const html = await fetch(url).then(r => r.text());

        // Extract subtitles via REGEX (FAST)
        const regex = /href="\/subtitles\/(\d+)-[^"]+"/g;

        const results = [];
        let match;
        while ((match = regex.exec(html)) !== null) {
            const pid = match[1];
            results.push({
                id: pid,
                url: `https://podnapisi.net/subtitles/${pid}/download`,
                lang: "sl",
                ext: "srt"
            });
        }

        return res.json({
            subtitles: results
        });

    } catch (err) {
        console.error("ERROR:", err);
        res.json({ subtitles: [] });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`✔ FAST subtitling addon running at port ${PORT}`);
});
