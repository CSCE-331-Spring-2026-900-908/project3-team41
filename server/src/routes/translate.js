const express = require("express");
const router = express.Router();

const { translateTextsBatch } = require("../services/googleTranslate");

router.post("/", async (req, res) => {
  const { targetLang, texts } = req.body || {};

  if (!targetLang || typeof targetLang !== "string") {
    return res.status(400).json({ success: false, error: "Missing targetLang" });
  }

  if (!Array.isArray(texts) || texts.length === 0) {
    return res.status(400).json({ success: false, error: "Missing texts (array)" });
  }

  try {
    // Google Translate v2 has per-request limits; chunk so we still translate everything.
    const maxPerRequest = 128;
    const stringTexts = texts.map((t) => String(t));

    const translations = [];
    for (let i = 0; i < stringTexts.length; i += maxPerRequest) {
      // eslint-disable-next-line no-await-in-loop
      const chunkTranslations = await translateTextsBatch({
        targetLang,
        texts: stringTexts.slice(i, i + maxPerRequest),
      });
      translations.push(...chunkTranslations);
    }

    return res.json({
      success: true,
      translations,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      error: err.message || "Translation failed",
    });
  }
});

module.exports = router;

