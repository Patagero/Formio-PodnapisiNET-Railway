import express from "express";
import axios from "axios";
import cheerio from "cheerio";
import fs from "fs";

// Naloži manifest.json (brez assert)
const manifest = JSON.parse(fs.readFileSync("./manifest.json", "utf8"));

const app = express();

app.get("/manifest.json", (req, res) => {
  res.json(manifest);
});

// === ENDPOINT ZA PODNAPISI.NET ===

app.get("/subtitles/:imdbId", async (req, res) => {
  try {
    const imdb = req.params.imdbId.replace("tt", "");

    const url = `https://www.podnapisi.net/sl/subtitles/search/?keywords=${imdb}`;
    const html = await axios.get(url);
    const $ = cheerio.load(html.data);

    const subtitles = [];

    $("tr").each((i, el) => {
      const lang = $(el).find("td:nth-child(3)").text().trim();
      const link = $(el).find("a").attr("href");

      if (lang.includes("Slovenski")) {
        subtitles.push({
          lang: "Slovenian",
          url: "https://www.podnapisi.net" + link
        });
      }
    });

    res.json({ subtitles });

  } catch (err) {
    console.error("Napaka pri iskanju podnapisov:", err.message);
    res.json({ subtitles: [] });
  }
});

// Root redirect
app.get("/", (req, res) => {
  res.redirect("/manifest.json");
});

// Railway mora poslušati na 0.0.0.0
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("======================================");
  console.log(` Formio Podnapisi.NET add-on listening`);
  console.log(` PORT: ${PORT}`);
  console.log("======================================");
});
