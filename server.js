import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 8080;

app.get("/", (req, res) => {
    res.send("✓ Podnapisi.NET FAST addon running!");
});

// helper: get JSON safely
async function get(url) {
    try {
        const r = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0",
                "Accept": "application/json"
            }
        });
        return await r.json();
    } catch (e) {
        return null;
    }
}

/*
   MAIN ENDPOINT  
   /subtitles/movie/:imdb/:filename.json
*/
app.get("/subtitles/movie/:imdb/:filename", async (req, res) => {
    const imdb_id = req.params.imdb.replace("tt", "");

    const apiUrl = `https://podnapisi.net/api/v1/subtitles?imdb_id=${imdb_id}&languages=sl`;

    const data = await get(apiUrl);

    if (!data || !data.data || data.data.length === 0)
        return res.json({ subtitles: [] });

    const subtitles = data.data.map(s => ({
        id: s.id,
        lang: "sl",
        url: `https://podnapisi.net/subtitles/${s.attributes.download}`,
        hearing_impaired: s.attributes.hearing_impaired,
        fps: s.attributes.fps,
        release: s.attributes.release,
        encoding: "UTF-8"
    }));

    return res.json({ subtitles });
});

app.listen(PORT, () => console.log("FAST Podnapisi addon running on", PORT));
